import { addComment, getEntry, recordAudit } from "@/db/store";
import { canComment, canViewEntry, getSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const user = getSessionUser(request);
  const payload = (await request.json()) as { entryId?: string; body?: string };
  const entry = payload.entryId ? await getEntry(payload.entryId) : null;
  const body = payload.body?.trim() ?? "";
  const visible = entry && canViewEntry(user, { clinicId: entry.clinic_id, authorRole: entry.author_role, patientVisible: Boolean(entry.patient_visible) });
  if (!entry || !body || !visible || !canComment(user)) {
    await recordAudit(user, { requestId, action: "comment.create", resourceType: "entry", resourceId: payload.entryId ?? "missing", outcome: "denied" });
    return Response.json({ error: "Not permitted" }, { status: 403 });
  }
  const id = await addComment(user, entry, body);
  await recordAudit(user, { requestId, action: "comment.create", resourceType: "comment", resourceId: id, outcome: "success" });
  return Response.json({ id }, { status: 201 });
}

