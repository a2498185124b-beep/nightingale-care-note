import { getEntry, getEntryVersions, recordAudit, updateEntry } from "@/db/store";
import { canEditEntry, canViewEntry, getSessionUser } from "@/lib/auth";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(request);
  const { id } = await context.params;
  const entry = await getEntry(id);
  if (!entry || !canViewEntry(user, { clinicId: entry.clinic_id, authorRole: entry.author_role, patientVisible: Boolean(entry.patient_visible) })) {
    return Response.json({ error: "Not permitted" }, { status: 403 });
  }
  return Response.json({ versions: (await getEntryVersions(id)).results.map((version) => ({ ...version, content: user.role === "patient" ? undefined : version.content })) });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const user = getSessionUser(request);
  const { id } = await context.params;
  const entry = await getEntry(id);
  const payload = (await request.json()) as { content?: string; expectedVersion?: number };
  if (!entry || !canEditEntry(user, { clinicId: entry.clinic_id, authorRole: entry.author_role })) {
    await recordAudit(user, { requestId, action: "entry.update", resourceType: "entry", resourceId: id, outcome: "denied" });
    return Response.json({ error: "Not permitted" }, { status: 403 });
  }
  const content = payload.content?.trim() ?? "";
  if (!content || !Number.isInteger(payload.expectedVersion)) return Response.json({ error: "content and expectedVersion are required" }, { status: 400 });
  if (payload.expectedVersion !== entry.version) {
    await recordAudit(user, { requestId, action: "entry.update", resourceType: "entry", resourceId: id, outcome: "conflict", beforeVersion: entry.version });
    return Response.json({ error: "Version conflict", currentVersion: entry.version }, { status: 409 });
  }
  const nextVersion = await updateEntry(user, entry, content, payload.expectedVersion);
  if (!nextVersion) return Response.json({ error: "Version conflict" }, { status: 409 });
  await recordAudit(user, { requestId, action: "entry.update", resourceType: "entry", resourceId: id, outcome: "success", beforeVersion: entry.version, afterVersion: nextVersion });
  return Response.json({ version: nextVersion });
}
