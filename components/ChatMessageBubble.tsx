export type ChatMessageView = {
  id: string;
  profile_id: string;
  content: string;
  created_at: string;
  username: string;
};

export default function ChatMessageBubble({ message, isMine }: { message: ChatMessageView; isMine: boolean }) {
  const time = new Date(message.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className={`card ${isMine ? "sg-msg-me" : "sg-msg-in"}`}
      style={{
        display: "flex",
        gap: 10,
        maxWidth: "70%",
        alignSelf: isMine ? "flex-end" : "flex-start",
        flexDirection: isMine ? "row-reverse" : "row",
        padding: "10px 14px",
        borderRadius: "var(--radius-md)",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: isMine ? "var(--color-accent-800)" : "var(--color-neutral-800)",
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <i className="ph-fill ph-user" style={{ fontSize: 15, opacity: isMine ? 1 : 0.6 }} />
      </div>
      <div style={{ textAlign: isMine ? "right" : "left" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
          {isMine ? (
            <>
              <span className="text-muted" style={{ fontWeight: 400, fontSize: 11 }}>
                {time}
              </span>{" "}
              Toi
            </>
          ) : (
            <>
              {message.username} <span className="text-muted" style={{ fontWeight: 400, fontSize: 11 }}>{time}</span>
            </>
          )}
        </div>
        <div style={{ fontSize: 14, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{message.content}</div>
      </div>
    </div>
  );
}
