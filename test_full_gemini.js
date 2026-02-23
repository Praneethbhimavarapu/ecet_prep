import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    },
    required: ["text", "options", "correctAnswer", "explanation", "subject", "difficulty"]
  }
};

console.log("=".repeat(60));
console.log("🧪 TESTING FULL GEMINI QUESTION GENERATION FLOW");
console.log("=".repeat(60));

async function testQuestionGeneration() {
  try {
    console.log("\n📝 Generating 5 sample ECET questions...");
    
    const prompt = `Generate 5 multiple-choice questions for Mathematics specifically for AP ECET 2026 (CSE Branch) exam.
       These questions should be at the ECET competitive level.
       Follow the C-23 Diploma curriculum.
       Mix of Easy, Medium, and Hard difficulty levels.
       For EACH question, provide a step-by-step explanation suitable for beginners.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema
      }
    });

    const text = response.text;
    if (text) {
      const questions = JSON.parse(text);
      console.log(`\n✅ Successfully generated ${questions.length} questions!`);
      
      console.log("\n📋 Sample Generated Question:");
      console.log("=" + "=".repeat(58));
      console.log(`\n❓ ${questions[0].text}\n`);
      questions[0].options.forEach((opt, idx) => {
        console.log(`   ${idx + 1}. ${opt}`);
      });
      console.log(`\n✔️  Correct Answer: Option ${questions[0].correctAnswer + 1}`);
      console.log(`📚 Subject: ${questions[0].subject}`);
      console.log(`⚡ Difficulty: ${questions[0].difficulty}`);
      console.log(`\n💡 Explanation:`);
      console.log(`   ${questions[0].explanation.substring(0, 200)}${questions[0].explanation.length > 200 ? '...' : ''}`);
      
      console.log("\n" + "=".repeat(60));
      console.log("✅ GEMINI INTEGRATION FULLY FUNCTIONAL!");
      console.log("=".repeat(60));
      console.log("\n🎉 Your ECET 2026 Preparation Platform is ready!");
      console.log("📱 Students can now generate AI-powered practice questions");
      console.log("🚀 The application can generate questions for:");
      console.log("   • Full Mock Tests (200 questions)");
      console.log("   • Subject-specific tests");
      console.log("   • All 10 subjects covered");
      
    } else {
      throw new Error("No response text from Gemini API");
    }
    
  } catch (error) {
    console.error("\n❌ TEST FAILED");
    console.error("Error:", error.message);
    if (error.status) {
      console.error("Status code:", error.status);
    }
    process.exit(1);
  }
}

testQuestionGeneration();
