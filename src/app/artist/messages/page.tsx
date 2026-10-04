import { redirect } from "next/navigation";

export default function ArtistMessagesRedirect() {
  redirect("/artist/inbox");
}
