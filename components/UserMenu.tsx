"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function UserMenu({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Menu de ${username}`}
        style={{
          width: 36,
          height: 36,
          flex: "none",
          borderRadius: "50%",
          background: "var(--color-surface)",
          border: "1px solid var(--color-divider)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <i className="ph-fill ph-user" style={{ fontSize: 17, opacity: 0.75 }} />
      </button>
      {open && (
        <div
          className="card elev-md"
          style={{ position: "absolute", right: 0, top: 44, width: 200, zIndex: 30, padding: 8, gap: 2 }}
        >
          <div style={{ padding: "6px 8px", fontSize: 13 }} className="text-muted">
            Connecté en tant que <strong style={{ color: "var(--color-text)" }}>{username}</strong>
          </div>
          <div className="hr" style={{ margin: "4px 0" }} />
          <Link href="/mes-commandes" className="btn btn-ghost btn-block" onClick={() => setOpen(false)}>
            Mes commandes
          </Link>
          <Link href="/mes-defis" className="btn btn-ghost btn-block" onClick={() => setOpen(false)}>
            Mes soumissions
          </Link>
          <button onClick={signOut} className="btn btn-secondary btn-block">
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}
