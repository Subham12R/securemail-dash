import { redirect } from "next/navigation";

export default function FlaggedEmailsPage() {
  redirect("/inbox?filter=flagged");
}
