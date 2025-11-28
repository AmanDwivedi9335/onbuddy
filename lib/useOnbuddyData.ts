"use client";

import { useEffect, useState } from "react";
import {
  Department,
  KnowledgeBaseEntry,
  Profile,
  UserAccount,
} from "./types";

const STORAGE_KEYS = {
  departments: "onbuddy_departments",
  profiles: "onbuddy_profiles",
  knowledgeBase: "onbuddy_knowledge_base",
  users: "onbuddy_users",
  openAiKey: "onbuddy_openai_key",
};

export const seedDepartments: Department[] = [
  { id: "dept-ops", name: "Operations" },
  { id: "dept-it", name: "IT" },
];

export const seedProfiles: Profile[] = [
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

export const seedKnowledge: KnowledgeBaseEntry[] = [
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

export const seedSuperAdmin: UserAccount = {
  id: "super-aman",
  role: "superadmin",
  name: "Aman Raja",
  email: "aman@raja.com",
  password: "123456",
};

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
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

export function useOnbuddyData() {
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

  return {
    departments,
    profiles,
    knowledgeBase,
    users,
    openAiKey,
    setDepartments,
    setProfiles,
    setKnowledgeBase,
    setUsers,
    setOpenAiKey,
  };
}
