export type Department = {
  id: string;
  name: string;
};

export type Profile = {
  id: string;
  departmentId: string;
  name: string;
  summary: string;
};

export type KnowledgeBaseEntry = {
  id: string;
  profileId: string;
  title: string;
  details: string;
};

export type UserAccount = {
  id: string;
  role: "superadmin" | "user";
  name: string;
  email: string;
  password: string;
  departmentId?: string;
  profileId?: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type ChatTopic = {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
};
