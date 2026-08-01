"use client";

import { useRef } from "react";

const SWATCHES: { title: string; value: string }[] = [
  { title: "Neutre", value: "var(--color-neutral-900)" },
  { title: "Gris clair", value: "var(--color-neutral-700)" },
  { title: "Accent sombre", value: "var(--color-accent-900)" },
  { title: "Accent", value: "var(--color-accent-700)" },
];

export default function ChatBackgroundPicker({
  onPickColor,
  onPickFile,
  onReset,
  saving,
}: {
  onPickColor: (value: string) => void;
  onPickFile: (file: File) => void;
  onReset: () => void;
  saving: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="card elev-md" style={{ margin: "14px 24px 0", padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <span className="card-meta" style={{ marginRight: 4 }}>
        Fond du chat :
      </span>
      {SWATCHES.map((s) => (
        <button
          key={s.title}
          title={s.title}
          onClick={() => onPickColor(s.value)}
          style={{ width: 26, height: 26, borderRadius: "50%", background: s.value, border: "1px solid var(--color-divider)", cursor: "pointer", padding: 0 }}
        />
      ))}
      <input
        type="color"
        title="Couleur personnalisée"
        onInput={(e) => onPickColor((e.target as HTMLInputElement).value)}
        style={{ width: 26, height: 26, padding: 0, border: "1px solid var(--color-divider)", borderRadius: "50%", background: "transparent", cursor: "pointer" }}
      />
      <label className="btn btn-secondary" style={{ fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
        <i className="ph ph-image" />
        Importer une image
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPickFile(file);
            if (fileRef.current) fileRef.current.value = "";
          }}
          style={{ display: "none" }}
        />
      </label>
      <button className="btn btn-ghost" onClick={onReset} style={{ fontSize: 12, marginLeft: "auto" }}>
        {saving ? "…" : "Réinitialiser"}
      </button>
    </div>
  );
}
