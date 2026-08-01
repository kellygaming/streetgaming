"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SubmitProofDialog({
  challengeId,
  challengeTitle,
  onClose,
}: {
  challengeId: string;
  challengeTitle: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file && !link.trim()) {
      setError("Ajoute une capture d'écran ou un lien replay.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Connecte-toi pour soumettre une preuve.");

      let proofUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() || "png";
        const path = `${user.id}/${challengeId}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("challenge-proofs").upload(path, file);
        if (uploadError) throw uploadError;
        proofUrl = path;
      }

      const { error: rpcError } = await supabase.rpc("submit_challenge", {
        p_challenge_id: challengeId,
        p_proof_url: proofUrl,
        p_proof_link: link.trim() || null,
      });
      if (rpcError) throw rpcError;

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form className="dialog" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <div className="dialog-title">Soumettre une preuve</div>
        <div className="dialog-body">
          Défi : <strong style={{ color: "var(--color-text)" }}>{challengeTitle}</strong>. Envoie une capture d'écran
          ou un lien replay — un modérateur validera manuellement ta soumission.
        </div>

        <div className="field">
          <label htmlFor="proof-file">Capture d'écran</label>
          <input
            id="proof-file"
            type="file"
            accept="image/*"
            className="input"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="field">
          <label htmlFor="proof-link">…ou lien replay</label>
          <input
            id="proof-link"
            className="input"
            placeholder="https://…"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>

        {error && <p style={{ color: "#e08a8a", fontSize: 13, margin: 0 }}>{error}</p>}

        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Envoi…" : "Envoyer ma preuve"}
          </button>
        </div>
      </form>
    </div>
  );
}
