import Footer from "@/components/Footer";
import RewardsGrid from "@/components/RewardsGrid";
import { createClient } from "@/lib/supabase/server";
import type { Game, Reward } from "@/lib/types";

export const metadata = { title: "Récompenses — StreetGame" };
export const revalidate = 0;

export default async function RecompensesPage() {
  const supabase = await createClient();

  const [{ data: games }, { data: rewards }, userRes] = await Promise.all([
    supabase.from("games").select("id, slug, name, category, icon, cover_url, is_active").order("sort_order"),
    supabase.from("rewards").select("*").order("sort_order"),
    supabase.auth.getUser(),
  ]);

  const user = userRes.data.user;
  let balance = 0;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("points_balance").eq("id", user.id).single();
    balance = profile?.points_balance ?? 0;
  }

  const gamesWithRewards = ((games ?? []) as Game[])
    .map((game) => ({
      game,
      rewards: ((rewards ?? []) as Reward[]).filter((r) => r.game_id === game.id),
    }))
    .filter((g) => g.rewards.length > 0);

  return (
    <div>
      <section style={{ padding: "56px 24px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(28px,4.5vw,42px)", marginBottom: 10 }}>Récompenses</h1>
        <p className="text-muted" style={{ maxWidth: 620, fontSize: 16, marginBottom: 24 }}>
          Échange tes points StreetGame contre des vraies récompenses dans tes jeux préférés.
        </p>

        <RewardsGrid gamesWithRewards={gamesWithRewards} initialBalance={balance} isAuthenticated={Boolean(user)} />
      </section>

      <Footer />
    </div>
  );
}
