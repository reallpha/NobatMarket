import { redirect } from "next/navigation";

export default function ClientMessagesRedirect() {
  redirect("/client/inbox");
}
