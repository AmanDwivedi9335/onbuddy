"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { UserAccount } from "@/lib/types";
import { useOnbuddyData } from "@/lib/useOnbuddyData";
import { readUserSession, writeUserSession } from "@/lib/userSession";

export default function UserWorkspacePage() {
  const { departments, profiles, knowledgeBase, loading, error, refreshData } = useOnbuddyData();
  const router = useRouter();

  const [userSession, setUserSession] = useState<UserAccount | null>(() => readUserSession());
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

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center space-y-3">
          <p className="text-sm text-slate-400">Loading your workspace data...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center space-y-4">
          <p className="text-sm text-red-200">{error}</p>
          <button
            className="rounded-lg bg-blue-500 px-4 py-2 font-semibold text-blue-950"
            onClick={refreshData}
          >
            Retry
          </button>
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

          <section className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">Dedicated chat area</h3>
                <p className="text-sm text-slate-300">Open the chat UI to create topics and converse like ChatGPT.</p>
              </div>
              <Link
                href="/user/chats"
                className="inline-flex items-center gap-2 rounded-xl border border-blue-400/60 bg-blue-500 px-4 py-2 text-sm font-semibold text-blue-950 shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
              >
                Launch chat topics
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0-6.75-6.75M19.5 12l-6.75 6.75" />
                </svg>
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-blue-200/80">How it works</p>
                <p className="mt-2 text-slate-200">
                  Create chat topics from the sidebar, keep questions organized, and reuse the knowledge base curated for your profile.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Tip</p>
                <p className="text-sm text-slate-200">
                  Use topics to split onboarding steps, SOP reviews, or device provisioning questions. Each thread stays grounded in your profile&apos;s knowledge.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
