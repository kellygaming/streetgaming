import Link from "next/link";
import type { Challenge, Game } from "@/lib/types";

export default function ChallengeCardCompact({
  challenge,
  game,
}: {
  challenge: Pick<Challenge, "id" | "title" | "description" | "reward_label" | "status">;
  game: Pick<Game, "name">;
}) {
  const isActive = challenge.status === "active";
  return (
    <div className="card elev-sm" style={isActive ? undefined : { opacity: 0.6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="tag tag-accent-2">{game.name}</span>
        {isActive ? (
          <span className="tag tag-outline" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <i className="ph-fill ph-diamond" />
            {challenge.reward_label}
          </span>
        ) : (
          <span className="tag tag-neutral" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <i className="ph ph-clock" />
            Bientôt
          </span>
        )}
      </div>
      <div className="card-title">{challenge.title}</div>
      <p className="card-body">{challenge.description}</p>
      {isActive ? (
        <Link className="btn btn-primary btn-block" href="/defis">
          Relever le défi
        </Link>
      ) : (
        <button className="btn btn-secondary btn-block" disabled>
          Bientôt disponible
        </button>
      )}
    </div>
  );
}
