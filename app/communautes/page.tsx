import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CommunautesIndexPage() {
  const supabase = await createClient();
  const { data: game } = await supabase.from("games").select("slug").order("sort_order").limit(1).single();

  if (!game) redirect("/");
  redirect(`/communautes/${game.slug}`);
}
