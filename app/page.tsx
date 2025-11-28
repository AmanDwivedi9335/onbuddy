"use client";

import { FormEvent, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const newUserMessage: ChatMessage = {
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          conversationId,
        }),
      });

      if (!res.ok) {
        console.error("Failed to send message", await res.text());
        setIsLoading(false);
        return;
      }

      const data = await res.json();

      setConversationId(data.conversationId);
      setMessages(data.messages);
    } catch (err) {
      console.error("Error calling chat API:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl h-[80vh] flex flex-col border border-gray-800 rounded-2xl bg-gray-900/70 backdrop-blur-md shadow-xl overflow-hidden">
        {/* Header */}
        <header className="px-4 sm:px-6 py-3 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Onbuddy
            </h1>
            <p className="text-xs text-gray-400">
              ChatGPT-like assistant powered by Next.js &amp; MongoDB
            </p>
          </div>
          <div className="text-xs text-gray-500">
            {conversationId ? `Conversation: ${conversationId}` : "New chat"}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
              <p className="text-sm mb-1">Welcome to Onbuddy.</p>
              <p className="text-xs">
                Ask anything and your conversation will be stored in MongoDB.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-gray-800 text-gray-100 rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <span className="block mt-1 text-[10px] text-gray-300 opacity-70 text-right">
                    {msg.role === "user" ? "You" : "Onbuddy"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-gray-800 p-3 sm:p-4">
          <div className="flex items-end gap-2">
            <textarea
              className="flex-1 resize-none rounded-xl bg-gray-900 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 max-h-32 text-gray-50 placeholder:text-gray-500"
              placeholder="Send a message to Onbuddy..."
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="inline-flex items-center justify-center rounded-xl border border-blue-500 px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600/80 bg-blue-600 text-white transition"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
          <p className="mt-1 text-[10px] text-gray-500">
            Onbuddy is a demo interface. Replace the backend logic to connect to a real AI model.
          </p>
        </form>
      </div>
    </main>
  );
}
