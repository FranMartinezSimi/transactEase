import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY || "",
});

const model = genAI.models.generateContent({
  model: "gemini-2.5-flash",
  contents: {
    fileData: {},
  },
});

const response = await model.then((res) => res.text);

console.log(response);
