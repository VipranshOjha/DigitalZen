"use client";

import { useState } from "react";
import ChatBubble from "../components/ChatBubble";
import Loader from "../components/Loader";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    // Fake thinking delay
    await new Promise((r) => setTimeout(r, 1200));

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: input }),
    });

    const data = await res.json();

    setMessages((m) => [
      ...m,
      { role: "ai", text: data.reply },
    ]);

    setLoading(false);
  }

  return (
    <main className="container">
      <header className="header">
        🤖 TrustMeBro AI
        <span>Source: Just trust me, bro.</span>
      </header>

      <section className="chat">
        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} text={msg.text} />
        ))}

        {loading && <Loader />}
      </section>

      <footer className="inputBox">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something deeply important..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </footer>
    </main>
  );
}