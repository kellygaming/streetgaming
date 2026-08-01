import Link from "next/link";
import Footer from "@/components/Footer";
import GameCover from "@/components/GameCover";
import ChallengeCardCompact from "@/components/ChallengeCardCompact";
import RewardCardCompact from "@/components/RewardCardCompact";
import LeaderboardTable from "@/components/LeaderboardTable";
import { createClient } from "@/lib/supabase/server";
import type { Challenge, Game, LeaderboardRow, Reward } from "@/lib/types";

export const revalidate = 30;

const HERO_FAN = [
  { transform: "rotate(-8deg) translateY(14px)", marginRight: -6, zIndex: 1, width: "min(220px,34vw)" },
  { transform: "translateY(-8px)", zIndex: 3, width: "min(240px,38vw)" },
  { transform: "rotate(8deg) translateY(14px)", marginLeft: -6, zIndex: 1, width: "min(220px,34vw)" },
];

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: games }, { data: challenges }, { data: rewards }, { data: leaderboard }] = await Promise.all([
    supabase.from("games").select("id, slug, name, category, icon, cover_url, is_active").order("sort_order"),
    supabase
      .from("challenges")
      .select("id, game_id, title, description, reward_label, status, games(id, slug, name)")
      .in("status", ["active", "coming_soon"])
      .order("created_at"),
    supabase
      .from("rewards")
      .select("id, game_id, title, points_cost, icon, is_available, games(id, slug, name)")
      .order("sort_order")
      .limit(24),
    supabase
      .from("weekly_leaderboard")
      .select("*")
      .order("weekly_points", { ascending: false })
      .limit(5),
  ]);

  const gamesList = (games ?? []) as Game[];
  const activeGamesCount = gamesList.filter((g) => g.is_active).length;

  const oneChallengePerGame = new Map<string, Challenge>();
  for (const c of (challenges ?? []) as unknown as Challenge[]) {
    if (!oneChallengePerGame.has(c.game_id)) oneChallengePerGame.set(c.game_id, c);
  }

  const oneRewardPerGame = new Map<string, Reward>();
  for (const r of (rewards ?? []) as unknown as Reward[]) {
    if (!oneRewardPerGame.has(r.game_id)) oneRewardPerGame.set(r.game_id, r);
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <section
        style={{
          padding: "80px 24px 60px",
          textAlign: "center",
          position: "relative",
          backgroundImage:
            "radial-gradient(circle, color-mix(in srgb, var(--color-text) 8%, transparent) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      >
        <div className="tag tag-outline" style={{ margin: "0 auto 20px", width: "fit-content" }}>
          🔥 {activeGamesCount} jeu{activeGamesCount > 1 ? "x" : ""} mobile{activeGamesCount > 1 ? "s" : ""} déjà dispo — plus à venir
        </div>
        <h1 style={{ fontSize: "clamp(32px,6vw,56px)", maxWidth: 800, margin: "0 auto 16px" }}>
          Tous les meilleurs joueurs mobile.
          <br />
          Un seul endroit.
        </h1>
        <p className="text-muted" style={{ maxWidth: 520, margin: "0 auto 32px", fontSize: 16 }}>
          Relève des défis dans tes jeux préférés, grimpe le classement, et gagne de vraies récompenses en jeu.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 64 }}>
          <Link className="btn btn-secondary" href="/defis" style={{ fontSize: 15, padding: "12px 22px" }}>
            Voir les défis
          </Link>
          <Link className="btn btn-primary" href="/inscription" style={{ fontSize: 15, padding: "12px 22px" }}>
            Rejoindre StreetGame
          </Link>
        </div>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: 0, maxWidth: 900, margin: "0 auto" }}>
          {gamesList.map((game, i) => {
            const fan = HERO_FAN[i];
            const activeCount = [...oneChallengePerGame.values()].filter(
              (c) => c.game_id === game.id && c.status === "active"
            ).length;
            return (
              <div key={game.id} style={{ flex: "none", ...(fan ?? { width: "min(220px,34vw)" }) }}>
                <div className="elev-lg" style={{ aspectRatio: "3/4", borderRadius: "var(--radius-lg)", overflow: "hidden", position: "relative", background: "var(--color-surface)" }}>
                  <GameCover game={game} />
                  <div style={{ position: "absolute", left: 14, right: 14, bottom: 14, textAlign: "left" }}>
                    <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 18 }}>{game.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>{game.category}</div>
                    {game.is_active ? (
                      <span className="tag tag-accent" style={{ fontSize: 10 }}>
                        {activeCount > 0 ? `${activeCount} défi actif` : "Défis en préparation"}
                      </span>
                    ) : (
                      <span className="tag tag-neutral" style={{ fontSize: 10 }}>
                        Défis bientôt
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ padding: "60px 24px" }} id="defis">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24, flexWrap: "wrap", gap: 12, maxWidth: 1100, marginInline: "auto" }}>
          <h2>Défis en cours</h2>
          <Link className="btn btn-ghost" href="/defis" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            Voir tous les défis <i className="ph ph-arrow-right" />
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, maxWidth: 1100, margin: "0 auto" }}>
          {[...oneChallengePerGame.values()].map((challenge) => (
            <ChallengeCardCompact key={challenge.id} challenge={challenge} game={challenge.games!} />
          ))}
        </div>
      </section>

      <section style={{ padding: "20px 24px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24, flexWrap: "wrap", gap: 12, maxWidth: 1100, marginInline: "auto" }}>
          <h2>Récompenses populaires</h2>
          <Link className="btn btn-ghost" href="/recompenses" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            Voir toutes les récompenses <i className="ph ph-arrow-right" />
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, maxWidth: 1100, margin: "0 auto" }}>
          {[...oneRewardPerGame.values()].map((reward) => (
            <RewardCardCompact key={reward.id} reward={reward} game={reward.games!} />
          ))}
        </div>
      </section>

      <section style={{ padding: "20px 24px 100px" }} id="classement">
        <h2 style={{ marginBottom: 24, maxWidth: 1100, marginInline: "auto" }}>Classement de la semaine</h2>
        <div style={{ maxWidth: 1100, margin: "0 auto", overflowX: "auto" }}>
          <LeaderboardTable rows={(leaderboard ?? []) as LeaderboardRow[]} />
        </div>
      </section>

      <Footer />
    </div>
  );
}
