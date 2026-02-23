import { User, TestAttempt, Bookmark, Question, LeaderboardEntry } from "../types";

const API_BASE = "/api";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  auth: {
    register: async (data: any) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    login: async (data: any) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  },
  tests: {
    save: async (data: Omit<TestAttempt, 'id' | 'date'>) => {
      const res = await fetch(`${API_BASE}/tests/save`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return res.json();
    },
    getHistory: async (): Promise<TestAttempt[]> => {
      const res = await fetch(`${API_BASE}/tests/history`, { headers: getHeaders() });
      return res.json();
    },
    getLeaderboard: async (): Promise<LeaderboardEntry[]> => {
      const res = await fetch(`${API_BASE}/leaderboard`, { headers: getHeaders() });
      return res.json();
    },
  },
  bookmarks: {
    add: async (question: Question) => {
      const res = await fetch(`${API_BASE}/bookmarks`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ question_data: question }),
      });
      return res.json();
    },
    getAll: async (): Promise<Bookmark[]> => {
      const res = await fetch(`${API_BASE}/bookmarks`, { headers: getHeaders() });
      return res.json();
    },
    remove: async (id: number) => {
      const res = await fetch(`${API_BASE}/bookmarks/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return res.json();
    },
  },
  questions: {
    getImportant: async (): Promise<Question[]> => {
      const res = await fetch(`${API_BASE}/questions/important`);
      return res.json();
    },
    getStaticBySubject: async (subject: string): Promise<Question[]> => {
      const res = await fetch(`${API_BASE}/questions/static/${encodeURIComponent(subject)}`);
      return res.json();
    },
    seedStatic: async (questions: Question[]) => {
      const res = await fetch(`${API_BASE}/admin/seed-static`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ questions }),
      });
      return res.json();
    },
    getStaticCounts: async (): Promise<{ subject: string; count: number }[]> => {
      const res = await fetch(`${API_BASE}/admin/static-count`);
      return res.json();
    },
  },
};
