export default function GameCover({
  game,
}: {
  game: { name: string; icon: string; cover_url: string | null };
}) {
  if (game.cover_url) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${game.cover_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  }
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 50% 30%, var(--color-accent-900), var(--color-surface))",
      }}
    >
      <i className={`ph-fill ${game.icon}`} style={{ fontSize: 46, color: "var(--color-accent-300)", opacity: 0.55 }} />
    </div>
  );
}
