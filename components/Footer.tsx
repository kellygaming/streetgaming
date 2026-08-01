export default function Footer() {
  return (
    <footer
      style={{
        padding: "32px 24px",
        borderTop: "1px solid var(--color-divider)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <span style={{ fontSize: 13 }} className="text-muted">
        © 2026 StreetGame — le réseau des joueurs mobile.
      </span>
      <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
        <a href="#">Discord</a>
        <a href="#">Support</a>
        <a href="#">Règles des défis</a>
      </div>
    </footer>
  );
}
