"use client";

import { useMemo, useState } from "react";
import { ChatMessage, KnowledgeBaseEntry, Profile, UserAccount } from "@/lib/types";
import { useOnbuddyData, uid } from "@/lib/useOnbuddyData";

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

export default function UserPage() {
  const { departments, profiles, knowledgeBase, users, setUsers } = useOnbuddyData();

  const [userMode, setUserMode] = useState<"login" | "signup">("login");
  const [userSession, setUserSession] = useState<UserAccount | null>(null);
  const [userCredentials, setUserCredentials] = useState({
    name: "",
    email: "",
    password: "",
    departmentId: "",
    profileId: "",
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");

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

  const profilesByDepartment = useMemo(() => {
    return profiles.reduce<Record<string, Profile[]>>((acc, profile) => {
      acc[profile.departmentId] = acc[profile.departmentId] || [];
      acc[profile.departmentId].push(profile);
      return acc;
    }, {});
  }, [profiles]);

  function handleUserSubmit() {
    const trimmedEmail = userCredentials.email.trim().toLowerCase();
    const trimmedName = userCredentials.name.trim();

    if (!trimmedEmail || !userCredentials.password.trim()) return;

    if (userMode === "login") {
      const match = users.find(
        (user) =>
          user.role === "user" &&
          user.email.toLowerCase() === trimmedEmail &&
          user.password === userCredentials.password,
      );

      if (match) {
        setUserSession(match);
        setMessages([]);
        setUserInput("");
      } else {
        alert("User account not found. Please sign up first.");
      }
    } else {
      if (!userCredentials.departmentId || !userCredentials.profileId) {
        alert("Pick a department and profile to complete signup.");
        return;
      }

      const alreadyExists = users.some((user) => user.email.toLowerCase() === trimmedEmail);

      if (alreadyExists) {
        alert("An account with this email already exists.");
        return;
      }

      const newUser: UserAccount = {
        id: uid("user"),
        role: "user",
        name: trimmedName || "New Teammate",
        email: trimmedEmail,
        password: userCredentials.password,
        departmentId: userCredentials.departmentId,
        profileId: userCredentials.profileId,
      };

      setUsers((prev) => [...prev, newUser]);
      setUserSession(newUser);
      setMessages([]);
      setUserInput("");
    }
  }

  function signOutUser() {
    setUserSession(null);
    setMessages([]);
    setUserInput("");
  }

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
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setUserMode("login")}
                  className={`rounded-lg px-3 py-2 font-semibold transition ${
                    userMode === "login"
                      ? "bg-blue-500 text-blue-950"
                      : "bg-slate-800 text-slate-200"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setUserMode("signup")}
                  className={`rounded-lg px-3 py-2 font-semibold transition ${
                    userMode === "signup"
                      ? "bg-blue-500 text-blue-950"
                      : "bg-slate-800 text-slate-200"
                  }`}
                >
                  Sign up
                </button>
              </div>

              {userMode === "signup" && (
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                  placeholder="Full name"
                  value={userCredentials.name}
                  onChange={(e) => setUserCredentials((prev) => ({ ...prev, name: e.target.value }))}
                />
              )}
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                placeholder="Email"
                value={userCredentials.email}
                onChange={(e) => setUserCredentials((prev) => ({ ...prev, email: e.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                placeholder="Password"
                type="password"
                value={userCredentials.password}
                onChange={(e) => setUserCredentials((prev) => ({ ...prev, password: e.target.value }))}
              />

              {userMode === "signup" && (
                <div className="space-y-2">
                  <select
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                    value={userCredentials.departmentId}
                    onChange={(e) =>
                      setUserCredentials((prev) => ({ ...prev, departmentId: e.target.value, profileId: "" }))
                    }
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                    value={userCredentials.profileId}
                    onChange={(e) =>
                      setUserCredentials((prev) => ({ ...prev, profileId: e.target.value }))
                    }
                    disabled={!userCredentials.departmentId}
                  >
                    <option value="">Select profile</option>
                    {(profilesByDepartment[userCredentials.departmentId] || []).map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleUserSubmit}
                className="w-full rounded-lg bg-blue-500 px-3 py-2 font-semibold text-blue-950 hover:bg-blue-400"
              >
                {userMode === "login" ? "Enter workspace" : "Create account"}
              </button>

              {userSession && (
                <div className="rounded-xl border border-blue-300/40 bg-blue-500/10 p-3 text-blue-50 space-y-1">
                  <p className="font-semibold">{userSession.name}</p>
                  <p className="text-xs">{userSession.email}</p>
                  <p className="text-[11px]">{userDepartment?.name} • {userProfile?.name}</p>
                  <button onClick={signOutUser} className="text-[11px] underline">
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          <section className="lg:col-span-1 space-y-3 rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Knowledge at a glance</h3>
              <p className="text-xs text-slate-400">Tied to your profile</p>
            </div>
            {userSession ? (
              profileKnowledge.length > 0 ? (
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
              )
            ) : (
              <p className="text-sm text-slate-400">Log in to see the knowledge base curated for your role.</p>
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
                    placeholder={
                      userSession
                        ? "Ask about your onboarding, playbooks, or SOPs..."
                        : "Login as a user to start chatting"
                    }
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
