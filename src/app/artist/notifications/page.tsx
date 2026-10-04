import { redirect } from "next/navigation";

export default function ArtistNotificationsRedirect() {
  redirect("/artist/inbox?tab=notifications");
}
