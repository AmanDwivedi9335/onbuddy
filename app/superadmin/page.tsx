"use client";

import { ReactNode, useMemo, useState } from "react";
import { Profile, UserAccount } from "@/lib/types";
import { useOnbuddyData, uid } from "@/lib/useOnbuddyData";

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export default function SuperadminPage() {
  const {
    departments,
    profiles,
    knowledgeBase,
    users,
    setDepartments,
    setProfiles,
    setKnowledgeBase,
    setUsers,
  } = useOnbuddyData();

  const [superAdminMode, setSuperAdminMode] = useState<"login" | "signup">("login");
  const [superAdminSession, setSuperAdminSession] = useState<UserAccount | null>(null);
  const [superAdminCredentials, setSuperAdminCredentials] = useState({
    name: "",
    email: "",
    password: "",
  });

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

  const profilesByDepartment = useMemo(() => {
    return profiles.reduce<Record<string, Profile[]>>((acc, profile) => {
      acc[profile.departmentId] = acc[profile.departmentId] || [];
      acc[profile.departmentId].push(profile);
      return acc;
    }, {});
  }, [profiles]);

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
    }
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
    const remainingProfiles = profiles.filter((profile) => profile.departmentId !== id);

    setDepartments((prev) => prev.filter((dept) => dept.id !== id));
    setProfiles(remainingProfiles);
    setKnowledgeBase((prev) =>
      prev.filter((entry) => remainingProfiles.some((profile) => profile.id === entry.profileId)),
    );
    setUsers((prev) =>
      prev.filter(
        (user) =>
          user.departmentId !== id &&
          (!user.profileId || remainingProfiles.some((profile) => profile.id === user.profileId)),
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

  if (!superAdminSession) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="max-w-xl mx-auto rounded-3xl border border-white/10 bg-slate-900/70 p-10 shadow-2xl space-y-6">
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Superadmin</p>
              <h1 className="text-3xl font-semibold">Access the control panel</h1>
              <p className="text-slate-300">
                Authenticate to curate departments, profiles, and knowledge that power the user experience.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <button
                onClick={() => setSuperAdminMode("login")}
                className={`rounded-xl px-3 py-2 font-semibold transition ${
                  superAdminMode === "login"
                    ? "bg-emerald-500 text-emerald-950"
                    : "bg-slate-800 text-slate-200"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setSuperAdminMode("signup")}
                className={`rounded-xl px-3 py-2 font-semibold transition ${
                  superAdminMode === "signup"
                    ? "bg-emerald-500 text-emerald-950"
                    : "bg-slate-800 text-slate-200"
                }`}
              >
                Create account
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {superAdminMode === "signup" && (
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                  placeholder="Full name"
                  value={superAdminCredentials.name}
                  onChange={(e) =>
                    setSuperAdminCredentials((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              )}
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                placeholder="Email"
                value={superAdminCredentials.email}
                onChange={(e) =>
                  setSuperAdminCredentials((prev) => ({ ...prev, email: e.target.value }))
                }
              />
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                placeholder="Password"
                type="password"
                value={superAdminCredentials.password}
                onChange={(e) =>
                  setSuperAdminCredentials((prev) => ({ ...prev, password: e.target.value }))
                }
              />
              <button
                onClick={handleSuperAdminSubmit}
                className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-emerald-950 transition hover:bg-emerald-400"
              >
                {superAdminMode === "login" ? "Enter control panel" : "Create superadmin"}
              </button>
            </div>

            <p className="text-xs text-slate-400 text-center">
              Default credentials: aman@raja.com / 123456
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-600/20 via-slate-900 to-slate-950 p-8 shadow-2xl">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Superadmin panel</p>
            <h1 className="text-3xl md:text-4xl font-semibold">Organization blueprint</h1>
            <p className="text-slate-200 max-w-2xl">
              Define departments, assign role profiles, and publish knowledge cards. Every change flows directly to the user workspace.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm">
            <p className="font-semibold">{superAdminSession.name}</p>
            <p className="text-emerald-50/80 text-xs">{superAdminSession.email}</p>
            <button
              onClick={() => setSuperAdminSession(null)}
              className="mt-2 text-xs text-emerald-100 underline"
            >
              Sign out
            </button>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-6">
          <SectionCard title="Departments">
            <div className="space-y-3 text-sm">
              <div className="flex gap-2 flex-col sm:flex-row">
                <input
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                  placeholder="Add a department"
                  value={departmentForm.name}
                  onChange={(e) => setDepartmentForm((prev) => ({ ...prev, name: e.target.value }))}
                />
                <button
                  onClick={saveDepartment}
                  className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-emerald-950 hover:bg-emerald-400"
                >
                  {departmentForm.id ? "Update" : "Add"}
                </button>
              </div>
              {departmentForm.id && (
                <button
                  onClick={() => setDepartmentForm({ id: "", name: "" })}
                  className="text-xs text-slate-400 underline"
                >
                  Cancel edit
                </button>
              )}
              <ul className="space-y-2">
                {departments.map((dept) => (
                  <li
                    key={dept.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2"
                  >
                    <div>
                      <p className="font-semibold">{dept.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {profilesByDepartment[dept.id]?.length || 0} profiles
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <button
                        className="text-emerald-300"
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
          </SectionCard>

          <SectionCard title="Profiles">
            <div className="space-y-3 text-sm">
              <select
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
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
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                placeholder="Profile name"
                value={profileForm.name}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <textarea
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                placeholder="One-line summary"
                rows={2}
                value={profileForm.summary}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, summary: e.target.value }))}
              />
              <button
                onClick={saveProfile}
                className="w-full rounded-lg bg-emerald-500 px-3 py-2 font-semibold text-emerald-950 hover:bg-emerald-400"
              >
                {profileForm.id ? "Update profile" : "Add profile"}
              </button>
              {profileForm.id && (
                <button
                  onClick={() => setProfileForm({ id: "", departmentId: "", name: "", summary: "" })}
                  className="text-xs text-slate-400 underline"
                >
                  Cancel edit
                </button>
              )}
              <ul className="space-y-2">
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
                      <div className="flex items-center gap-3 text-xs">
                        <button
                          className="text-emerald-300"
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
                        <button className="text-red-300" onClick={() => deleteProfile(profile.id)}>
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
          </SectionCard>
        </div>

        <SectionCard title="Knowledge base">
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={knowledgeForm.profileId}
              onChange={(e) => setKnowledgeForm((prev) => ({ ...prev, profileId: e.target.value }))}
            >
              <option value="">Select profile</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              placeholder="Title"
              value={knowledgeForm.title}
              onChange={(e) => setKnowledgeForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <textarea
              className="md:col-span-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              placeholder="Operational guidance, SOP, or FAQs"
              rows={3}
              value={knowledgeForm.details}
              onChange={(e) => setKnowledgeForm((prev) => ({ ...prev, details: e.target.value }))}
            />
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button
                onClick={saveKnowledge}
                className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-emerald-950 hover:bg-emerald-400"
              >
                {knowledgeForm.id ? "Update entry" : "Add entry"}
              </button>
              {knowledgeForm.id && (
                <button
                  onClick={() => setKnowledgeForm({ id: "", profileId: "", title: "", details: "" })}
                  className="text-xs text-slate-400 underline"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-3">
            {knowledgeBase.map((entry) => {
              const profile = profiles.find((p) => p.id === entry.profileId);
              const department = departments.find((d) => d.id === profile?.departmentId);

              return (
                <article
                  key={entry.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-400">{department?.name} • {profile?.name}</p>
                      <h4 className="font-semibold">{entry.title}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <button
                        className="text-emerald-300"
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
                      <button className="text-red-300" onClick={() => deleteKnowledge(entry.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300/80 leading-relaxed">{entry.details}</p>
                </article>
              );
            })}
            {knowledgeBase.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-400">
                Add guidance for each profile so users have instant answers in the chat workspace.
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </main>
  );
}
