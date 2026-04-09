import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface WorkLog {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: "code" | "note" | "paper" | "other";
  timestamp: number;
  dateStr: string;
  metadata?: {
    repo?: string;
    folder?: string;
    tags?: string[];
    description?: string;
  };
}

export interface ProductivityAnalysis {
  summary: string;
  topCategories: string[];
  productivityScore: number;
  suggestions: string[];
  streakInfo: {
    currentStreak: number;
    lastLoggedDate: string | null;
  };
}

export async function analyzeProductivity(logs: WorkLog[]): Promise<ProductivityAnalysis> {
  if (logs.length === 0) {
    return {
      summary: "No logs found yet. Start logging your work to see analysis!",
      topCategories: [],
      productivityScore: 0,
      suggestions: ["Start by logging your first task today."],
      streakInfo: { currentStreak: 0, lastLoggedDate: null }
    };
  }

  const prompt = `
    Analyze the following work logs from a user and provide a productivity analysis.
    Logs:
    ${logs.map(log => `- [${log.category}] ${log.title}: ${log.content}`).join("\n")}

    Return the analysis in JSON format with the following structure:
    {
      "summary": "A brief summary of the user's focus and achievements",
      "topCategories": ["category1", "category2"],
      "productivityScore": number (0-100),
      "suggestions": ["suggestion1", "suggestion2"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    // Calculate streak logic (this could be done client-side too, but we'll include it in the return type)
    // For now, we'll just return the AI analysis and handle streaks separately in the UI/service.
    return {
      ...result,
      streakInfo: calculateStreak(logs)
    };
  } catch (error) {
    console.error("Error analyzing productivity:", error);
    return {
      summary: "Failed to analyze productivity. Please try again later.",
      topCategories: [],
      productivityScore: 0,
      suggestions: [],
      streakInfo: calculateStreak(logs)
    };
  }
}

function calculateStreak(logs: WorkLog[]) {
  if (logs.length === 0) return { currentStreak: 0, lastLoggedDate: null };

  const sortedDates = Array.from(new Set(logs.map(l => l.dateStr))).sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let currentStreak = 0;
  let lastLoggedDate = sortedDates[0];

  // If the most recent log is not today or yesterday, streak is broken
  if (lastLoggedDate !== today && lastLoggedDate !== yesterday) {
    return { currentStreak: 0, lastLoggedDate };
  }

  let checkDate = new Date(lastLoggedDate);
  for (const dateStr of sortedDates) {
    const d = new Date(dateStr);
    if (d.getTime() === checkDate.getTime()) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { currentStreak, lastLoggedDate };
}
