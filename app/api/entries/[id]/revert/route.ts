import { getEntry, getEntryVersion, recordAudit, updateEntry } from "@/db/store";
import { canEditEntry, getSessionUser } from "@/lib/auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const user = getSessionUser(request);
  const { id } = await context.params;
  const entry = await getEntry(id);
  const payload = (await request.json()) as { targetVersion?: number; expectedVersion?: number };
  if (!entry || !canEditEntry(user, { clinicId: entry.clinic_id, authorRole: entry.author_role })) {
    await recordAudit(user, { requestId, action: "entry.revert", resourceType: "entry", resourceId: id, outcome: "denied" });
    return Response.json({ error: "Not permitted" }, { status: 403 });
  }
  const target = Number.isInteger(payload.targetVersion) ? await getEntryVersion(id, payload.targetVersion!) : null;
  if (!target) return Response.json({ error: "Target version not found" }, { status: 404 });
  if (payload.expectedVersion !== entry.version) return Response.json({ error: "Version conflict", currentVersion: entry.version }, { status: 409 });
  const nextVersion = await updateEntry(user, entry, target.content, entry.version);
  if (!nextVersion) return Response.json({ error: "Version conflict" }, { status: 409 });
  await recordAudit(user, { requestId, action: "entry.revert", resourceType: "entry", resourceId: id, outcome: "success", beforeVersion: entry.version, afterVersion: nextVersion });
  return Response.json({ version: nextVersion, revertedFrom: target.version });
}
