import Link from "next/link";
import NavLinks from "./NavLinks";
import UserMenu from "./UserMenu";
import { createClient } from "@/lib/supabase/server";
import { formatPoints } from "@/lib/format";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { username: string; points_balance: number } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, points_balance")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "16px 40px",
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "color-mix(in srgb, var(--color-bg) 90%, transparent)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--color-divider)",
        flexWrap: "wrap",
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--color-text)" }}>
        <i className="ph-fill ph-game-controller" style={{ fontSize: 22, color: "var(--color-accent)" }} />
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 18, letterSpacing: "-0.01em" }}>
          StreetGame
        </span>
      </Link>

      <NavLinks />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--color-surface)",
          border: "1px solid var(--color-divider)",
          borderRadius: "var(--radius-md)",
          padding: "6px 12px",
          flex: 1,
          minWidth: 160,
          maxWidth: 260,
        }}
      >
        <i className="ph ph-magnifying-glass" style={{ opacity: 0.55 }} />
        <input className="input" style={{ border: 0, background: "transparent", padding: 0, minHeight: "auto" }} placeholder="Joueur, jeu…" />
      </div>

      {profile ? (
        <>
          <div className="tag tag-accent" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 13, whiteSpace: "nowrap" }}>
            <i className="ph-fill ph-coins" /> {formatPoints(profile.points_balance)} pts
          </div>
          <UserMenu username={profile.username} />
        </>
      ) : (
        <Link href="/connexion" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
          Se connecter
        </Link>
      )}
    </header>
  );
}
