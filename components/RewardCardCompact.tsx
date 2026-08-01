import type { Game, Reward } from "@/lib/types";
import { formatPoints } from "@/lib/format";

export default function RewardCardCompact({
  reward,
  game,
}: {
  reward: Pick<Reward, "title" | "points_cost" | "icon" | "is_available">;
  game: Pick<Game, "name">;
}) {
  return (
    <div className="card elev-sm" style={{ flexDirection: "row", alignItems: "center", gap: 14, opacity: reward.is_available ? 1 : 0.55 }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "var(--radius-md)",
          background: reward.is_available ? "var(--color-accent-800)" : "var(--color-neutral-800)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        }}
      >
        <i
          className={`${reward.is_available ? "ph-fill" : "ph"} ${reward.is_available ? reward.icon : "ph-lock-simple"}`}
          style={{ fontSize: 22, color: reward.is_available ? "var(--color-accent-100)" : undefined }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <div className="card-title" style={{ fontSize: 15 }}>
          {reward.title}
        </div>
        <div className="card-meta">
          {game.name} · {reward.is_available ? `${formatPoints(reward.points_cost)} pts` : "Bientôt"}
        </div>
      </div>
    </div>
  );
}
