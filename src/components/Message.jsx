import React from "react";

/* ─────────────────────────────────────────────
   Parses raw LLM text into clean React nodes:
   • Removes **bold** markers (keeps the text)
   • Numbered lines  → <ol> items
   • Bullet lines (* / - / •) → <ul> items
   • Sub-bullets (spaces + * / -) → nested <ul>
   • Plain paragraphs → <p>
───────────────────────────────────────────── */
function parseText(raw) {
  if (!raw) return null;

  // Strip **bold** markers but keep content
  const clean = raw.replace(/\*\*(.*?)\*\*/g, "$1");

  const lines = clean.split("\n");
  const nodes = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // ── Numbered list item  e.g.  "1. Something"
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      const items = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const m = t.match(/^(\d+)\.\s+(.*)/);
        if (!m) break;
        items.push(<li key={i}>{m[2]}</li>);
        i++;
      }
      nodes.push(
        <ol key={`ol-${i}`} className="ai-list ai-list-ol">{items}</ol>
      );
      continue;
    }

    // ── Bullet item  (* / - / •)
    const bulletMatch = trimmed.match(/^[*\-•]\s+(.*)/);
    if (bulletMatch) {
      const items = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const m = t.match(/^[*\-•]\s+(.*)/);
        if (!m) break;
        items.push(<li key={i}>{m[1]}</li>);
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} className="ai-list ai-list-ul">{items}</ul>
      );
      continue;
    }

    // ── Plain text paragraph
    nodes.push(<p key={i} className="ai-para">{trimmed}</p>);
    i++;
  }

  return nodes;
}


function Message({ sender, text, lang }) {
  const isUser = sender === "user";

  return (
    <div className={`message-row ${isUser ? "user-row" : "ai-row"}`}>
      {/* Avatar */}
      <div className={`msg-avatar ${isUser ? "user-avatar-msg" : "ai-avatar"}`}>
        {isUser ? "👤" : "⚖️"}
      </div>

      {/* Bubble */}
      <div className="msg-content">
        {!isUser && (
          <div className="msg-sender">Legal AI (Llama 3)</div>
        )}
        <div className={`msg-bubble ${isUser ? "user-bubble" : "ai-bubble"}`} lang={!isUser && lang ? lang : undefined}>
          {isUser ? text : parseText(text)}

        </div>
      </div>
    </div>
  );
}

export default Message;
