import type { LeaderboardRow } from "@/lib/types";
import { formatPoints } from "@/lib/format";

export default function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-muted" style={{ fontSize: 14 }}>
        Aucun point gagné cette semaine pour l'instant — sois le premier du classement.
      </p>
    );
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>#</th>
          <th>Joueur</th>
          <th>Jeu principal</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.profile_id}>
            <td style={i === 0 ? { display: "flex", alignItems: "center", gap: 6 } : undefined}>
              {i === 0 && <i className="ph-fill ph-crown" style={{ color: "var(--color-accent)" }} />}
              {i + 1}
            </td>
            <td>{row.username}</td>
            <td>{row.primary_game_name ? <span className="tag tag-accent-2">{row.primary_game_name}</span> : "—"}</td>
            <td>{formatPoints(row.weekly_points)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
