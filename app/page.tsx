"use client";

import { useEffect, useMemo, useState } from "react";

type Department = {
  id: string;
  name: string;
};

type Profile = {
  id: string;
  departmentId: string;
  name: string;
  summary: string;
};

type KnowledgeBaseEntry = {
  id: string;
  profileId: string;
  title: string;
  details: string;
};

type UserAccount = {
  id: string;
  role: "superadmin" | "user";
  name: string;
  email: string;
  password: string;
  departmentId?: string;
  profileId?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

const STORAGE_KEYS = {
  departments: "onbuddy_departments",
  profiles: "onbuddy_profiles",
  knowledgeBase: "onbuddy_knowledge_base",
  users: "onbuddy_users",
  openAiKey: "onbuddy_openai_key",
};

const seedDepartments: Department[] = [
  { id: "dept-ops", name: "Operations" },
  { id: "dept-it", name: "IT" },
];

const seedProfiles: Profile[] = [
  {
    id: "profile-ops-lead",
    departmentId: "dept-ops",
    name: "Operations Lead",
    summary: "Owns onboarding, playbooks, and daily coordination for new hires.",
  },
  {
    id: "profile-it-analyst",
    departmentId: "dept-it",
    name: "IT Analyst",
    summary: "Maintains device inventory, access provisioning, and security reviews.",
  },
];

const seedKnowledge: KnowledgeBaseEntry[] = [
  {
    id: "kb-ops-1",
    profileId: "profile-ops-lead",
    title: "First week onboarding",
    details:
      "Welcome the teammate, share the playbook link, and schedule a day-3 retro to adjust their ramp plan.",
  },
  {
    id: "kb-ops-2",
    profileId: "profile-ops-lead",
    title: "Escalation rules",
    details:
      "For blockers over 24h, page the department head and log the incident in the onboarding tracker.",
  },
  {
    id: "kb-it-1",
    profileId: "profile-it-analyst",
    title: "Laptop provisioning",
    details:
      "Ship MacBook Air 16GB/512GB within 48h. Preload VPN, password manager, Slack, and MDM profiles.",
  },
];

const seedSuperAdmin: UserAccount = {
  id: "super-aman",
  role: "superadmin",
  name: "Aman Raja",
  email: "aman@raja.com",
  password: "123456",
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function readFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch (err) {
    console.error("Failed to read from storage", err);
    return fallback;
  }
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

export default function HomePage() {
  const [departments, setDepartments] = useState<Department[]>(() =>
    readFromStorage(STORAGE_KEYS.departments, seedDepartments),
  );
  const [profiles, setProfiles] = useState<Profile[]>(() =>
    readFromStorage(STORAGE_KEYS.profiles, seedProfiles),
  );
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseEntry[]>(() =>
    readFromStorage(STORAGE_KEYS.knowledgeBase, seedKnowledge),
  );
  const [users, setUsers] = useState<UserAccount[]>(() =>
    readFromStorage(STORAGE_KEYS.users, [seedSuperAdmin as UserAccount]),
  );
  const [openAiKey, setOpenAiKey] = useState<string>(() =>
    typeof window === "undefined"
      ? ""
      : localStorage.getItem(STORAGE_KEYS.openAiKey) ?? "",
  );

  const [superAdminMode, setSuperAdminMode] = useState<"login" | "signup">(
    "login",
  );
  const [userMode, setUserMode] = useState<"login" | "signup">("login");
  const [superAdminSession, setSuperAdminSession] =
    useState<UserAccount | null>(null);
  const [userSession, setUserSession] = useState<UserAccount | null>(null);

  const [departmentForm, setDepartmentForm] = useState({ id: "", name: "" });
  const [profileForm, setProfileForm] = useState({
    id: "",
    departmentId: "",
    name: "",
    summary: "",
  });
  const [knowledgeForm, setKnowledgeForm] = useState({
    id: "",
    profileId: "",
    title: "",
    details: "",
  });

  const [superAdminCredentials, setSuperAdminCredentials] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [userCredentials, setUserCredentials] = useState({
    name: "",
    email: "",
    password: "",
    departmentId: "",
    profileId: "",
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    localStorage.setItem(STORAGE_KEYS.departments, JSON.stringify(departments));
    localStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(profiles));
    localStorage.setItem(
      STORAGE_KEYS.knowledgeBase,
      JSON.stringify(knowledgeBase),
    );
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.openAiKey, openAiKey);
  }, [departments, profiles, knowledgeBase, users, openAiKey]);

  const userProfile = useMemo(
    () => profiles.find((p) => p.id === userSession?.profileId),
    [profiles, userSession?.profileId],
  );

  const userDepartment = useMemo(
    () => departments.find((dept) => dept.id === userSession?.departmentId),
    [departments, userSession?.departmentId],
  );

  const profileKnowledge = useMemo(
    () =>
      knowledgeBase.filter((entry) => entry.profileId === userSession?.profileId),
    [knowledgeBase, userSession?.profileId],
  );

  function handleSuperAdminSubmit() {
    const trimmedEmail = superAdminCredentials.email.trim().toLowerCase();
    const trimmedName = superAdminCredentials.name.trim();

    if (!trimmedEmail || !superAdminCredentials.password.trim()) return;

    if (superAdminMode === "login") {
      const match = users.find(
        (user) =>
          user.role === "superadmin" &&
          user.email.toLowerCase() === trimmedEmail &&
          user.password === superAdminCredentials.password,
      );

      if (match) {
        setSuperAdminSession(match);
        setMessages([]);
        setUserInput("");
      } else {
        alert("Invalid superadmin credentials. Try aman@raja.com / 123456.");
      }
    } else {
      const alreadyExists = users.some(
        (user) => user.email.toLowerCase() === trimmedEmail,
      );

      if (alreadyExists) {
        alert("An account with this email already exists.");
        return;
      }

      const newAdmin: UserAccount = {
        id: uid("super"),
        role: "superadmin",
        name: trimmedName || "New Superadmin",
        email: trimmedEmail,
        password: superAdminCredentials.password,
      };

      setUsers((prev) => [...prev, newAdmin]);
      setSuperAdminSession(newAdmin);
      setMessages([]);
      setUserInput("");
    }
  }

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

      const alreadyExists = users.some(
        (user) => user.email.toLowerCase() === trimmedEmail,
      );

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

  function saveDepartment() {
    const trimmedName = departmentForm.name.trim();
    if (!trimmedName) return;

    if (departmentForm.id) {
      setDepartments((prev) =>
        prev.map((dept) =>
          dept.id === departmentForm.id ? { ...dept, name: trimmedName } : dept,
        ),
      );
    } else {
      setDepartments((prev) => [...prev, { id: uid("dept"), name: trimmedName }]);
    }

    setDepartmentForm({ id: "", name: "" });
  }

  function saveProfile() {
    if (!profileForm.departmentId || !profileForm.name.trim()) return;

    if (profileForm.id) {
      setProfiles((prev) =>
        prev.map((profile) =>
          profile.id === profileForm.id
            ? {
                ...profile,
                departmentId: profileForm.departmentId,
                name: profileForm.name.trim(),
                summary: profileForm.summary.trim(),
              }
            : profile,
        ),
      );
    } else {
      setProfiles((prev) => [
        ...prev,
        {
          id: uid("profile"),
          departmentId: profileForm.departmentId,
          name: profileForm.name.trim(),
          summary: profileForm.summary.trim(),
        },
      ]);
    }

    setProfileForm({ id: "", departmentId: "", name: "", summary: "" });
  }

  function saveKnowledge() {
    if (!knowledgeForm.profileId || !knowledgeForm.title.trim()) return;

    if (knowledgeForm.id) {
      setKnowledgeBase((prev) =>
        prev.map((entry) =>
          entry.id === knowledgeForm.id
            ? {
                ...entry,
                profileId: knowledgeForm.profileId,
                title: knowledgeForm.title.trim(),
                details: knowledgeForm.details.trim(),
              }
            : entry,
        ),
      );
    } else {
      setKnowledgeBase((prev) => [
        ...prev,
        {
          id: uid("kb"),
          profileId: knowledgeForm.profileId,
          title: knowledgeForm.title.trim(),
          details: knowledgeForm.details.trim(),
        },
      ]);
    }

    setKnowledgeForm({ id: "", profileId: "", title: "", details: "" });
  }

  function deleteDepartment(id: string) {
    const remainingProfiles = profiles.filter(
      (profile) => profile.departmentId !== id,
    );

    setDepartments((prev) => prev.filter((dept) => dept.id !== id));
    setProfiles(remainingProfiles);
    setKnowledgeBase((prev) =>
      prev.filter((entry) =>
        remainingProfiles.some((profile) => profile.id === entry.profileId),
      ),
    );
    setUsers((prev) =>
      prev.filter(
        (user) =>
          user.departmentId !== id &&
          (!user.profileId ||
            remainingProfiles.some((profile) => profile.id === user.profileId)),
      ),
    );
  }

  function deleteProfile(id: string) {
    setProfiles((prev) => prev.filter((profile) => profile.id !== id));
    setKnowledgeBase((prev) => prev.filter((entry) => entry.profileId !== id));
    setUsers((prev) => prev.filter((user) => user.profileId !== id));
  }

  function deleteKnowledge(id: string) {
    setKnowledgeBase((prev) => prev.filter((entry) => entry.id !== id));
  }

  function resetForms() {
    setDepartmentForm({ id: "", name: "" });
    setProfileForm({ id: "", departmentId: "", name: "", summary: "" });
    setKnowledgeForm({ id: "", profileId: "", title: "", details: "" });
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

  const profilesByDepartment = useMemo(() => {
    return profiles.reduce<Record<string, Profile[]>>((acc, profile) => {
      acc[profile.departmentId] = acc[profile.departmentId] || [];
      acc[profile.departmentId].push(profile);
      return acc;
    }, {});
  }, [profiles]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <header className="flex flex-col gap-3 rounded-3xl bg-gradient-to-br from-blue-600/20 via-indigo-500/10 to-cyan-500/10 border border-white/10 p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-200/80">
                Onbuddy control room
              </p>
              <h1 className="text-3xl md:text-4xl font-semibold">
                Superadmin + User workspace
              </h1>
              <p className="text-sm text-slate-200/80 max-w-2xl">
                Manage departments, profiles, and AI knowledge so new teammates can ask role-aware questions in a ChatGPT-like canvas.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/70 border border-white/10 px-4 py-3 text-sm text-slate-200/90 shadow">
              <div className="font-semibold">Default superadmin</div>
              <p>aman@raja.com</p>
              <p>Password: 123456</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/30 border border-blue-300/30 flex items-center justify-center font-semibold">
                SA
              </div>
              <p className="text-slate-200/90">
                Superadmins can create departments, map profiles, and maintain the knowledge base feeding each AI chat.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/30 border border-emerald-300/30 flex items-center justify-center font-semibold">
                User
              </div>
              <p className="text-slate-200/90">
                Users sign in with their assigned profile to get concise, role-aware answers powered by the saved knowledge.
              </p>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Superadmin console</h2>
                <p className="text-sm text-slate-300/80">
                  Sign in to curate departments, profiles, and the knowledge base used by every chat.
                </p>
              </div>
              <div className="flex rounded-full bg-slate-900 border border-white/10 text-xs overflow-hidden">
                <button
                  onClick={() => setSuperAdminMode("login")}
                  className={`px-3 py-2 ${
                    superAdminMode === "login"
                      ? "bg-blue-600 text-white"
                      : "text-slate-200"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setSuperAdminMode("signup")}
                  className={`px-3 py-2 ${
                    superAdminMode === "signup"
                      ? "bg-blue-600 text-white"
                      : "text-slate-200"
                  }`}
                >
                  Signup
                </button>
              </div>
            </div>

            {!superAdminSession ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 space-y-3 shadow-lg">
                <div className="grid sm:grid-cols-2 gap-4">
                  {superAdminMode === "signup" && (
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300">Full name</label>
                      <input
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                        placeholder="Aman Raja"
                        value={superAdminCredentials.name}
                        onChange={(e) =>
                          setSuperAdminCredentials((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300">Email</label>
                    <input
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                      placeholder="aman@raja.com"
                      value={superAdminCredentials.email}
                      onChange={(e) =>
                        setSuperAdminCredentials((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300">Password</label>
                    <input
                      type="password"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                      placeholder="••••••"
                      value={superAdminCredentials.password}
                      onChange={(e) =>
                        setSuperAdminCredentials((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <button
                  onClick={handleSuperAdminSubmit}
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold py-2"
                >
                  {superAdminMode === "login" ? "Login as superadmin" : "Create superadmin"}
                </button>
                <p className="text-xs text-slate-400">
                  The starter account is <span className="font-semibold text-slate-200">aman@raja.com</span> with password <span className="font-semibold text-slate-200">123456</span>.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 space-y-2 shadow-lg">
                <p className="text-sm text-emerald-100">Signed in as</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-400/30 text-emerald-950 font-semibold flex items-center justify-center uppercase">
                    {superAdminSession.name.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold">{superAdminSession.name}</p>
                    <p className="text-xs text-emerald-50/80">{superAdminSession.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSuperAdminSession(null)}
                  className="text-xs text-emerald-100 underline"
                >
                  Sign out
                </button>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">AI connector</h3>
                <p className="text-xs text-slate-400">Store your OpenAI API key securely.</p>
              </div>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                placeholder="sk-..."
                value={openAiKey}
                onChange={(e) => setOpenAiKey(e.target.value)}
                aria-label="OpenAI API key"
              />
              <p className="text-xs text-slate-400">
                The UI keeps the key locally for demo purposes. Replace this with your secrets manager when wiring to the OpenAI API.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Departments</h3>
                  {departmentForm.id && (
                    <button
                      onClick={() => setDepartmentForm({ id: "", name: "" })}
                      className="text-xs text-slate-400 underline"
                    >
                      Cancel edit
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    placeholder="Add a department"
                    value={departmentForm.name}
                    onChange={(e) =>
                      setDepartmentForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                  <button
                    onClick={saveDepartment}
                    className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-2 text-sm font-semibold"
                  >
                    {departmentForm.id ? "Update" : "Add"}
                  </button>
                </div>
                <ul className="space-y-2 text-sm">
                  {departments.map((dept) => (
                    <li
                      key={dept.id}
                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2"
                    >
                      <div>
                        <p className="font-semibold">{dept.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {profilesByDepartment[dept.id]?.length || 0} profiles
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          className="text-blue-300"
                          onClick={() => setDepartmentForm({ id: dept.id, name: dept.name })}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-300"
                          onClick={() => deleteDepartment(dept.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Profiles</h3>
                  {profileForm.id && (
                    <button
                      onClick={() =>
                        setProfileForm({ id: "", departmentId: "", name: "", summary: "" })
                      }
                      className="text-xs text-slate-400 underline"
                    >
                      Cancel edit
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <select
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    value={profileForm.departmentId}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, departmentId: e.target.value }))
                    }
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    placeholder="Profile name"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                  <textarea
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    placeholder="One-line summary"
                    rows={2}
                    value={profileForm.summary}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, summary: e.target.value }))
                    }
                  />
                  <button
                    onClick={saveProfile}
                    className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-2 text-sm font-semibold"
                  >
                    {profileForm.id ? "Update profile" : "Add profile"}
                  </button>
                </div>
                <ul className="space-y-2 text-sm">
                  {profiles.map((profile) => (
                    <li
                      key={profile.id}
                      className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{profile.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {departments.find((d) => d.id === profile.departmentId)?.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            className="text-blue-300"
                            onClick={() =>
                              setProfileForm({
                                id: profile.id,
                                departmentId: profile.departmentId,
                                name: profile.name,
                                summary: profile.summary,
                              })
                            }
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-300"
                            onClick={() => deleteProfile(profile.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {profile.summary && (
                        <p className="mt-1 text-xs text-slate-300/80">{profile.summary}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Knowledge base</h3>
                {knowledgeForm.id && (
                  <button
                    onClick={() =>
                      setKnowledgeForm({ id: "", profileId: "", title: "", details: "" })
                    }
                    className="text-xs text-slate-400 underline"
                  >
                    Cancel edit
                  </button>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <select
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  value={knowledgeForm.profileId}
                  onChange={(e) =>
                    setKnowledgeForm((prev) => ({ ...prev, profileId: e.target.value }))
                  }
                >
                  <option value="">Select profile</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  placeholder="Title"
                  value={knowledgeForm.title}
                  onChange={(e) =>
                    setKnowledgeForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
                <textarea
                  className="md:col-span-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  placeholder="Operational guidance, SOP, or FAQs"
                  rows={3}
                  value={knowledgeForm.details}
                  onChange={(e) =>
                    setKnowledgeForm((prev) => ({ ...prev, details: e.target.value }))
                  }
                />
                <div className="md:col-span-2 flex items-center gap-3">
                  <button
                    onClick={saveKnowledge}
                    className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-semibold"
                  >
                    {knowledgeForm.id ? "Update entry" : "Add entry"}
                  </button>
                  <button
                    onClick={resetForms}
                    className="text-xs text-slate-400 underline"
                  >
                    Reset forms
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {knowledgeBase.length === 0 && (
                  <p className="text-sm text-slate-400">
                    Add knowledge for each profile so the chat canvas has context.
                  </p>
                )}
                <div className="grid md:grid-cols-2 gap-3">
                  {knowledgeBase.map((entry) => {
                    const profile = profiles.find((p) => p.id === entry.profileId);
                    const department = departments.find(
                      (d) => d.id === profile?.departmentId,
                    );

                    return (
                      <article
                        key={entry.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs text-slate-400">
                              {department?.name} • {profile?.name}
                            </p>
                            <h4 className="font-semibold">{entry.title}</h4>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              className="text-blue-300"
                              onClick={() =>
                                setKnowledgeForm({
                                  id: entry.id,
                                  profileId: entry.profileId,
                                  title: entry.title,
                                  details: entry.details,
                                })
                              }
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-300"
                              onClick={() => deleteKnowledge(entry.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300/90">{entry.details}</p>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">User workspace</h2>
                <p className="text-sm text-slate-300/80">
                  Team members sign in, then chat with knowledge based on their department and profile.
                </p>
              </div>
              <div className="flex rounded-full bg-slate-900 border border-white/10 text-xs overflow-hidden">
                <button
                  onClick={() => setUserMode("login")}
                  className={`px-3 py-2 ${
                    userMode === "login" ? "bg-emerald-500 text-emerald-950" : "text-slate-200"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setUserMode("signup")}
                  className={`px-3 py-2 ${
                    userMode === "signup" ? "bg-emerald-500 text-emerald-950" : "text-slate-200"
                  }`}
                >
                  Signup
                </button>
              </div>
            </div>

            {!userSession ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 space-y-3 shadow-lg">
                <div className="grid sm:grid-cols-2 gap-4">
                  {userMode === "signup" && (
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300">Full name</label>
                      <input
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                        placeholder="Your name"
                        value={userCredentials.name}
                        onChange={(e) =>
                          setUserCredentials((prev) => ({ ...prev, name: e.target.value }))
                        }
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300">Email</label>
                    <input
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                      placeholder="you@company.com"
                      value={userCredentials.email}
                      onChange={(e) =>
                        setUserCredentials((prev) => ({ ...prev, email: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300">Password</label>
                    <input
                      type="password"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                      placeholder="••••••"
                      value={userCredentials.password}
                      onChange={(e) =>
                        setUserCredentials((prev) => ({ ...prev, password: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {userMode === "signup" && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300">Department</label>
                      <select
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                        value={userCredentials.departmentId}
                        onChange={(e) =>
                          setUserCredentials((prev) => ({
                            ...prev,
                            departmentId: e.target.value,
                            profileId: "",
                          }))
                        }
                      >
                        <option value="">Select department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300">Profile</label>
                      <select
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                        value={userCredentials.profileId}
                        onChange={(e) =>
                          setUserCredentials((prev) => ({
                            ...prev,
                            profileId: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select profile</option>
                        {(profilesByDepartment[userCredentials.departmentId] || []).map(
                          (profile) => (
                            <option key={profile.id} value={profile.id}>
                              {profile.name}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUserSubmit}
                  className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-sm font-semibold py-2 text-emerald-950"
                >
                  {userMode === "login" ? "Login as user" : "Create user account"}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 space-y-2 shadow-lg">
                <p className="text-sm text-emerald-100">Signed in as</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-400/30 text-emerald-950 font-semibold flex items-center justify-center uppercase">
                    {userSession.name.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold">{userSession.name}</p>
                    <p className="text-xs text-emerald-50/80">{userSession.email}</p>
                    <p className="text-[11px] text-emerald-50/80">
                      {userDepartment?.name} • {userProfile?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={signOutUser}
                  className="text-xs text-emerald-100 underline"
                >
                  Sign out
                </button>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Knowledge at a glance</h3>
                <p className="text-xs text-slate-400">Tied to the logged-in profile.</p>
              </div>
              {userSession ? (
                profileKnowledge.length > 0 ? (
                  <div className="space-y-2">
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
                <p className="text-sm text-slate-400">
                  Log in to see the knowledge base curated for your role.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Role-aware Chat</h3>
                <p className="text-xs text-slate-400">ChatGPT-like canvas</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 h-[360px] flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                      <p className="text-sm font-medium">Ask anything about your role</p>
                      <p className="text-xs">
                        Responses reference the knowledge base saved by the superadmin.
                      </p>
                    </div>
                  ) : (
                    messages.map((message, idx) => (
                      <div
                        key={idx}
                        className={`flex ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                            message.role === "user"
                              ? "bg-emerald-500 text-emerald-950 rounded-br-sm"
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
                      className="flex-1 resize-none rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 max-h-32 text-slate-50 placeholder:text-slate-500"
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
                      className="inline-flex items-center justify-center rounded-xl border border-emerald-400 px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-500/80 bg-emerald-500 text-emerald-950 transition"
                    >
                      Send
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    The reply uses your profile-specific knowledge. Replace the handler with your OpenAI API call to make it live.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
