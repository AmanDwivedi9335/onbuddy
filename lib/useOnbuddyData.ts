"use client";

import { useEffect, useState } from "react";

import {
  Department,
  KnowledgeBaseEntry,
  Profile,
  UserAccount,
} from "./types";
import { uid } from "./id";

const STORAGE_KEYS = {
  openAiKey: "onbuddy_openai_key",
};

type BootstrapPayload = {
  departments: Department[];
  profiles: Profile[];
  knowledgeBase: KnowledgeBaseEntry[];
  users: UserAccount[];
};

export function useOnbuddyData() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseEntry[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [openAiKey, setOpenAiKey] = useState<string>(() =>
    typeof window === "undefined"
      ? ""
      : localStorage.getItem(STORAGE_KEYS.openAiKey) ?? "",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        const response = await fetch("/api/bootstrap");
        if (!response.ok) {
          throw new Error("Failed to load data from MongoDB");
        }
        const payload: BootstrapPayload = await response.json();
        setDepartments(payload.departments);
        setProfiles(payload.profiles);
        setKnowledgeBase(payload.knowledgeBase);
        setUsers(payload.users);
      } catch (err) {
        console.error("Bootstrap error", err);
        setError(
          err instanceof Error ? err.message : "Unable to load initial data",
        );
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.openAiKey, openAiKey);
  }, [openAiKey]);

  async function refreshData() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/bootstrap");
      if (!response.ok) {
        throw new Error("Failed to refresh data from MongoDB");
      }
      const payload: BootstrapPayload = await response.json();
      setDepartments(payload.departments);
      setProfiles(payload.profiles);
      setKnowledgeBase(payload.knowledgeBase);
      setUsers(payload.users);
    } catch (err) {
      console.error("Refresh error", err);
      setError(err instanceof Error ? err.message : "Unable to refresh data");
    } finally {
      setLoading(false);
    }
  }

  async function createDepartment(name: string) {
    const response = await fetch("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) throw new Error("Failed to create department");

    const department = (await response.json()) as Department;
    setDepartments((prev) => [...prev, department]);
    return department;
  }

  async function updateDepartment(id: string, name: string) {
    const response = await fetch(`/api/departments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) throw new Error("Failed to update department");

    setDepartments((prev) =>
      prev.map((dept) => (dept.id === id ? { ...dept, name } : dept)),
    );
  }

  async function deleteDepartment(id: string) {
    const response = await fetch(`/api/departments/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete department");

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

  async function createProfile(input: Omit<Profile, "id">) {
    const response = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) throw new Error("Failed to create profile");

    const profile = (await response.json()) as Profile;
    setProfiles((prev) => [...prev, profile]);
    return profile;
  }

  async function updateProfile(id: string, input: Omit<Profile, "id">) {
    const response = await fetch(`/api/profiles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) throw new Error("Failed to update profile");

    setProfiles((prev) =>
      prev.map((profile) =>
        profile.id === id ? { ...profile, ...input } : profile,
      ),
    );
  }

  async function deleteProfile(id: string) {
    const response = await fetch(`/api/profiles/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete profile");

    setProfiles((prev) => prev.filter((profile) => profile.id !== id));
    setKnowledgeBase((prev) => prev.filter((entry) => entry.profileId !== id));
    setUsers((prev) => prev.filter((user) => user.profileId !== id));
  }

  async function createKnowledgeEntry(input: Omit<KnowledgeBaseEntry, "id">) {
    const response = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) throw new Error("Failed to create knowledge entry");

    const entry = (await response.json()) as KnowledgeBaseEntry;
    setKnowledgeBase((prev) => [...prev, entry]);
    return entry;
  }

  async function updateKnowledgeEntry(
    id: string,
    input: Omit<KnowledgeBaseEntry, "id">,
  ) {
    const response = await fetch(`/api/knowledge/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) throw new Error("Failed to update knowledge entry");

    setKnowledgeBase((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...input } : entry)),
    );
  }

  async function deleteKnowledgeEntry(id: string) {
    const response = await fetch(`/api/knowledge/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete knowledge entry");

    setKnowledgeBase((prev) => prev.filter((entry) => entry.id !== id));
  }

  async function createUser(input: Omit<UserAccount, "id">) {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, id: uid("user") }),
    });

    if (!response.ok) throw new Error("Failed to create user");

    const user = (await response.json()) as UserAccount;
    setUsers((prev) => [...prev, user]);
    return user;
  }

  return {
    departments,
    profiles,
    knowledgeBase,
    users,
    openAiKey,
    loading,
    error,
    setOpenAiKey,
    refreshData,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createProfile,
    updateProfile,
    deleteProfile,
    createKnowledgeEntry,
    updateKnowledgeEntry,
    deleteKnowledgeEntry,
    createUser,
  };
}
