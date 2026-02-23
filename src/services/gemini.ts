// Gemini question generation is now handled by the backend
// All AI calls go through the backend API for security

import { Question, Subject } from "../types";

const API_BASE = "/api";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export async function generateQuestions(
  subject: Subject | 'Full', 
  count: number = 30, 
  windowIndex: number = 0
): Promise<Question[]> {
  try {
    const response = await fetch(`${API_BASE}/generate-questions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ subject, count, windowIndex })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate questions: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Question generation error:', error);
    throw error;
  }
}

export async function generateStaticPool(
  subject: Subject,
  count: number = 200
): Promise<Question[]> {
  // For static pool, we can use the same endpoint with different parameters
  try {
    const response = await fetch(`${API_BASE}/generate-questions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ subject, count, windowIndex: 0 })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate static pool: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Static pool generation error:', error);
    throw error;
  }
}
