import { recordAudit, resolveConflict } from "@/db/store";
import { canResolveConflicts, getSessionUser } from "@/lib/auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const user = getSessionUser(request);
  const { id } = await context.params;
  const payload = (await request.json()) as { resolution?: string };
  const resolution = payload.resolution?.trim();
  if (!canResolveConflicts(user) || !resolution) {
    await recordAudit(user, { requestId, action: "conflict.resolve", resourceType: "clinical_conflict", resourceId: id, outcome: "denied" });
    return Response.json({ error: "Clinician permission and a resolution are required" }, { status: 403 });
  }
  const ok = await resolveConflict(user, id, resolution);
  await recordAudit(user, { requestId, action: "conflict.resolve", resourceType: "clinical_conflict", resourceId: id, outcome: ok ? "success" : "not_found" });
  return ok ? Response.json({ id, status: "resolved", resolution }) : Response.json({ error: "Not found or already resolved" }, { status: 404 });
}
