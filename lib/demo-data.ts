export type Role = "patient" | "staff" | "clinician" | "admin";

export type DemoUser = {
  id: string;
  name: string;
  initials: string;
  role: Role;
  clinicId: string;
};

export type CareEntry = {
  id: string;
  clinicId: string;
  patientId: string;
  authorId: string;
  authorName: string;
  authorRole: Role | "system";
  type: string;
  title: string;
  content: string;
  createdAt: string;
  patientVisible: boolean;
  riskLevel: "critical" | "high" | "medium" | "routine";
  version: number;
  sourceLabel?: string;
  confidence?: number;
  reviewState?: "pending_review" | "clinician_confirmed" | "manual";
};

export type Highlight = {
  id: string;
  title: string;
  detail: string;
  category: "risk" | "change" | "task" | "context";
  severity: "critical" | "high" | "medium" | "routine";
  status: "suggested" | "accepted" | "rejected";
  riskReason: string;
  sourceEntryId: string;
  sourceVersion: number;
  sourceQuote: string;
  score: number;
  dueLabel?: string;
};

export type Comment = {
  id: string;
  entryId: string;
  authorName: string;
  authorRole: Role;
  body: string;
  createdAt: string;
  resolved: boolean;
};

export type EntryVersionSeed = {
  entryId: string;
  version: number;
  content: string;
  changedBy: string;
  changedByRole: Role;
  createdAt: string;
};

export const demoUsers: DemoUser[] = [
  { id: "usr-patient", name: "Maya Tan", initials: "MT", role: "patient", clinicId: "clinic-eastshore" },
  { id: "usr-staff", name: "Aisha Rahman", initials: "AR", role: "staff", clinicId: "clinic-eastshore" },
  { id: "usr-clinician", name: "Dr. Daniel Lim", initials: "DL", role: "clinician", clinicId: "clinic-eastshore" },
  { id: "usr-admin", name: "Jordan Lee", initials: "JL", role: "admin", clinicId: "clinic-eastshore" },
];

export const demoEntries: CareEntry[] = [
  {
    id: "entry-ai-doctor-20260402",
    clinicId: "clinic-eastshore",
    patientId: "patient-maya",
    authorId: "system",
    authorName: "AI scribe · Dr. Lim consult",
    authorRole: "system",
    type: "ai_doctor_consult_summary",
    title: "Post-consult summary",
    content:
      "Maya reports increasing dizziness after standing, now occurring 3–4 times weekly. No syncope. Penicillin allergy was reconfirmed. Plan discussed: repeat FBC and ferritin, review hydration, and reassess within two weeks. The lab order is not yet placed.",
    createdAt: "2026-04-02T09:42:00+08:00",
    patientVisible: false,
    riskLevel: "high",
    version: 1,
    sourceLabel: "Consult audio · session S-2048 · 08:11–10:26",
    confidence: 0.91,
    reviewState: "pending_review",
  },
  {
    id: "entry-staff-20260401",
    clinicId: "clinic-eastshore",
    patientId: "patient-maya",
    authorId: "usr-staff",
    authorName: "Aisha Rahman",
    authorRole: "staff",
    type: "staff_note",
    title: "Follow-up coordination",
    content:
      "Patient can attend after 3 PM. Waiting for clinician to place the FBC and ferritin orders before staff confirms the follow-up slot. Assigned to Aisha; due 4 Apr.",
    createdAt: "2026-04-01T16:18:00+08:00",
    patientVisible: false,
    riskLevel: "medium",
    version: 2,
    reviewState: "manual",
  },
  {
    id: "entry-ai-patient-20260331",
    clinicId: "clinic-eastshore",
    patientId: "patient-maya",
    authorId: "system",
    authorName: "AI patient session",
    authorRole: "system",
    type: "ai_patient_session_summary",
    title: "Pre-visit questions",
    content:
      "Patient asks whether low iron could explain worsening dizziness and fatigue. She reports missing two iron doses this week because of nausea and wants alternatives that are easier to tolerate.",
    createdAt: "2026-03-31T20:06:00+08:00",
    patientVisible: false,
    riskLevel: "medium",
    version: 1,
    sourceLabel: "Patient AI session · S-2019 · messages 4–8",
    confidence: 0.86,
    reviewState: "pending_review",
  },
  {
    id: "entry-clinician-20250818",
    clinicId: "clinic-eastshore",
    patientId: "patient-maya",
    authorId: "usr-clinician",
    authorName: "Dr. Daniel Lim",
    authorRole: "clinician",
    type: "clinician_note",
    title: "Confirmed care plan",
    content:
      "Iron-deficiency anaemia, improving on oral iron. Continue current dose with food if tolerated. Avoid penicillin. Return earlier for fainting, chest pain, shortness of breath at rest, or rapid worsening.",
    createdAt: "2025-08-18T11:23:00+08:00",
    patientVisible: true,
    riskLevel: "routine",
    version: 3,
    reviewState: "clinician_confirmed",
  },
];

export const demoEntryVersions: EntryVersionSeed[] = [
  {
    entryId: "entry-staff-20260401",
    version: 1,
    content: "Patient can attend after 3 PM. Follow-up slot is provisionally held for 4 Apr.",
    changedBy: "usr-staff",
    changedByRole: "staff",
    createdAt: "2026-04-01T16:10:00+08:00",
  },
  {
    entryId: "entry-clinician-20250818",
    version: 1,
    content: "Iron-deficiency anaemia. Start oral iron and review tolerance. Avoid penicillin.",
    changedBy: "usr-clinician",
    changedByRole: "clinician",
    createdAt: "2025-08-18T11:05:00+08:00",
  },
  {
    entryId: "entry-clinician-20250818",
    version: 2,
    content: "Iron-deficiency anaemia, improving on oral iron. Continue current dose with food if tolerated. Avoid penicillin. Review if symptoms worsen.",
    changedBy: "usr-clinician",
    changedByRole: "clinician",
    createdAt: "2025-08-18T11:16:00+08:00",
  },
];

export const demoHighlights: Highlight[] = [
  {
    id: "highlight-allergy",
    title: "Penicillin allergy",
    detail: "Reconfirmed during the latest consult",
    category: "risk",
    severity: "critical",
    status: "accepted",
    riskReason: "Medication safety · clinician-confirmed history",
    sourceEntryId: "entry-ai-doctor-20260402",
    sourceVersion: 1,
    sourceQuote: "Penicillin allergy was reconfirmed.",
    score: 98,
  },
  {
    id: "highlight-labs",
    title: "Place FBC + ferritin orders",
    detail: "Discussed in consult; order still missing",
    category: "task",
    severity: "high",
    status: "suggested",
    riskReason: "Unresolved action · latest consult · linked staff dependency",
    sourceEntryId: "entry-ai-doctor-20260402",
    sourceVersion: 1,
    sourceQuote: "The lab order is not yet placed.",
    score: 94,
    dueLabel: "Due today",
  },
  {
    id: "highlight-dizziness",
    title: "Dizziness is worsening",
    detail: "Now 3–4 episodes weekly when standing",
    category: "change",
    severity: "high",
    status: "suggested",
    riskReason: "Recent symptom change · frequency increased",
    sourceEntryId: "entry-ai-doctor-20260402",
    sourceVersion: 1,
    sourceQuote: "Increasing dizziness after standing, now occurring 3–4 times weekly.",
    score: 91,
  },
  {
    id: "highlight-adherence",
    title: "Iron adherence concern",
    detail: "Two doses missed because of nausea",
    category: "context",
    severity: "medium",
    status: "accepted",
    riskReason: "Patient-reported barrier · affects active treatment",
    sourceEntryId: "entry-ai-patient-20260331",
    sourceVersion: 1,
    sourceQuote: "Missing two iron doses this week because of nausea.",
    score: 82,
  },
];

export const demoComments: Comment[] = [
  {
    id: "comment-1",
    entryId: "entry-staff-20260401",
    authorName: "Aisha Rahman",
    authorRole: "staff",
    body: "@Dr. Daniel Lim Could you confirm the lab order before noon?",
    createdAt: "2026-04-02T08:15:00+08:00",
    resolved: false,
  },
];

export const initialBundle = {
  patient: {
    id: "patient-maya",
    name: "Maya Tan",
    initials: "MT",
    age: 38,
    pronouns: "she/her",
    mrn: "SYN-20481",
    clinic: "Eastshore Family Clinic",
    nextVisit: "16 Apr · 3:20 PM",
  },
  currentUser: demoUsers[2],
  users: demoUsers,
  highlights: demoHighlights,
  entries: demoEntries,
  comments: demoComments,
  openTasks: 2,
  generatedAt: "2026-04-02T09:44:00+08:00",
};

export type PatientSummary = typeof initialBundle.patient;
