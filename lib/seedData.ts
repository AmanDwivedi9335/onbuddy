import { Department, KnowledgeBaseEntry, Profile, UserAccount } from "./types";

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
