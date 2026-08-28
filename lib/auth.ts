import { demoUsers, type CareEntry, type DemoUser } from "./demo-data";

const COOKIE_NAME = "care_demo_user";

export function getSessionUser(request: Request): DemoUser {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  const id = match ? decodeURIComponent(match[1]) : "usr-clinician";
  return demoUsers.find((user) => user.id === id) ?? demoUsers[2];
}

export function sessionCookie(userId: string) {
  return `${COOKIE_NAME}=${encodeURIComponent(userId)}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=86400`;
}

export function canViewEntry(user: DemoUser, entry: Pick<CareEntry, "clinicId" | "authorRole" | "patientVisible" | "patientReleaseState">) {
  if (entry.clinicId !== user.clinicId) return false;
  if (user.role === "patient") {
    return entry.patientVisible && ["clinician_approved", "rule_verified"].includes(entry.patientReleaseState ?? "not_applicable");
  }
  if (user.role === "staff") return entry.authorRole !== "clinician";
  return user.role === "clinician" || user.role === "admin";
}

export function canEditEntry(user: DemoUser, entry: Pick<CareEntry, "clinicId" | "authorRole">) {
  if (entry.clinicId !== user.clinicId) return false;
  return (
    (user.role === "staff" && entry.authorRole === "staff") ||
    (user.role === "clinician" && entry.authorRole === "clinician")
  );
}

export function canComment(user: DemoUser) {
  return user.role === "staff" || user.role === "clinician";
}

export function canReviewHighlights(user: DemoUser) {
  return user.role === "clinician";
}

export function canResolveConflicts(user: DemoUser) {
  return user.role === "clinician";
}
