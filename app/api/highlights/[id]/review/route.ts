import { recordAudit, reviewHighlight } from "@/db/store";
import { canReviewHighlights, getSessionUser } from "@/lib/auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const user = getSessionUser(request);
  const { id } = await context.params;
  const payload = (await request.json()) as { status?: "accepted" | "rejected" };
  if (!canReviewHighlights(user) || !["accepted", "rejected"].includes(payload.status ?? "")) {
    await recordAudit(user, { requestId, action: "highlight.review", resourceType: "highlight", resourceId: id, outcome: "denied" });
    return Response.json({ error: "Clinician permission required" }, { status: 403 });
  }
  const ok = await reviewHighlight(user, id, payload.status!);
  await recordAudit(user, { requestId, action: "highlight.review", resourceType: "highlight", resourceId: id, outcome: ok ? "success" : "not_found" });
  return ok ? Response.json({ id, status: payload.status }) : Response.json({ error: "Not found" }, { status: 404 });
}

