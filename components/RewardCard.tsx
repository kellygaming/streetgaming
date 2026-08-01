import type { Reward } from "@/lib/types";
import { formatPoints } from "@/lib/format";

export default function RewardCard({
  reward,
  canAfford,
  isAuthenticated,
  loading,
  onRedeem,
}: {
  reward: Pick<Reward, "id" | "title" | "description" | "points_cost" | "icon" | "is_available">;
  canAfford: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  onRedeem: () => void;
}) {
  const disabled = !reward.is_available || loading || (isAuthenticated && !canAfford);

  return (
    <div className="card elev-sm" style={!reward.is_available ? { opacity: 0.55 } : undefined}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="tag tag-accent-2">{reward.is_available ? "Disponible" : "Bientôt"}</span>
        <i className={`ph-fill ${reward.icon}`} style={{ color: "var(--color-accent-300)" }} />
      </div>
      <div className="card-title">{reward.title}</div>
      <p className="card-body">{reward.description}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
          {reward.is_available ? `${formatPoints(reward.points_cost)} pts` : "—"}
        </span>
        {!reward.is_available ? (
          <button className="btn btn-secondary" disabled>
            Bientôt
          </button>
        ) : !isAuthenticated ? (
          <a className="btn btn-primary" href="/connexion">
            Se connecter
          </a>
        ) : (
          <button className="btn btn-primary" disabled={disabled} onClick={onRedeem} title={!canAfford ? "Solde insuffisant" : undefined}>
            {loading ? "…" : canAfford ? "Échanger" : "Solde insuffisant"}
          </button>
        )}
      </div>
    </div>
  );
}
