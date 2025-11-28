import { ChatMessage } from "./types";

export type ChatTopic = {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
};

const USER_TOPICS_KEY = "onbuddy_user_topics";

type TopicStore = Record<string, ChatTopic[]>;

function readStore(): TopicStore {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(USER_TOPICS_KEY);
    return raw ? (JSON.parse(raw) as TopicStore) : {};
  } catch (error) {
    console.error("Failed to read stored topics", error);
    return {};
  }
}

export function readUserTopics(userId: string): ChatTopic[] {
  const store = readStore();
  return store[userId] || [];
}

export function writeUserTopics(userId: string, topics: ChatTopic[]) {
  if (typeof window === "undefined") return;

  try {
    const store = readStore();
    store[userId] = topics;
    localStorage.setItem(USER_TOPICS_KEY, JSON.stringify(store));
  } catch (error) {
    console.error("Failed to persist topics", error);
  }
}
