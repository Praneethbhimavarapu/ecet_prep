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
  windowIndex: number = 0
): Promise<Question[]> {
  const model = "gemini-3-flash-preview";
  const batchSize = 25; 
  let allQuestions: Question[] = [];

  // Distribution logic for Full Mock Test (200 questions total, 50 per window)
  // We ensure subject-wise sequencing by specifying the order in the prompt for each window.
  const getFullMockPrompt = (batchIdx: number, size: number) => {
    let distribution = "";
    let sequenceOrder = "";
    if (windowIndex === 0) {
      distribution = "Math: 12, Physics: 6, Chemistry: 6, CSE (Digital Electronics: 6, Software Eng: 6, CO: 8, Data Structures: 4)";
      sequenceOrder = "1. Math, 2. Physics, 3. Chemistry, 4. Digital Electronics, 5. Software Eng, 6. Computer Organization, 7. Data Structures";
    } else if (windowIndex === 1) {
      distribution = "Math: 13, Physics: 6, Chemistry: 6, CSE (Data Structures: 6, Computer Networks: 6, OS: 7)";
      sequenceOrder = "1. Math, 2. Physics, 3. Chemistry, 4. Data Structures, 5. Computer Networks, 6. Operating Systems";
    } else if (windowIndex === 2) {
      distribution = "Math: 12, Physics: 6, Chemistry: 6, CSE (OS: 3, DBMS: 8, Java: 7)";
      sequenceOrder = "1. Math, 2. Physics, 3. Chemistry, 4. Operating Systems, 5. DBMS, 6. Java/Programming";
    } else if (windowIndex === 3) {
      distribution = "Math: 13, Physics: 7, Chemistry: 7, CSE (Java: 3, Web Tech: 8, Big Data: 6, Android: 6, IoT: 8, Python: 8)";
      sequenceOrder = "1. Math, 2. Physics, 3. Chemistry, 4. Java, 5. Web Tech, 6. Big Data, 7. Android, 8. IoT, 9. Python";
    }

    return `Generate ${size} highly probable and frequently asked multiple-choice questions for the AP ECET 2026 (CSE Branch) exam. 
       These questions should be strictly at the ECET competitive level.
       This is Window ${windowIndex + 1} (Questions ${windowIndex * 50 + 1} to ${(windowIndex + 1) * 50}).
       Batch ${batchIdx + 1}.
       
       SYLLABUS DISTRIBUTION FOR THIS WINDOW: ${distribution}.
       CRITICAL: You MUST generate the questions in the following SUBJECT SEQUENCE: ${sequenceOrder}.
       
       Follow the C-23 Diploma curriculum strictly.
       DISTRIBUTION: The questions MUST be evenly divided among difficulty levels: Easy, Medium, and Hard (ECET-level).
       IMPORTANT: Focus on "Most Probable" and "Very Important" questions that are likely to appear in the 2026 exam.
       For EACH question, provide a step-by-step explanation suitable for a COMPLETE BEGINNER. 
       Explain the concept simply, why the correct answer is right, and why the other options are incorrect.`;
  };

  const batches = Math.ceil(count / batchSize);

  for (let i = 0; i < batches; i++) {
    const currentBatchSize = Math.min(batchSize, count - allQuestions.length);
    if (currentBatchSize <= 0) break;

    const prompt = subject === 'Full' 
      ? getFullMockPrompt(i, currentBatchSize)
      : `Generate ${currentBatchSize} highly probable and frequently asked multiple-choice questions for the subject "${subject}" specifically for AP ECET 2026 (CSE Branch) preparation.
         These questions should be strictly at the ECET competitive level, focusing on core concepts and common problem patterns found in previous years' papers.
         This is batch ${i + 1} of ${batches}.
         Follow the C-23 Diploma curriculum strictly.
         DISTRIBUTION: The questions MUST be evenly divided among difficulty levels: Easy, Medium, and Hard (ECET-level).
         IMPORTANT: Focus on "Most Probable" and "Very Important" questions that are likely to appear in the 2026 exam.
         For EACH question, provide a step-by-step explanation suitable for a COMPLETE BEGINNER. 
         Explain the concept simply, why the correct answer is right, and why the other options are incorrect.`;

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
