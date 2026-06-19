import { prisma } from "./prisma";
import type { AnalyticsEventType, Prisma } from "@prisma/client";

/**
 * Analytics service layer.
 *
 * For the pilot we persist every event to the AnalyticsEvent table so the
 * funnel (posted → viewed → interested → contacted → hired → completed) is
 * queryable from day one. The interface is provider-agnostic: a later
 * Amplitude/PostHog/GA4 integration only needs to be added inside trackEvent().
 *
 * Fire-and-forget by design — analytics must never break a user action, so
 * failures are swallowed.
 */
export interface TrackInput {
  type: AnalyticsEventType;
  userId?: string | null;
  jobId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

export async function trackEvent(input: TrackInput): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        type: input.type,
        userId: input.userId ?? null,
        jobId: input.jobId ?? null,
        metadata: input.metadata,
      },
    });
    // TODO: forward to Amplitude/PostHog/GA4 here (same payload).
  } catch (err) {
    // Never let analytics break the request.
    if (process.env.NODE_ENV !== "production") {
      console.warn("[analytics] failed to record event", input.type, err);
    }
  }
}

/** Convenience helpers so call sites read clearly. */
export const Analytics = {
  jobCreated: (jobId: string, userId?: string) =>
    trackEvent({ type: "JOB_CREATED", jobId, userId }),
  jobViewed: (jobId: string, userId?: string) =>
    trackEvent({ type: "JOB_VIEWED", jobId, userId }),
  jobInterested: (jobId: string, userId?: string) =>
    trackEvent({ type: "JOB_INTERESTED", jobId, userId }),
  workerContacted: (jobId: string, userId?: string) =>
    trackEvent({ type: "WORKER_CONTACTED", jobId, userId }),
  workerHired: (jobId: string, userId?: string) =>
    trackEvent({ type: "WORKER_HIRED", jobId, userId }),
  jobCompleted: (jobId: string, userId?: string) =>
    trackEvent({ type: "JOB_COMPLETED", jobId, userId }),
};
