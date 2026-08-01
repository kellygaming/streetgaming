import { notFound } from "next/navigation";
import Script from "next/script";
import ChatShell from "@/components/ChatShell";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessageView } from "@/components/ChatMessageBubble";
import type { ChatBackground, Game } from "@/lib/types";

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }) {
  const { game: slug } = await params;
  return { title: `${slug} — Communautés StreetGame` };
}

export default async function CommunauteGamePage({ params }: { params: Promise<{ game: string }> }) {
  const { game: slug } = await params;
  const supabase = await createClient();

  const [{ data: allGames }, { data: currentGame }, userRes] = await Promise.all([
    supabase.from("games").select("id, slug, name, category, icon, cover_url, is_active").order("sort_order"),
    supabase.from("games").select("id, slug, name, category, icon, cover_url, is_active").eq("slug", slug).single(),
    supabase.auth.getUser(),
  ]);

  if (!currentGame) notFound();

  const user = userRes.data.user;

  const [{ data: messages }, { data: challenge }, backgroundRes, profileRes] = await Promise.all([
    supabase
      .from("chat_messages")
      .select("id, profile_id, content, created_at, profiles(username)")
      .eq("game_id", currentGame.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("challenges")
      .select("id, title, description")
      .eq("game_id", currentGame.id)
      .eq("status", "active")
      .order("created_at")
      .limit(1)
      .maybeSingle(),
    user
      ? supabase.from("chat_backgrounds").select("*").eq("profile_id", user.id).eq("game_id", currentGame.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user ? supabase.from("profiles").select("username").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  const initialMessages: ChatMessageView[] = (messages ?? [])
    .slice()
    .reverse()
    .map((m) => ({
      id: m.id,
      profile_id: m.profile_id,
      content: m.content,
      created_at: m.created_at,
      username: (m.profiles as unknown as { username: string } | null)?.username ?? "Joueur",
    }));

  return (
    <div style={{ minHeight: "calc(100vh - 68px)", display: "flex", flexDirection: "column" }}>
      <Script src="https://unpkg.com/@phosphor-icons/web" strategy="afterInteractive" />
      <ChatShell
        currentGame={currentGame as Game}
        allGames={(allGames ?? []) as Game[]}
        initialMessages={initialMessages}
        currentUser={user && profileRes.data ? { id: user.id, username: profileRes.data.username } : null}
        initialBackground={(backgroundRes.data as ChatBackground | null) ?? null}
        challengeOfTheMoment={challenge ?? null}
      />
    </div>
  );
}
