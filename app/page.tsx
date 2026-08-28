import CareWorkspace from "./CareWorkspace";
import { cookies } from "next/headers";
import { demoComments, demoConflicts, demoEntries, demoHighlights, demoUsers, initialBundle } from "@/lib/demo-data";
import { canViewEntry } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("care_demo_user")?.value ?? "usr-clinician";
  const user = demoUsers.find((candidate) => candidate.id === userId) ?? demoUsers[2];
  const entries = demoEntries.filter((entry) => canViewEntry(user, entry));
  const entryIds = new Set(entries.map((entry) => entry.id));
  const bundle = {
    ...initialBundle,
    currentUser: user,
    users: demoUsers,
    entries,
    comments: user.role === "patient" ? [] : demoComments.filter((comment) => entryIds.has(comment.entryId)),
    highlights: demoHighlights.filter((highlight) => entryIds.has(highlight.sourceEntryId)),
    conflicts: user.role === "patient" ? [] : demoConflicts,
  };
  return <CareWorkspace bundle={bundle} />;
}
