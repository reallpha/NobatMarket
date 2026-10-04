import { redirect } from "next/navigation";

export default function ClientNotificationsRedirect() {
  redirect("/client/inbox?tab=notifications");
}
