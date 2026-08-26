import { getAuditEvents } from "@/db/store";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = getSessionUser(request);
  if (user.role !== "admin") return Response.json({ error: "Admin permission required" }, { status: 403 });
  return Response.json({ events: await getAuditEvents(user) });
}

