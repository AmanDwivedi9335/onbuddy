"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ChatMessage, KnowledgeBaseEntry, UserAccount } from "@/lib/types";
import { useOnbuddyData } from "@/lib/useOnbuddyData";
import { readUserSession, writeUserSession } from "@/lib/userSession";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function scoreEntry(question: string, entry: KnowledgeBaseEntry) {
  const normalizedQuestion = question.toLowerCase();
  const haystack = `${entry.title} ${entry.details}`.toLowerCase();
  const words = normalizedQuestion
    .replace(/[^a-z0-9\s]/gi, " ")
    .split(" ")
    .filter(Boolean);

  let score = 0;
  for (const word of words) {
    if (haystack.includes(word)) {
      score += 1;
    }
  }

  return score;
}

export default function UserWorkspacePage() {
  const { departments, profiles, knowledgeBase } = useOnbuddyData();
  const router = useRouter();

  const [userSession, setUserSession] = useState<UserAccount | null>(() => readUserSession());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    if (!userSession) {
      router.replace("/user");
    }
  }, [router, userSession]);

  useEffect(() => {
    if (userSession) {
      writeUserSession(userSession);
    }
  }, [userSession]);

  const userProfile = useMemo(
    () => profiles.find((p) => p.id === userSession?.profileId),
    [profiles, userSession?.profileId],
  );

  const userDepartment = useMemo(
    () => departments.find((dept) => dept.id === userSession?.departmentId),
    [departments, userSession?.departmentId],
  );

  const profileKnowledge = useMemo(
    () => knowledgeBase.filter((entry) => entry.profileId === userSession?.profileId),
    [knowledgeBase, userSession?.profileId],
  );

  function composeAnswer(question: string) {
    if (!userProfile) {
      return {
        reply:
          "I couldn't find a profile linked to your account. Ask a superadmin to connect you to a department profile.",
        entry: null,
      };
    }

    const relevantEntries = profileKnowledge
      .map((entry) => ({ entry, score: scoreEntry(question, entry) }))
      .sort((a, b) => b.score - a.score);

    const top = relevantEntries[0];

    if (!top || top.score === 0) {
      return {
        reply:
          "I don't have a perfect answer yet. I've logged your question so the superadmin can enrich the knowledge base.",
        entry: null,
      };
    }

    const reply = `For the ${userProfile.name} profile, here's what I found in "${top.entry.title}": ${top.entry.details}`;
    return { reply, entry: top.entry };
  }

  function handleSendMessage() {
    const trimmed = userInput.trim();
    if (!trimmed) return;

    const newUserMessage: ChatMessage = {
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const { reply } = composeAnswer(trimmed);

    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: reply,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMessage, assistantMessage]);
    setUserInput("");
  }

  function signOutUser() {
    setUserSession(null);
    writeUserSession(null);
    router.replace("/user");
  }

  if (!userSession) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center space-y-3">
          <p className="text-sm text-slate-400">Redirecting to user login...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-950 p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-200/80">User workspace</p>
              <h1 className="text-3xl md:text-4xl font-semibold">Ask role-aware questions</h1>
              <p className="text-slate-200 max-w-2xl">
                Log in as a teammate to see knowledge curated by superadmins and chat with an assistant grounded in your profile.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 min-w-[280px] space-y-3 text-sm">
              <div className="rounded-xl border border-blue-300/40 bg-blue-500/10 p-3 text-blue-50 space-y-1">
                <p className="font-semibold">{userSession.name}</p>
                <p className="text-xs">{userSession.email}</p>
                <p className="text-[11px]">{userDepartment?.name} • {userProfile?.name}</p>
              </div>
              <button
                onClick={signOutUser}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold hover:border-slate-500"
              >
                Sign out and return to login
              </button>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          <section className="lg:col-span-1 space-y-3 rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Knowledge at a glance</h3>
              <p className="text-xs text-slate-400">Tied to your profile</p>
            </div>
            {profileKnowledge.length > 0 ? (
              <div className="space-y-2 text-sm">
                {profileKnowledge.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"
                  >
                    <p className="text-xs text-slate-400">{userProfile?.name}</p>
                    <p className="font-semibold">{entry.title}</p>
                    <p className="text-xs text-slate-300/90">{entry.details}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-amber-200/80">
                No knowledge exists for this profile yet. Ask the superadmin to add guidance.
              </p>
            )}
          </section>

          <section className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Role-aware Chat</h3>
              <p className="text-xs text-slate-400">Grounded in the knowledge base</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 h-[420px] flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                    <p className="text-sm font-medium">Ask anything about your role</p>
                    <p className="text-xs">Responses reference the knowledge base saved by the superadmin.</p>
                  </div>
                ) : (
                  messages.map((message, idx) => (
                    <div
                      key={idx}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          message.role === "user"
                            ? "bg-blue-500 text-blue-950 rounded-br-sm"
                            : "bg-slate-800 text-slate-100 rounded-bl-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <span className="block mt-1 text-[10px] opacity-70 text-right">
                          {message.role === "user" ? "You" : "Onbuddy"} • {formatDate(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-slate-800 p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    className="flex-1 resize-none rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 max-h-32 text-slate-50 placeholder:text-slate-500"
                    placeholder="Ask about your onboarding, playbooks, or SOPs..."
                    rows={1}
                    disabled={!userSession}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                  />
                  <button
                    disabled={!userSession || !userInput.trim()}
                    onClick={handleSendMessage}
                    className="inline-flex items-center justify-center rounded-xl border border-blue-400 px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-500/80 bg-blue-500 text-blue-950 transition"
                  >
                    Send
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  The reply uses your profile-specific knowledge. Replace the handler with your OpenAI API call to make it live.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
