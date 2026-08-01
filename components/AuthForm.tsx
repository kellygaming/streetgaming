"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          setError("Ton e-mail n'est pas encore confirmé — vérifie ta boîte mail (et les spams) pour le lien de confirmation.");
        } else if (error.message.toLowerCase().includes("invalid login credentials")) {
          setError("E-mail ou mot de passe incorrect, ou compte inexistant — vérifie ou crée un compte ci-dessous.");
        } else {
          setError(error.message);
        }
        return;
      }
      router.push(next);
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.push(next);
      router.refresh();
      return;
    }
    setNotice("Compte créé — vérifie tes e-mails pour confirmer ton adresse avant de te connecter.");
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "80px 24px" }}>
      <form onSubmit={onSubmit} className="card elev-md" style={{ width: "min(400px, 100%)", padding: 28, gap: 16 }}>
        <div>
          <div className="dialog-title" style={{ marginBottom: 4 }}>
            {mode === "login" ? "Connexion" : "Rejoindre StreetGame"}
          </div>
          <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
            {mode === "login"
              ? "Retrouve tes défis, tes points et tes salons."
              : "Crée ton compte pour relever des défis et gagner des points."}
          </p>
        </div>

        {mode === "signup" && (
          <div className="field">
            <label htmlFor="username">Pseudo</label>
            <input
              id="username"
              className="input"
              required
              minLength={3}
              maxLength={24}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kenzo_FF"
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            className="input"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="toi@exemple.com"
          />
        </div>

        <div className="field">
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            className="input"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p style={{ color: "#e08a8a", fontSize: 13, margin: 0 }}>{error}</p>
        )}
        {notice && (
          <p style={{ color: "var(--color-accent-300)", fontSize: 13, margin: 0 }}>{notice}</p>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
        </button>

        <p className="text-muted" style={{ fontSize: 13, textAlign: "center", margin: 0 }}>
          {mode === "login" ? (
            <>Pas encore de compte ? <Link href="/inscription">Rejoindre StreetGame</Link></>
          ) : (
            <>Déjà membre ? <Link href="/connexion">Se connecter</Link></>
          )}
        </p>
      </form>
    </div>
  );
}
