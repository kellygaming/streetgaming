"use client";

import { useMemo, useState } from "react";
import ChallengeRow, { type SubmissionStatus } from "./ChallengeRow";
import SubmitProofDialog from "./SubmitProofDialog";
import type { Challenge, Game } from "@/lib/types";

export type ChallengeWithGame = Challenge & { games: Game };

export default function DefisList({
  challenges,
  games,
  submissionStatusByChallenge,
  isAuthenticated,
}: {
  challenges: ChallengeWithGame[];
  games: Game[];
  submissionStatusByChallenge: Record<string, SubmissionStatus>;
  isAuthenticated: boolean;
}) {
  const [filter, setFilter] = useState<string | null>(null);
  const [openChallenge, setOpenChallenge] = useState<ChallengeWithGame | null>(null);

  const filtered = useMemo(
    () => (filter ? challenges.filter((c) => c.game_id === filter) : challenges),
    [challenges, filter]
  );

  return (
    <>
      <div className="seg" style={{ marginBottom: 32 }}>
        <label className="seg-opt">
          <input type="radio" name="filtre" checked={filter === null} onChange={() => setFilter(null)} />
          <span>Tous</span>
        </label>
        {games.map((g) => (
          <label className="seg-opt" key={g.id}>
            <input type="radio" name="filtre" checked={filter === g.id} onChange={() => setFilter(g.id)} />
            <span>{g.name}</span>
          </label>
        ))}
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {filtered.map((challenge) => (
          <ChallengeRow
            key={challenge.id}
            challenge={challenge}
            game={challenge.games}
            submissionStatus={submissionStatusByChallenge[challenge.id] ?? null}
            isAuthenticated={isAuthenticated}
            onChallenge={() => setOpenChallenge(challenge)}
          />
        ))}
      </div>

      {openChallenge && (
        <SubmitProofDialog
          challengeId={openChallenge.id}
          challengeTitle={openChallenge.title}
          onClose={() => setOpenChallenge(null)}
        />
      )}
    </>
  );
}
