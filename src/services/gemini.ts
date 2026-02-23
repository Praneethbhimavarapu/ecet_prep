import { Question, Subject } from "../types";
import { api } from "./api";

export async function generateQuestions(
  subject: Subject | 'Full',
  count: number = 30,
  windowIndex: number = 0
): Promise<Question[]> {
  try {
    return await api.ai.generate({ subject, count, windowIndex });
  } catch (error) {
    console.error("Failed to generate questions via backend:", error);
    throw error;
  }
}

export async function generateStaticPool(
  subject: Subject,
  count: number = 200
): Promise<Question[]> {
  try {
    // Reusing the same backend route for static pool generation
    return await api.ai.generate({ subject, count });
  } catch (error) {
    console.error("Failed to generate static pool via backend:", error);
    throw error;
  }
}
