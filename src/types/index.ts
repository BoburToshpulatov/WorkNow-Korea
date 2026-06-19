import type {
  Job,
  EmployerProfile,
  User,
  WorkerProfile,
  JobInterest,
  SavedJob,
  NotificationPreference,
} from "@prisma/client";

export type JobWithEmployer = Job & {
  employer: EmployerProfile;
};

export type JobWithRelations = Job & {
  employer: EmployerProfile;
  interests: (JobInterest & { user: UserWithProfiles })[];
  savedBy: SavedJob[];
};

export type UserWithProfiles = User & {
  workerProfile: WorkerProfile | null;
  employerProfile: EmployerProfile | null;
  notificationPrefs: NotificationPreference | null;
};

export type ApplicantWithProfile = JobInterest & {
  user: User & { workerProfile: WorkerProfile | null };
};
