import { GoogleGenAI, Type } from "@google/genai";
import { Question, Subject } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const questionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING, description: "The question text" },
      options: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Exactly 4 options"
      },
      correctAnswer: { type: Type.INTEGER, description: "Index of correct option (0-3)" },
      explanation: { type: Type.STRING, description: "Detailed beginner-friendly explanation" },
      subject: { type: Type.STRING, description: "The subject of the question" },
      difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
      is_important: { type: Type.BOOLEAN, description: "Whether this is a highly probable/important question" }
    },
    required: ["text", "options", "correctAnswer", "explanation", "subject", "difficulty", "is_important"]
  }
};

export async function generateQuestions(
  subject: Subject | 'Full', 
  count: number = 30, 
  windowIndex: number = 0,
  onBatchGenerated?: (questions: Question[]) => void
): Promise<Question[]> {
  const model = "gemini-3-flash-preview";
  const batchSize = 10; // Smaller batch size for progressive loading
  let allQuestions: Question[] = [];

  const getFullMockPrompt = (batchIdx: number, size: number, startIdx: number) => {
    // Distribution logic for Full Mock Test (200 questions total)
    // We adjust distribution based on the global index (startIdx)
    let distribution = "";
    if (startIdx < 50) distribution = "Math, Physics, Chemistry";
    else if (startIdx < 100) distribution = "Digital Electronics, Software Eng, CO, Data Structures";
    else if (startIdx < 150) distribution = "Data Structures, Computer Networks, OS, DBMS";
    else distribution = "Java, Web Tech, Big Data, Android, IoT, Python";

    return `Generate ${size} highly probable and frequently asked multiple-choice questions for the AP ECET 2026 (CSE Branch) exam. 
       Focus on: ${distribution}.
       This is Batch ${batchIdx + 1} for global question range ${startIdx + 1} to ${startIdx + size}.
       Follow the C-23 Diploma curriculum strictly.
       DISTRIBUTION: Mix of Easy, Medium, and Hard.
       IMPORTANT: Focus on "Most Probable" and "Very Important" questions.
       For EACH question, provide a step-by-step explanation.`;
  };

  const batches = Math.ceil(count / batchSize);

  for (let i = 0; i < batches; i++) {
    const currentBatchSize = Math.min(batchSize, count - allQuestions.length);
    if (currentBatchSize <= 0) break;

    const startIdx = (windowIndex * 50) + allQuestions.length;
    const prompt = subject === 'Full' 
      ? getFullMockPrompt(i, currentBatchSize, startIdx)
      : `Generate ${currentBatchSize} highly probable questions for "${subject}" for AP ECET 2026 (CSE Branch).
         Difficulty: Mix of Easy, Medium, Hard.
         This is batch ${i + 1} of ${batches}.
         Follow C-23 Diploma curriculum.
         Provide step-by-step explanations.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: questionSchema
        }
      });

      const text = response.text;
      if (text) {
        const batchQuestions = JSON.parse(text);
        allQuestions = [...allQuestions, ...batchQuestions];
        if (onBatchGenerated) {
          onBatchGenerated(batchQuestions);
        }
      }
    } catch (error) {
      console.error(`Error in batch ${i + 1}:`, error);
      if (allQuestions.length === 0) throw error;
      break; 
    }
  }

  return allQuestions.slice(0, count);
}

export async function generateStaticPool(
  subject: Subject,
  count: number = 200
): Promise<Question[]> {
  const model = "gemini-3-flash-preview";
  const batchSize = 25;
  let allQuestions: Question[] = [];

  const batches = Math.ceil(count / batchSize);

  for (let i = 0; i < batches; i++) {
    const currentBatchSize = Math.min(batchSize, count - allQuestions.length);
    if (currentBatchSize <= 0) break;

    const prompt = `Generate ${currentBatchSize} HIGHLY PROBABLE and VERY IMPORTANT multiple-choice questions for the subject "${subject}" specifically for AP ECET 2026 (CSE Branch) exam.
       These should be the most likely questions to appear in the exam.
       Follow the C-23 Diploma curriculum strictly.
       DISTRIBUTION: Mix of Easy, Medium, and Hard.
       For EACH question, provide a step-by-step explanation suitable for a COMPLETE BEGINNER.
       Mark is_important as true for all of these.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: questionSchema
        }
      });

      const text = response.text;
      if (text) {
        const batchQuestions = JSON.parse(text);
        allQuestions = [...allQuestions, ...batchQuestions];
      }
    } catch (error) {
      console.error(`Error in static batch ${i + 1}:`, error);
      if (allQuestions.length === 0) throw error;
      break;
    }
  }

  return allQuestions;
}

export async function generateQuestionBank(
  subject: Subject,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  count: number = 20
): Promise<Question[]> {
  const model = "gemini-3-flash-preview";
  const batchSize = 20;
  let allQuestions: Question[] = [];

  const prompt = `Generate ${count} highly probable multiple-choice questions for the subject "${subject}" at "${difficulty}" difficulty level, specifically for AP ECET 2026 (CSE Branch) exam.
     These questions should be strictly at the ECET competitive level for the given difficulty.
     Follow the C-23 Diploma curriculum strictly.
     For EACH question, provide a step-by-step explanation suitable for a COMPLETE BEGINNER.
     Mark is_important as true if the question is highly likely to appear in the exam.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema
      }
    });

    const text = response.text;
    if (text) {
      allQuestions = JSON.parse(text);
    }
  } catch (error) {
    console.error(`Error generating question bank:`, error);
    throw error;
  }

  return allQuestions;
}
