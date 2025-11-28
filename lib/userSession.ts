import { UserAccount } from "./types";

export const USER_SESSION_KEY = "onbuddy_user_session";

export function readUserSession(): UserAccount | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(USER_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UserAccount;
  } catch (error) {
    console.error("Failed to parse stored user session", error);
    return null;
  }
}

export function writeUserSession(session: UserAccount | null) {
  if (typeof window === "undefined") return;

  if (session) {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(USER_SESSION_KEY);
  }
}
