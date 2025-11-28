"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ChatMessage, KnowledgeBaseEntry, UserAccount } from "@/lib/types";
import { ChatTopic, readUserTopics, writeUserTopics } from "@/lib/userTopics";
import { useOnbuddyData, uid } from "@/lib/useOnbuddyData";
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

function summarizePrompt(prompt: string) {
  if (!prompt.trim()) return "New topic";
  const snippet = prompt.trim().slice(0, 48);
  return snippet.length < prompt.trim().length ? `${snippet}…` : snippet;
}

function buildInitialTopics(session: UserAccount | null) {
  if (!session) return [] as ChatTopic[];

  const storedTopics = readUserTopics(session.id);
  if (storedTopics.length > 0) return storedTopics;

  return [
    {
      id: uid("topic"),
      title: "New topic",
      createdAt: new Date().toISOString(),
      messages: [],
    },
  ];
}

export default function UserChatTopicsPage() {
  const router = useRouter();
  const { departments, profiles, knowledgeBase } = useOnbuddyData();

  const [initialState] = useState(() => {
    const session = readUserSession();
    const initialTopics = buildInitialTopics(session);
    return {
      session,
      initialTopics,
      activeTopicId: initialTopics[0]?.id ?? null,
    };
  });

  const [userSession, setUserSession] = useState<UserAccount | null>(initialState.session);
  const [topics, setTopics] = useState<ChatTopic[]>(initialState.initialTopics);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(initialState.activeTopicId);
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    if (!userSession) {
      router.replace("/user");
    }
  }, [router, userSession]);

  useEffect(() => {
    if (userSession) {
      writeUserSession(userSession);
      writeUserTopics(userSession.id, topics);
    }
  }, [topics, userSession]);

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

  const activeTopic = useMemo(
    () => topics.find((topic) => topic.id === activeTopicId) ?? null,
    [activeTopicId, topics],
  );

  function composeAnswer(question: string) {
    if (!userProfile) {
      return {
        reply:
          "I couldn&apos;t find a profile linked to your account. Ask a superadmin to connect you to a department profile.",
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
          "I don&apos;t have a perfect answer yet. I&apos;ve logged your question so the superadmin can enrich the knowledge base.",
        entry: null,
      };
    }

    const reply = `For the ${userProfile.name} profile, here&apos;s what I found in "${top.entry.title}": ${top.entry.details}`;
    return { reply, entry: top.entry };
  }

  function startNewTopic() {
    const newTopic: ChatTopic = {
      id: uid("topic"),
      title: "New topic",
      createdAt: new Date().toISOString(),
      messages: [],
    };
    setTopics((prev) => [newTopic, ...prev]);
    setActiveTopicId(newTopic.id);
    setUserInput("");
  }

  function handleSendMessage() {
    if (!activeTopic) return;

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

    setTopics((prev) => {
      const updated = prev.map((topic) => {
        if (topic.id !== activeTopic.id) return topic;

        const updatedMessages = [...topic.messages, newUserMessage, assistantMessage];
        const newTitle = topic.title === "New topic" ? summarizePrompt(trimmed) : topic.title;

        return {
          ...topic,
          title: newTitle,
          messages: updatedMessages,
        };
      });

      updated.sort((a, b) => {
        const aLast = a.messages[a.messages.length - 1]?.createdAt ?? a.createdAt;
        const bLast = b.messages[b.messages.length - 1]?.createdAt ?? b.createdAt;
        return new Date(bLast).getTime() - new Date(aLast).getTime();
      });

      return updated;
    });

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
      <div className="grid min-h-screen grid-cols-[280px_1fr] bg-slate-950">
        <aside className="flex flex-col gap-4 border-r border-white/10 bg-slate-900/70 p-4">
          <div className="rounded-xl border border-white/10 bg-slate-900 p-3 text-sm text-slate-200 space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-200/80">Logged in</p>
            <p className="font-semibold">{userSession.name}</p>
            <p className="text-[11px] text-slate-400">{userDepartment?.name} • {userProfile?.name}</p>
            <div className="flex gap-2 pt-2 text-xs">
              <Link
                href="/user/workspace"
                className="flex-1 rounded-lg border border-blue-400/50 bg-blue-500/10 px-2 py-1 text-center font-semibold text-blue-100 transition hover:border-blue-300"
              >
                Workspace
              </Link>
              <button
                onClick={signOutUser}
                className="flex-1 rounded-lg border border-slate-700 px-2 py-1 font-semibold text-slate-200 transition hover:border-slate-500"
              >
                Sign out
              </button>
            </div>
          </div>

          <button
            onClick={startNewTopic}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-400/40 bg-blue-500 text-blue-950 px-3 py-2 text-sm font-semibold shadow-lg shadow-blue-500/10 transition hover:bg-blue-400"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-950 text-blue-100">+</span>
            New topic
          </button>

          <div className="flex-1 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/60 p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Topics</p>
            {topics.length === 0 ? (
              <p className="text-sm text-slate-400">No topics yet. Start a conversation.</p>
            ) : (
              <div className="space-y-2">
                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setActiveTopicId(topic.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                      topic.id === activeTopicId
                        ? "border-blue-300/60 bg-blue-500/10 text-blue-50"
                        : "border-slate-800 bg-slate-950/60 text-slate-200 hover:border-slate-600"
                    }`}
                  >
                    <p className="font-semibold">{topic.title}</p>
                    <p className="text-[11px] text-slate-400">{formatDate(topic.createdAt)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-3 text-xs text-emerald-100">
            <p className="font-semibold">Grounded replies</p>
            <p className="text-emerald-50/80">
              Each chat uses the knowledge base tied to {userProfile?.name ?? "your profile"}. Replace the demo reply builder with an API call to ship it live.
            </p>
          </div>
        </aside>

        <section className="flex flex-col gap-6 p-8">
          <header className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-200/80">User chats</p>
              <h1 className="text-3xl font-semibold">Organize questions by topic</h1>
              <p className="text-slate-300">
                Create lightweight threads for each onboarding or SOP topic. Messages stay grouped like ChatGPT conversations.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
              <p className="text-xs text-slate-400">Knowledge entries</p>
              <p className="text-lg font-semibold">{profileKnowledge.length}</p>
            </div>
          </header>

          <div className="flex-1 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 h-[540px]">
              {!activeTopic || activeTopic.messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-400">
                  <p className="text-sm font-semibold">Start chatting about a topic</p>
                  <p className="text-xs">Use the sidebar to create a thread. Replies reference your profile&apos;s knowledge.</p>
                </div>
              ) : (
                activeTopic.messages.map((message, idx) => (
                  <div
                    key={`${message.createdAt}-${idx}`}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow ${
                        message.role === "user"
                          ? "bg-blue-500 text-blue-950 rounded-br-md"
                          : "bg-slate-800 text-slate-50 rounded-bl-md"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <span className="mt-1 block text-[10px] opacity-70 text-right">
                        {message.role === "user" ? "You" : "Onbuddy"} • {formatDate(message.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-end gap-3">
                <textarea
                  className="flex-1 resize-none rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 max-h-32 text-slate-50 placeholder:text-slate-500"
                  placeholder="Ask about onboarding, playbooks, or SOPs..."
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
                The reply uses your profile-specific knowledge. Swap the handler for an OpenAI API call to make it production-ready.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
