"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RewardCard from "./RewardCard";
import { createClient } from "@/lib/supabase/client";
import { formatPoints } from "@/lib/format";
import type { Game, Reward } from "@/lib/types";

export default function RewardsGrid({
  gamesWithRewards,
  initialBalance,
  isAuthenticated,
}: {
  gamesWithRewards: { game: Game; rewards: Reward[] }[];
  initialBalance: number;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [balance, setBalance] = useState(initialBalance);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function redeem(reward: Reward) {
    setError(null);
    setLoadingId(reward.id);
    const supabase = createClient();
    const { error } = await supabase.rpc("redeem_reward", { p_reward_id: reward.id });
    setLoadingId(null);
    if (error) {
      setError(error.message === "Solde de points insuffisant" ? "Solde de points insuffisant." : "Impossible d'échanger cette récompense.");
      return;
    }
    setBalance((b) => b - reward.points_cost);
    router.refresh();
  }

  return (
    <>
      {isAuthenticated && (
        <div
          className="card elev-md"
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            padding: "20px 24px",
            marginBottom: 32,
            background: "linear-gradient(135deg, var(--color-accent-900), var(--color-surface))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--color-accent-800)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ph-fill ph-coins" style={{ fontSize: 26, color: "var(--color-accent-100)" }} />
            </div>
            <div>
              <div className="card-meta" style={{ marginBottom: 2 }}>
                Ton solde
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 26 }}>{formatPoints(balance)} points</div>
            </div>
          </div>
          <a className="btn btn-secondary" href="/defis">
            Gagner plus de points
          </a>
        </div>
      )}

      {error && (
        <p style={{ color: "#e08a8a", fontSize: 14, marginBottom: 16 }}>{error}</p>
      )}

      {gamesWithRewards.map(({ game, rewards }) => (
        <div key={game.id}>
          <h6 style={{ opacity: 0.6, marginBottom: 14 }}>{game.name}</h6>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, marginBottom: 32 }}>
            {rewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                canAfford={balance >= reward.points_cost}
                isAuthenticated={isAuthenticated}
                loading={loadingId === reward.id}
                onRedeem={() => redeem(reward)}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
