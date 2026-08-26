import { getCareData, recordAudit } from "@/db/store";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const user = getSessionUser(request);
  const data = await getCareData(user);
  await recordAudit(user, { requestId, action: "care_note.read", resourceType: "patient", resourceId: "patient-maya", outcome: "success" });
  return Response.json(data, { headers: { "cache-control": "private, max-age=15" } });
}
