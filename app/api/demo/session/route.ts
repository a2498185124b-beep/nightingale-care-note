import { demoUsers } from "@/lib/demo-data";
import { getSessionUser, sessionCookie } from "@/lib/auth";

export async function GET(request: Request) {
  return Response.json({ user: getSessionUser(request) });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as { userId?: string };
  const user = demoUsers.find((candidate) => candidate.id === payload.userId);
  if (!user) return Response.json({ error: "Unknown synthetic demo user" }, { status: 400 });
  const response = Response.json({ user, demoOnly: true });
  response.headers.append("set-cookie", sessionCookie(user.id));
  return response;
}

