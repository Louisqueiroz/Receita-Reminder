export interface User {
  email: string;
  name: string;
  fcmToken?: string;
  createdAt: Date;
}

export interface Prescription {
  id?: string;
  userId: string;
  imageUrls: string[];
  rawText: string;
  uploadedAt: Date;
}

export interface Medicine {
  id?: string;
  userId: string;
  prescriptionId: string;
  name: string;
  dosage: string;
  instructions: string;
  times: string[];
  durationDays: number | null;
  startDate: string;
  active: boolean;
}

export interface Dose {
  id?: string;
  userId: string;
  medicineId: string;
  scheduledAt: Date;
  status: "pending" | "taken" | "skipped";
  respondedAt?: Date;
  notificationSent: boolean;
  followUpSent: boolean;
  note?: string;
}

export interface ExtractedMedicine {
  name: string;
  dosage: string;
  instructions: string;
  frequency: string;
  duration: string;
}
