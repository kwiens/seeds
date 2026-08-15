import { redirect } from "next/navigation";

export default function MySproutsPage() {
  redirect("/dashboard?tab=my-sprouts");
}
