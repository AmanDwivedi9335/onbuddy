export type Department = {
  _id?: string;
  id: string;
  name: string;
};

export type Profile = {
  _id?: string;
  id: string;
  departmentId: string;
  name: string;
  summary: string;
};

export type KnowledgeBaseEntry = {
  _id?: string;
  id: string;
  profileId: string;
  title: string;
  details: string;
};

export type UserAccount = {
  _id?: string;
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
  _id?: string;
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
};
