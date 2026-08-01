"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import GameCover from "./GameCover";
import ChatMessageBubble, { type ChatMessageView } from "./ChatMessageBubble";
import ChatBackgroundPicker from "./ChatBackgroundPicker";
import type { ChatBackground, Game } from "@/lib/types";

type ChallengeOfTheMoment = { id: string; title: string; description: string } | null;

export default function ChatShell({
  currentGame,
  allGames,
  initialMessages,
  currentUser,
  initialBackground,
  challengeOfTheMoment,
}: {
  currentGame: Game;
  allGames: Game[];
  initialMessages: ChatMessageView[];
  currentUser: { id: string; username: string } | null;
  initialBackground: ChatBackground | null;
  challengeOfTheMoment: ChallengeOfTheMoment;
}) {
  const supabase = useMemo(() => createClient(), []);

  const [messages, setMessages] = useState<ChatMessageView[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const [onlineCounts, setOnlineCounts] = useState<Record<string, number>>({});
  const [onlineMembers, setOnlineMembers] = useState<string[]>([]);

  const [panelOpen, setPanelOpen] = useState(false);
  const [bgType, setBgType] = useState<ChatBackground["bg_type"]>(initialBackground?.bg_type ?? "default");
  const [bgValue, setBgValue] = useState<string | null>(initialBackground?.bg_value ?? null);
  const [savingBg, setSavingBg] = useState(false);

  const usernameByProfileId = useRef<Map<string, string>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    for (const m of initialMessages) usernameByProfileId.current.set(m.profile_id, m.username);
    if (currentUser) usernameByProfileId.current.set(currentUser.id, currentUser.username);
  }, [initialMessages, currentUser]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // Un canal Realtime par jeu : présence pour le compteur "en ligne" dans
  // la sidebar de gauche, + messages + présence détaillée pour le salon actif.
  useEffect(() => {
    const channels: RealtimeChannel[] = [];

    for (const game of allGames) {
      const isCurrent = game.id === currentGame.id;
      const channel = supabase.channel(`chat:${game.slug}`, {
        config: { presence: { key: currentUser?.id ?? undefined } },
      });

      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ username: string }>();
        const keys = Object.keys(state);
        setOnlineCounts((prev) => ({ ...prev, [game.slug]: keys.length }));
        if (isCurrent) {
          setOnlineMembers(keys.map((k) => state[k][0]?.username).filter(Boolean));
        }
      });

      if (isCurrent) {
        channel.on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages", filter: `game_id=eq.${game.id}` },
          (payload) => {
            const row = payload.new as { id: string; profile_id: string; content: string; created_at: string };
            setMessages((prev) => {
              if (prev.some((m) => m.id === row.id)) return prev;
              return [
                ...prev,
                {
                  id: row.id,
                  profile_id: row.profile_id,
                  content: row.content,
                  created_at: row.created_at,
                  username: usernameByProfileId.current.get(row.profile_id) ?? "Joueur",
                },
              ];
            });
          }
        );
      }

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED" && currentUser) {
          await channel.track({ username: currentUser.username });
        }
      });

      channels.push(channel);
    }

    return () => {
      for (const c of channels) supabase.removeChannel(c);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGame.id, allGames, currentUser?.id]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !draft.trim() || sending) return;
    setSending(true);
    const content = draft.trim();
    setDraft("");
    const { error } = await supabase.from("chat_messages").insert({ game_id: currentGame.id, profile_id: currentUser.id, content });
    setSending(false);
    if (error) setDraft(content);
  }

  async function persistBackground(next: { bg_type: ChatBackground["bg_type"]; bg_value: string | null }) {
    if (!currentUser) return;
    setSavingBg(true);
    await supabase.from("chat_backgrounds").upsert({
      profile_id: currentUser.id,
      game_id: currentGame.id,
      bg_type: next.bg_type,
      bg_value: next.bg_value,
    });
    setSavingBg(false);
  }

  function pickColor(value: string) {
    setBgType("color");
    setBgValue(value);
    setPanelOpen(false);
    persistBackground({ bg_type: "color", bg_value: value });
  }

  async function pickFile(file: File) {
    if (!currentUser) return;
    setSavingBg(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${currentUser.id}/${currentGame.id}.${ext}`;
    const { error } = await supabase.storage.from("chat-backgrounds").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("chat-backgrounds").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;
      setBgType("image");
      setBgValue(url);
      setPanelOpen(false);
      await persistBackground({ bg_type: "image", bg_value: url });
    }
    setSavingBg(false);
  }

  function resetBackground() {
    setBgType("default");
    setBgValue(null);
    setPanelOpen(false);
    persistBackground({ bg_type: "default", bg_value: null });
  }

  const bgLayerStyle: React.CSSProperties = { position: "absolute", inset: 0, zIndex: 0 };
  if (bgType === "color" && bgValue) bgLayerStyle.background = bgValue;
  else if (bgType === "image" && bgValue) {
    bgLayerStyle.backgroundImage = `url(${bgValue})`;
    bgLayerStyle.backgroundSize = "cover";
    bgLayerStyle.backgroundPosition = "center";
  }

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, maxWidth: 1280, width: "100%", margin: "0 auto" }}>
      <aside style={{ width: 240, flex: "none", borderRight: "1px solid var(--color-divider)", padding: "20px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ padding: "0 14px 10px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.55 }}>
          Communautés jeux
        </div>
        {allGames.map((g) => (
          <Link key={g.id} href={`/communautes/${g.slug}`} className={`sg-room ${g.id === currentGame.id ? "sg-room-active" : ""}`}>
            <i className={`ph-fill ${g.icon}`} style={{ color: g.id === currentGame.id ? "var(--color-accent-300)" : undefined, opacity: g.id === currentGame.id ? 1 : 0.7 }} />
            {g.name}
            <span className="tag tag-outline" style={{ marginLeft: "auto", fontSize: 10 }}>
              {onlineCounts[g.slug] ?? 0} en ligne
            </span>
          </Link>
        ))}
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-divider)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", overflow: "hidden", flex: "none", position: "relative" }}>
            <GameCover game={currentGame} />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 17, display: "flex", alignItems: "center", gap: 8 }}>
              {currentGame.name} <span className="tag tag-accent-2" style={{ fontSize: 11 }}>{currentGame.category}</span>
            </div>
            <div className="text-muted" style={{ fontSize: 13 }}>
              Le salon des fans {currentGame.name} — stratégies, clips, et défis en cours
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginLeft: "auto" }}>
            {currentUser && (
              <button className="btn btn-ghost" onClick={() => setPanelOpen((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <i className="ph ph-palette" />
                Fond du chat
              </button>
            )}
            <Link className="btn btn-secondary" href="/defis" style={{ whiteSpace: "nowrap" }}>
              Voir les défis
            </Link>
          </div>
        </div>

        {panelOpen && currentUser && (
          <ChatBackgroundPicker onPickColor={pickColor} onPickFile={pickFile} onReset={resetBackground} saving={savingBg} />
        )}

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 24, position: "relative" }}>
          <div style={bgLayerStyle} />
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
            {messages.map((m) => (
              <ChatMessageBubble key={m.id} message={m} isMine={m.profile_id === currentUser?.id} />
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-divider)", display: "flex", gap: 10, alignItems: "center" }}>
          {currentUser ? (
            <form onSubmit={sendMessage} style={{ display: "flex", gap: 10, alignItems: "center", width: "100%" }}>
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder={`Écrire un message dans #${currentGame.slug}…`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={2000}
              />
              <button className="btn btn-primary" type="submit" disabled={sending || !draft.trim()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <i className="ph-fill ph-paper-plane-tilt" />
                Envoyer
              </button>
            </form>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span className="text-muted" style={{ fontSize: 14 }}>Connecte-toi pour discuter dans ce salon.</span>
              <Link className="btn btn-primary" href="/connexion">Se connecter</Link>
            </div>
          )}
        </div>
      </main>

      <aside style={{ width: 220, flex: "none", borderLeft: "1px solid var(--color-divider)", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.55, marginBottom: 10 }}>Membres actifs</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {onlineMembers.length === 0 ? (
              <span className="text-muted" style={{ fontSize: 13 }}>Personne en ligne pour l'instant</span>
            ) : (
              onlineMembers.map((name) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent-300)" }} />
                  {name}
                </div>
              ))
            )}
          </div>
        </div>
        {challengeOfTheMoment && (
          <div className="card elev-sm">
            <div className="card-title" style={{ fontSize: 14 }}>Défi du moment</div>
            <p className="card-body" style={{ fontSize: 13 }}>{challengeOfTheMoment.description}</p>
            <Link className="btn btn-primary btn-block" href="/defis" style={{ fontSize: 13 }}>Voir le défi</Link>
          </div>
        )}
      </aside>
    </div>
  );
}
