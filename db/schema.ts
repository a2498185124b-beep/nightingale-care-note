import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const clinics = sqliteTable("clinics", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),
  name: text("name").notNull(),
  role: text("role", { enum: ["patient", "staff", "clinician", "admin"] }).notNull(),
});

export const patients = sqliteTable("patients", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),
  displayName: text("display_name").notNull(),
  syntheticMrn: text("synthetic_mrn").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("patients_clinic_mrn_idx").on(table.clinicId, table.syntheticMrn)]);

export const entries = sqliteTable("entries", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),
  patientId: text("patient_id").notNull().references(() => patients.id),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  authorRole: text("author_role", { enum: ["patient", "staff", "clinician", "system"] }).notNull(),
  entryType: text("entry_type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  patientVisible: integer("patient_visible", { mode: "boolean" }).notNull().default(false),
  riskLevel: text("risk_level").notNull().default("routine"),
  reviewState: text("review_state").notNull().default("manual"),
  sourceLabel: text("source_label"),
  sourceSessionId: text("source_session_id"),
  confidence: integer("confidence_basis_points"), // legacy column; never shown as model self-confidence
  evidenceMode: text("evidence_mode").notNull().default("extraction"),
  evidenceCoverage: integer("evidence_coverage_basis_points"),
  patientReleaseState: text("patient_release_state").notNull().default("not_applicable"),
  patientReleaseApprovedBy: text("patient_release_approved_by"),
  patientReleaseApprovedAt: text("patient_release_approved_at"),
  releaseBlockReason: text("release_block_reason"),
  version: integer("version").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const entryVersions = sqliteTable("entry_versions", {
  id: text("id").primaryKey(),
  entryId: text("entry_id").notNull().references(() => entries.id),
  version: integer("version").notNull(),
  content: text("content").notNull(),
  changedBy: text("changed_by").notNull(),
  changedByRole: text("changed_by_role").notNull(),
  changeReason: text("change_reason").notNull().default("edit"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("entry_versions_entry_version_idx").on(table.entryId, table.version)]);

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  entryId: text("entry_id").notNull().references(() => entries.id),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  authorRole: text("author_role").notNull(),
  body: text("body").notNull(),
  resolved: integer("resolved", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const highlights = sqliteTable("highlights", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),
  patientId: text("patient_id").notNull().references(() => patients.id),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  category: text("category").notNull(),
  severity: text("severity").notNull(),
  status: text("status").notNull().default("suggested"),
  riskReason: text("risk_reason").notNull(),
  sourceEntryId: text("source_entry_id").notNull().references(() => entries.id),
  sourceVersion: integer("source_version").notNull(),
  sourceQuote: text("source_quote").notNull(),
  sourceStart: integer("source_start"),
  sourceEnd: integer("source_end"),
  sourceFragmentHash: text("source_fragment_hash"),
  score: integer("score").notNull(),
  evidenceBasisPoints: integer("evidence_basis_points").notNull().default(0),
  evidenceMethod: text("evidence_method").notNull().default("exact_span"),
  evidenceState: text("evidence_state").notNull().default("review_required"),
  failureAction: text("failure_action").notNull().default("queue_review"),
  riskFloorRule: text("risk_floor_rule"),
  scoreBreakdownJson: text("score_breakdown_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const provenance = sqliteTable("provenance", {
  id: text("id").primaryKey(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  targetVersion: integer("target_version"),
  sourceEntryId: text("source_entry_id").references(() => entries.id),
  sourceVersion: integer("source_version"),
  sourceSpan: text("source_span"),
  sourceUri: text("source_uri"),
  generatedBy: text("generated_by").notNull(),
  modelVersion: text("model_version"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const importanceFeedback = sqliteTable("importance_feedback", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),
  actorId: text("actor_id").notNull(),
  highlightId: text("highlight_id").notNull().references(() => highlights.id),
  signalKey: text("signal_key").notNull(),
  action: text("action").notNull(),
  weightDelta: integer("weight_delta").notNull(),
  eligibleForLearning: integer("eligible_for_learning", { mode: "boolean" }).notNull().default(false),
  learningReason: text("learning_reason").notNull().default("unclassified"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const clinicalConflicts = sqliteTable("clinical_conflicts", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),
  patientId: text("patient_id").notNull().references(() => patients.id),
  domain: text("domain").notNull(),
  severity: text("severity").notNull(),
  status: text("status").notNull().default("open"),
  summary: text("summary").notNull(),
  detectionRule: text("detection_rule").notNull(),
  failureAction: text("failure_action").notNull(),
  leftEntryId: text("left_entry_id").notNull().references(() => entries.id),
  leftVersion: integer("left_version").notNull(),
  leftQuote: text("left_quote").notNull(),
  leftRole: text("left_role").notNull(),
  rightEntryId: text("right_entry_id").notNull().references(() => entries.id),
  rightVersion: integer("right_version").notNull(),
  rightQuote: text("right_quote").notNull(),
  rightRole: text("right_role").notNull(),
  resolution: text("resolution"),
  resolvedBy: text("resolved_by"),
  resolvedAt: text("resolved_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  requestId: text("request_id").notNull(),
  clinicId: text("clinic_id").notNull(),
  actorId: text("actor_id").notNull(),
  actorRole: text("actor_role").notNull(),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  outcome: text("outcome").notNull(),
  beforeVersion: integer("before_version"),
  afterVersion: integer("after_version"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
