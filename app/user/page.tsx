"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Profile, UserAccount } from "@/lib/types";
import { useOnbuddyData } from "@/lib/useOnbuddyData";
import { readUserSession, writeUserSession } from "@/lib/userSession";

export default function UserAuthPage() {
  const {
    departments,
    profiles,
    users,
    loading,
    error,
    refreshData,
    createUser,
  } = useOnbuddyData();
  const router = useRouter();

  const [userMode, setUserMode] = useState<"login" | "signup">("login");
  const [userCredentials, setUserCredentials] = useState({
    name: "",
    email: "",
    password: "",
    departmentId: "",
    profileId: "",
  });

  useEffect(() => {
    const existingSession = readUserSession();
    if (existingSession) {
      router.replace("/user/workspace");
    }
  }, [router]);

  const profilesByDepartment = useMemo(() => {
    return profiles.reduce<Record<string, Profile[]>>((acc, profile) => {
      acc[profile.departmentId] = acc[profile.departmentId] || [];
      acc[profile.departmentId].push(profile);
      return acc;
    }, {});
  }, [profiles]);

  async function handleUserSubmit() {
    const trimmedEmail = userCredentials.email.trim().toLowerCase();
    const trimmedName = userCredentials.name.trim();

    if (!trimmedEmail || !userCredentials.password.trim()) return;

    if (userMode === "login") {
      try {
        const response = await fetch("/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail, password: userCredentials.password }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          alert(payload?.error ?? "Unable to log in. Please try again.");
          return;
        }

        const match = (await response.json()) as UserAccount;

        if (match.role !== "user") {
          alert("This account is not set up for the user workspace.");
          return;
        }

        writeUserSession(match);
        router.push("/user/workspace");
      } catch (err) {
        console.error("User login failed", err);
        alert("Unable to log in. Please try again.");
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

      try {
        const newUser: UserAccount = await createUser({
          role: "user",
          name: trimmedName || "New Teammate",
          email: trimmedEmail,
          password: userCredentials.password,
          departmentId: userCredentials.departmentId,
          profileId: userCredentials.profileId,
        });

        writeUserSession(newUser);
        router.push("/user/workspace");
      } catch (err) {
        console.error("User signup failed", err);
        alert("Unable to create user. Please try again.");
      }
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center space-y-3">
          <p className="text-sm text-slate-400">Loading workspace data...</p>
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
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        <header className="space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-200/80">User access</p>
          <h1 className="text-4xl md:text-5xl font-semibold">Enter your Onbuddy workspace</h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-lg">
            Log in or create an account tied to a department profile. After authenticating, we will launch a dedicated workspace
            route tailored to your role.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-950 p-8 shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 min-w-[280px] space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setUserMode("login")}
                    className={`rounded-lg px-3 py-2 font-semibold transition ${
                      userMode === "login" ? "bg-blue-500 text-blue-950" : "bg-slate-800 text-slate-200"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setUserMode("signup")}
                    className={`rounded-lg px-3 py-2 font-semibold transition ${
                      userMode === "signup" ? "bg-blue-500 text-blue-950" : "bg-slate-800 text-slate-200"
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
                      onChange={(e) => setUserCredentials((prev) => ({ ...prev, profileId: e.target.value }))}
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
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 space-y-3 text-slate-200">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-200/80">What happens next</p>
              <h2 className="text-2xl font-semibold">We open your workspace in a dedicated route</h2>
              <p className="text-sm leading-relaxed text-slate-300">
                After you log in or sign up, Onbuddy stores your session locally and launches <code>/user/workspace</code>.
                There you can browse the knowledge base curated for your profile and chat with the role-aware assistant.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                <li>Accounts are tied to a department profile selected during signup.</li>
                <li>Returning users are redirected to their workspace automatically.</li>
                <li>You can sign out from the workspace view to return here.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
