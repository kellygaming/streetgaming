import type { Challenge, Game } from "@/lib/types";
import { formatPoints } from "@/lib/format";
import GameCover from "./GameCover";

export type SubmissionStatus = "pending" | "approved" | "rejected" | null;

export default function ChallengeRow({
  challenge,
  game,
  submissionStatus,
  isAuthenticated,
  onChallenge,
}: {
  challenge: Pick<Challenge, "id" | "title" | "description" | "points_reward" | "reward_label" | "status">;
  game: Pick<Game, "name" | "icon" | "cover_url">;
  submissionStatus: SubmissionStatus;
  isAuthenticated: boolean;
  onChallenge: () => void;
}) {
  const isActive = challenge.status === "active";

  return (
    <div className="card elev-md" style={{ flexDirection: "row", alignItems: "stretch", gap: 20, padding: 20, opacity: isActive ? 1 : 0.55 }}>
      <div style={{ width: 96, flex: "none", borderRadius: "var(--radius-md)", overflow: "hidden", position: "relative" }}>
        <GameCover game={game} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div>
            <span className="tag tag-accent-2" style={{ marginBottom: 6, display: "inline-block" }}>
              {game.name}
            </span>
            <div className="card-title">{challenge.title}</div>
          </div>
          {isActive ? (
            <span className="tag tag-outline" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
              <i className="ph ph-check-circle" />
              Actif
            </span>
          ) : (
            <span className="tag tag-neutral" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
              <i className="ph ph-clock" />
              Bientôt
            </span>
          )}
        </div>
        <p className="card-body">{challenge.description}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: "auto" }}>
          {isActive ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontFamily: "var(--font-heading)", color: "var(--color-accent-300)" }}>
              <i className="ph-fill ph-diamond" />
              {challenge.reward_label ?? `${formatPoints(challenge.points_reward)} pts`}
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, opacity: 0.6 }}>
              <i className="ph ph-lock-simple" />
              Récompense à venir
            </span>
          )}

          {!isActive ? (
            <button className="btn btn-secondary" disabled>
              Bientôt disponible
            </button>
          ) : !isAuthenticated ? (
            <a className="btn btn-primary" href="/connexion">
              Se connecter pour participer
            </a>
          ) : submissionStatus === "pending" ? (
            <span className="tag tag-outline">En attente de validation</span>
          ) : submissionStatus === "approved" ? (
            <span className="tag tag-accent" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <i className="ph-fill ph-check-circle" />
              Validé
            </span>
          ) : (
            <button className="btn btn-primary" onClick={onChallenge}>
              {submissionStatus === "rejected" ? "Réessayer" : "Relever le défi"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
