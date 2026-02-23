import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

console.log("Testing Gemini API integration...");
console.log("API Key present:", apiKey ? "Yes" : "No");

if (!apiKey) {
  console.error("ERROR: GEMINI_API_KEY not found in environment");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function testGemini() {
  try {
    console.log("\n🚀 Generating a simple test question...");
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate 1 simple multiple-choice question about Mathematics with 4 options.",
      config: {
        responseMimeType: "text/plain"
      }
    });

    const text = response.text;
    console.log("\n✅ SUCCESS! Gemini API is working!\n");
    console.log("Generated content:");
    console.log(text);
    console.log("\n✨ The Gemini integration is correctly configured and functional!");
    
  } catch (error) {
    console.error("\n❌ ERROR: Gemini API call failed");
    console.error("Error details:", error.message);
    if (error.status) {
      console.error("Status code:", error.status);
    }
    process.exit(1);
  }
}

testGemini();
