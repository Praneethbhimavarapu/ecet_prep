import { generateQuestions } from './src/services/gemini.js';

console.log("=".repeat(60));
console.log("🧪 TESTING GEMINI QUESTION GENERATION");
console.log("=".repeat(60));

async function testQuestionGeneration() {
  try {
    console.log("\n📝 Test 1: Generating 5 Mathematics questions...");
    const mathQuestions = await generateQuestions('Mathematics', 5, 0);
    
    if (mathQuestions && mathQuestions.length > 0) {
      console.log(`✅ Generated ${mathQuestions.length} questions`);
      console.log("\nSample Question:");
      console.log("----------------");
      console.log(`Q: ${mathQuestions[0].text}`);
      console.log(`Options: ${mathQuestions[0].options.join(', ')}`);
      console.log(`Correct Answer: ${mathQuestions[0].correctAnswer}`);
      console.log(`Subject: ${mathQuestions[0].subject}`);
      console.log(`Difficulty: ${mathQuestions[0].difficulty}`);
      console.log(`\nExplanation: ${mathQuestions[0].explanation.substring(0, 100)}...`);
    } else {
      throw new Error("No questions generated");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ ALL TESTS PASSED - GEMINI INTEGRATION WORKING!");
    console.log("=".repeat(60));
    console.log("\n🎉 The application is ready to generate ECET exam questions!");
    
  } catch (error) {
    console.error("\n❌ TEST FAILED");
    console.error("Error:", error.message);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }
}

testQuestionGeneration();
