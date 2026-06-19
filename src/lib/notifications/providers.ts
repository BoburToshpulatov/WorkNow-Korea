/**
 * Notification provider adapters.
 *
 * NOTIFICATION_PROVIDER (mock | sms | kakao) picks the active external channel.
 * SMS_PROVIDER (solapi | coolsms | generic) picks the SMS vendor. When SMS env
 * is incomplete the provider degrades to MOCKED so the pilot never breaks.
 *
 * Secrets are never logged. Each adapter returns a normalized result the caller
 * persists to NotificationLog.
 */
import { createHmac, randomBytes } from "crypto";

export type DeliveryStatus = "PENDING" | "SENT" | "FAILED" | "MOCKED";
export type ProviderChannel = "SMS" | "KAKAO";

export interface SendResult {
  status: DeliveryStatus;
  error?: string;
  providerMessageId?: string; // safe metadata (no secrets)
}

export interface NotificationProvider {
  readonly name: string;
  send(recipient: string, message: string): Promise<SendResult>;
}

const IS_DEV = process.env.NODE_ENV !== "production";

/** Always "mocked" — logs in dev, never calls an external service. */
export class MockNotificationProvider implements NotificationProvider {
  readonly name = "mock";
  async send(recipient: string, message: string): Promise<SendResult> {
    if (IS_DEV) console.log(`[notify:mock] -> ${recipient}: ${message}`);
    return { status: "MOCKED" };
  }
}

/** True when all required SMS env vars are present. */
export function smsConfigured(): boolean {
  return !!(
    process.env.SMS_PROVIDER_KEY &&
    process.env.SMS_PROVIDER_SECRET &&
    process.env.SMS_SENDER_PHONE
  );
}

/**
 * Real SMS via Solapi/Coolsms (same API) or a generic HTTP endpoint.
 * Falls back to MOCKED when not configured.
 */
export class SmsNotificationProvider implements NotificationProvider {
  readonly name = "sms";
  private key = process.env.SMS_PROVIDER_KEY;
  private secret = process.env.SMS_PROVIDER_SECRET;
  private sender = process.env.SMS_SENDER_PHONE;
  private vendor = (process.env.SMS_PROVIDER ?? "solapi").toLowerCase();
  private baseUrl = process.env.SMS_API_BASE_URL;

  async send(recipient: string, message: string): Promise<SendResult> {
    if (!smsConfigured()) {
      if (IS_DEV) console.log(`[notify:sms:mock] -> ${recipient}: ${message}`);
      return { status: "MOCKED" };
    }
    try {
      if (this.vendor === "generic") return await this.sendGeneric(recipient, message);
      return await this.sendSolapi(recipient, message); // solapi | coolsms
    } catch (e) {
      return { status: "FAILED", error: e instanceof Error ? e.message : "sms error" };
    }
  }

  /** Solapi / Coolsms: HMAC-SHA256 signed REST call. */
  private async sendSolapi(to: string, text: string): Promise<SendResult> {
    const base = this.baseUrl || "https://api.solapi.com";
    const date = new Date().toISOString();
    const salt = randomBytes(16).toString("hex");
    const signature = createHmac("sha256", this.secret!)
      .update(date + salt)
      .digest("hex");

    const res = await fetch(`${base}/messages/v4/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `HMAC-SHA256 apiKey=${this.key}, date=${date}, salt=${salt}, signature=${signature}`,
      },
      body: JSON.stringify({
        message: { to: digits(to), from: digits(this.sender!), text },
      }),
    });

    if (!res.ok) {
      // Read a short error code only; never echo credentials.
      const body = await res.text().catch(() => "");
      return { status: "FAILED", error: `http ${res.status} ${body.slice(0, 120)}` };
    }
    const data = (await res.json().catch(() => ({}))) as { messageId?: string };
    return { status: "SENT", providerMessageId: data.messageId };
  }

  /** Generic adapter: POST { to, from, text } to SMS_API_BASE_URL with Bearer key. */
  private async sendGeneric(to: string, text: string): Promise<SendResult> {
    if (!this.baseUrl) return { status: "FAILED", error: "SMS_API_BASE_URL missing" };
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.key}`,
      },
      body: JSON.stringify({ to: digits(to), from: digits(this.sender!), text }),
    });
    if (!res.ok) {
      return { status: "FAILED", error: `http ${res.status}` };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string; messageId?: string };
    return { status: "SENT", providerMessageId: data.messageId ?? data.id };
  }
}

function digits(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

/** KakaoTalk Alimtalk (알림톡) placeholder — real call still TODO. */
export class KakaoNotificationProvider implements NotificationProvider {
  readonly name = "kakao";
  private key = process.env.KAKAO_API_KEY;

  async send(recipient: string, message: string): Promise<SendResult> {
    if (!this.key) {
      if (IS_DEV) console.log(`[notify:kakao:mock] -> ${recipient}: ${message}`);
      return { status: "MOCKED" };
    }
    try {
      // TODO: POST to KakaoTalk Alimtalk with KAKAO_API_KEY + approved template.
      if (IS_DEV) console.log(`[notify:kakao] -> ${recipient}: ${message}`);
      return { status: "SENT" };
    } catch (e) {
      return { status: "FAILED", error: e instanceof Error ? e.message : "kakao error" };
    }
  }
}

/** Resolve the active external provider from NOTIFICATION_PROVIDER. */
export function getActiveProvider(): NotificationProvider {
  switch (process.env.NOTIFICATION_PROVIDER) {
    case "sms":
      return new SmsNotificationProvider();
    case "kakao":
      return new KakaoNotificationProvider();
    case "mock":
    default:
      return new MockNotificationProvider();
  }
}
