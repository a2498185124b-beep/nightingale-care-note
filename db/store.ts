import { env } from "cloudflare:workers";
import { demoComments, demoEntries, demoEntryVersions, demoHighlights, demoUsers } from "@/lib/demo-data";
import type { DemoUser } from "@/lib/demo-data";
import { canViewEntry } from "@/lib/auth";

let initPromise: Promise<void> | null = null;

function d1() {
  if (!env.DB) throw new Error("D1 binding DB is unavailable");
  return env.DB;
}

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS clinics (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, clinic_id TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, FOREIGN KEY (clinic_id) REFERENCES clinics(id))`,
  `CREATE TABLE IF NOT EXISTS patients (id TEXT PRIMARY KEY, clinic_id TEXT NOT NULL, display_name TEXT NOT NULL, synthetic_mrn TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (clinic_id) REFERENCES clinics(id))`,
  `CREATE TABLE IF NOT EXISTS entries (id TEXT PRIMARY KEY, clinic_id TEXT NOT NULL, patient_id TEXT NOT NULL, author_id TEXT NOT NULL, author_name TEXT NOT NULL, author_role TEXT NOT NULL, entry_type TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, patient_visible INTEGER NOT NULL DEFAULT 0, risk_level TEXT NOT NULL DEFAULT 'routine', review_state TEXT NOT NULL DEFAULT 'manual', source_label TEXT, source_session_id TEXT, confidence_basis_points INTEGER, version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS entry_versions (id TEXT PRIMARY KEY, entry_id TEXT NOT NULL, version INTEGER NOT NULL, content TEXT NOT NULL, changed_by TEXT NOT NULL, changed_by_role TEXT NOT NULL, change_reason TEXT NOT NULL DEFAULT 'edit', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(entry_id, version), FOREIGN KEY (entry_id) REFERENCES entries(id))`,
  `CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, entry_id TEXT NOT NULL, clinic_id TEXT NOT NULL, author_id TEXT NOT NULL, author_name TEXT NOT NULL, author_role TEXT NOT NULL, body TEXT NOT NULL, resolved INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (entry_id) REFERENCES entries(id))`,
  `CREATE TABLE IF NOT EXISTS highlights (id TEXT PRIMARY KEY, clinic_id TEXT NOT NULL, patient_id TEXT NOT NULL, title TEXT NOT NULL, detail TEXT NOT NULL, category TEXT NOT NULL, severity TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'suggested', risk_reason TEXT NOT NULL, source_entry_id TEXT NOT NULL, source_version INTEGER NOT NULL, source_quote TEXT NOT NULL, source_start INTEGER, source_end INTEGER, source_fragment_hash TEXT, score INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (source_entry_id) REFERENCES entries(id))`,
  `CREATE TABLE IF NOT EXISTS provenance (id TEXT PRIMARY KEY, target_type TEXT NOT NULL, target_id TEXT NOT NULL, target_version INTEGER, source_entry_id TEXT, source_version INTEGER, source_span TEXT, source_uri TEXT, generated_by TEXT NOT NULL, model_version TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS importance_feedback (id TEXT PRIMARY KEY, clinic_id TEXT NOT NULL, actor_id TEXT NOT NULL, highlight_id TEXT NOT NULL, signal_key TEXT NOT NULL, action TEXT NOT NULL, weight_delta INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS audit_events (id TEXT PRIMARY KEY, request_id TEXT NOT NULL, clinic_id TEXT NOT NULL, actor_id TEXT NOT NULL, actor_role TEXT NOT NULL, action TEXT NOT NULL, resource_type TEXT NOT NULL, resource_id TEXT NOT NULL, outcome TEXT NOT NULL, before_version INTEGER, after_version INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS entries_patient_time_idx ON entries(patient_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS highlights_patient_score_idx ON highlights(patient_id, score DESC)`,
  `CREATE INDEX IF NOT EXISTS audit_events_clinic_time_idx ON audit_events(clinic_id, created_at DESC)`,
];

export async function ensureDatabase() {
  if (!initPromise) {
    initPromise = (async () => {
      const db = d1();
      await db.batch(schemaStatements.map((statement) => db.prepare(statement)));
      const count = await db.prepare("SELECT COUNT(*) AS count FROM entries").first<{ count: number }>();
      if (Number(count?.count ?? 0) > 0) return;

      const inserts = [
        db.prepare("INSERT OR IGNORE INTO clinics (id, name) VALUES (?, ?)").bind("clinic-eastshore", "Eastshore Family Clinic"),
        db.prepare("INSERT OR IGNORE INTO patients (id, clinic_id, display_name, synthetic_mrn) VALUES (?, ?, ?, ?)").bind("patient-maya", "clinic-eastshore", "Maya Tan", "SYN-20481"),
      ];
      for (const user of demoUsers) {
        inserts.push(db.prepare("INSERT OR IGNORE INTO users (id, clinic_id, name, role) VALUES (?, ?, ?, ?)").bind(user.id, user.clinicId, user.name, user.role));
      }
      for (const entry of demoEntries) {
        inserts.push(
          db.prepare(`INSERT OR IGNORE INTO entries
            (id, clinic_id, patient_id, author_id, author_name, author_role, entry_type, title, content, patient_visible, risk_level, review_state, source_label, confidence_basis_points, version, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(entry.id, entry.clinicId, entry.patientId, entry.authorId, entry.authorName, entry.authorRole, entry.type, entry.title, entry.content, entry.patientVisible ? 1 : 0, entry.riskLevel, entry.reviewState ?? "manual", entry.sourceLabel ?? null, entry.confidence ? Math.round(entry.confidence * 10000) : null, entry.version, entry.createdAt, entry.createdAt),
        );
        for (const historical of demoEntryVersions.filter((version) => version.entryId === entry.id)) {
          inserts.push(
            db.prepare("INSERT OR IGNORE INTO entry_versions (id, entry_id, version, content, changed_by, changed_by_role, change_reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
              .bind(`${historical.entryId}-v${historical.version}`, historical.entryId, historical.version, historical.content, historical.changedBy, historical.changedByRole, "seed", historical.createdAt),
          );
        }
        inserts.push(
          db.prepare("INSERT OR IGNORE INTO entry_versions (id, entry_id, version, content, changed_by, changed_by_role, change_reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(`${entry.id}-v${entry.version}`, entry.id, entry.version, entry.content, entry.authorId, entry.authorRole, "seed", entry.createdAt),
        );
      }
      for (const item of demoHighlights) {
        inserts.push(
          db.prepare(`INSERT OR IGNORE INTO highlights
            (id, clinic_id, patient_id, title, detail, category, severity, status, risk_reason, source_entry_id, source_version, source_quote, score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(item.id, "clinic-eastshore", "patient-maya", item.title, item.detail, item.category, item.severity, item.status, item.riskReason, item.sourceEntryId, item.sourceVersion, item.sourceQuote, item.score),
        );
        inserts.push(
          db.prepare("INSERT OR IGNORE INTO provenance (id, target_type, target_id, target_version, source_entry_id, source_version, source_span, generated_by, model_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(`prov-${item.id}`, "highlight", item.id, 1, item.sourceEntryId, item.sourceVersion, item.sourceQuote, "importance-engine-v1", "rules+feedback-v1"),
        );
      }
      for (const comment of demoComments) {
        const author = demoUsers.find((user) => user.name === comment.authorName) ?? demoUsers[1];
        inserts.push(
          db.prepare("INSERT OR IGNORE INTO comments (id, entry_id, clinic_id, author_id, author_name, author_role, body, resolved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(comment.id, comment.entryId, author.clinicId, author.id, comment.authorName, comment.authorRole, comment.body, comment.resolved ? 1 : 0, comment.createdAt),
        );
      }
      await db.batch(inserts);
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }
  await initPromise;
}

export type EntryRow = {
  id: string;
  clinic_id: string;
  patient_id: string;
  author_id: string;
  author_name: string;
  author_role: "patient" | "staff" | "clinician" | "system";
  entry_type: string;
  title: string;
  content: string;
  patient_visible: number;
  risk_level: "critical" | "high" | "medium" | "routine";
  review_state: "pending_review" | "clinician_confirmed" | "manual";
  source_label: string | null;
  confidence_basis_points: number | null;
  version: number;
  created_at: string;
};

export async function getEntry(id: string) {
  await ensureDatabase();
  return d1().prepare("SELECT * FROM entries WHERE id = ?").bind(id).first<EntryRow>();
}

export async function recordAudit(user: DemoUser, input: { requestId: string; action: string; resourceType: string; resourceId: string; outcome: string; beforeVersion?: number; afterVersion?: number }) {
  await ensureDatabase();
  await d1().prepare(`INSERT INTO audit_events
    (id, request_id, clinic_id, actor_id, actor_role, action, resource_type, resource_id, outcome, before_version, after_version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), input.requestId, user.clinicId, user.id, user.role, input.action, input.resourceType, input.resourceId, input.outcome, input.beforeVersion ?? null, input.afterVersion ?? null)
    .run();
}

export async function updateEntry(user: DemoUser, entry: EntryRow, content: string, expectedVersion: number) {
  const db = d1();
  const nextVersion = entry.version + 1;
  const result = await db.prepare("UPDATE entries SET content = ?, version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
    .bind(content, nextVersion, entry.id, expectedVersion).run();
  if (!result.meta.changes) return null;
  await db.prepare("INSERT INTO entry_versions (id, entry_id, version, content, changed_by, changed_by_role, change_reason) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(`${entry.id}-v${nextVersion}`, entry.id, nextVersion, content, user.id, user.role, "edit").run();
  return nextVersion;
}

export async function getEntryVersions(entryId: string) {
  await ensureDatabase();
  return d1().prepare("SELECT version, content, changed_by, changed_by_role, change_reason, created_at FROM entry_versions WHERE entry_id = ? ORDER BY version DESC")
    .bind(entryId).all<{ version: number; content: string; changed_by: string; changed_by_role: string; change_reason: string; created_at: string }>();
}

export async function getEntryVersion(entryId: string, version: number) {
  await ensureDatabase();
  return d1().prepare("SELECT version, content FROM entry_versions WHERE entry_id = ? AND version = ?")
    .bind(entryId, version).first<{ version: number; content: string }>();
}

export async function addComment(user: DemoUser, entry: EntryRow, body: string) {
  const id = crypto.randomUUID();
  await d1().prepare("INSERT INTO comments (id, entry_id, clinic_id, author_id, author_name, author_role, body) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id, entry.id, user.clinicId, user.id, user.name, user.role, body).run();
  return id;
}

export async function reviewHighlight(user: DemoUser, id: string, status: "accepted" | "rejected") {
  await ensureDatabase();
  const db = d1();
  const highlight = await db.prepare("SELECT id, clinic_id, category, status FROM highlights WHERE id = ?").bind(id).first<{ id: string; clinic_id: string; category: string; status: string }>();
  if (!highlight || highlight.clinic_id !== user.clinicId) return false;
  await db.batch([
    db.prepare("UPDATE highlights SET status = ? WHERE id = ?").bind(status, id),
    db.prepare("INSERT INTO importance_feedback (id, clinic_id, actor_id, highlight_id, signal_key, action, weight_delta) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), user.clinicId, user.id, id, highlight.category, status, status === "accepted" ? 12 : -8),
  ]);
  return true;
}

export async function getAuditEvents(user: DemoUser) {
  await ensureDatabase();
  if (user.role !== "admin") return [];
  return d1().prepare("SELECT request_id, actor_role, action, resource_type, resource_id, outcome, before_version, after_version, created_at FROM audit_events WHERE clinic_id = ? ORDER BY created_at DESC LIMIT 50")
    .bind(user.clinicId).all();
}

export async function getCareData(user: DemoUser) {
  await ensureDatabase();
  const db = d1();
  const entryResult = await db.prepare("SELECT * FROM entries WHERE clinic_id = ? ORDER BY created_at DESC").bind(user.clinicId).all<EntryRow>();
  const visibleRows = entryResult.results.filter((entry) => canViewEntry(user, { clinicId: entry.clinic_id, authorRole: entry.author_role, patientVisible: Boolean(entry.patient_visible) }));
  const visibleIds = new Set(visibleRows.map((entry) => entry.id));
  const highlightResult = await db.prepare("SELECT * FROM highlights WHERE clinic_id = ? ORDER BY score DESC").bind(user.clinicId).all<Record<string, unknown>>();
  const commentResult = user.role === "patient"
    ? { results: [] as Record<string, unknown>[] }
    : await db.prepare("SELECT * FROM comments WHERE clinic_id = ? ORDER BY created_at ASC").bind(user.clinicId).all<Record<string, unknown>>();
  return {
    entries: visibleRows.map((entry) => ({
      id: entry.id,
      clinicId: entry.clinic_id,
      patientId: entry.patient_id,
      authorId: entry.author_id,
      authorName: entry.author_name,
      authorRole: entry.author_role,
      type: entry.entry_type,
      title: entry.title,
      content: entry.content,
      createdAt: entry.created_at,
      patientVisible: Boolean(entry.patient_visible),
      riskLevel: entry.risk_level,
      version: entry.version,
      sourceLabel: entry.source_label ?? undefined,
      confidence: entry.confidence_basis_points ? entry.confidence_basis_points / 10000 : undefined,
      reviewState: entry.review_state,
    })),
    highlights: highlightResult.results
      .filter((item) => visibleIds.has(String(item.source_entry_id)))
      .map((item) => ({
        id: String(item.id), title: String(item.title), detail: String(item.detail), category: item.category,
        severity: item.severity, status: item.status, riskReason: String(item.risk_reason),
        sourceEntryId: String(item.source_entry_id), sourceVersion: Number(item.source_version),
        sourceQuote: String(item.source_quote), score: Number(item.score),
      })),
    comments: commentResult.results
      .filter((item) => visibleIds.has(String(item.entry_id)))
      .map((item) => ({
        id: String(item.id), entryId: String(item.entry_id), authorName: String(item.author_name),
        authorRole: item.author_role, body: String(item.body), createdAt: String(item.created_at),
        resolved: Boolean(item.resolved),
      })),
  };
}
