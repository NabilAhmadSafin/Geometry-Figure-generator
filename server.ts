import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { getDb } from "./src/server/db.js";
import {
  hashPassword,
  comparePassword,
  generateToken,
  authenticateToken,
  AuthRequest,
} from "./src/server/auth.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes
app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    const db = await getDb();
    const password_hash = await hashPassword(password);
    await db.run(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      username,
      password_hash
    );
    res.status(201).json({ message: "User registered successfully" });
  } catch (err: any) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "Username already exists" });
    }
    res.status(500).json({ error: "Failed to register user" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const db = await getDb();
    const user = await db.get("SELECT * FROM users WHERE username = ?", username);
    if (!user || !(await comparePassword(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = generateToken({ id: user.id, username: user.username });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { "User-Agent": "aistudio-build" } },
});

app.post("/api/generate-figure", authenticateToken, async (req: AuthRequest, res) => {
  const { problem } = req.body;
  if (!problem) return res.status(400).json({ error: "Problem text is required" });

  try {
    const systemInstruction = `
      You are a geometry expert. Convert the following geometry Olympiad problem into a sequence of GeoGebra CAS/Algebra commands.
      Return ONLY a JSON object with:
      - "commands": string array of GeoGebra commands.
      - "description": a short description of the construction.

      CRITICAL RULES:
      1. Name your objects clearly. Example: A = (0, 0), B = (5, 0), C = (2, 4).
      2. Use simple commands:
         - Points: P = (x, y)
         - Lines: L = Line(A, B)
         - Circles: C1 = Circle(A, B) or C1 = Circle(A, 5)
         - Intersection: P1 = Intersect(Object1, Object2)
         - Midpoint: M = Midpoint(A, B)
         - Perpendicular: Perp = PerpendicularLine(A, L)
         - Polygon: Poly = Polygon(A, B, C)
         - Incenter: I = Incenter(A, B, C)
         - Incircle: Inc = Incircle(A, B, C)
         - Centroid: G = Centroid(A, B, C)
      3. Place points strategically so the figure is readable (e.g., side lengths between 3 and 10).
      4. Always define points before using them in other constructions.
      5. Do not include comments inside the commands array.
    `;

    console.log("Generating figure for problem:", problem);

    const resultText = await generateWithFallback(problem, systemInstruction);

    const result = JSON.parse(resultText);
    console.log("Parsed Result:", result);

    // Save to history
    const db = await getDb();
    await db.run(
      "INSERT INTO history (user_id, problem_text, generated_commands, description) VALUES (?, ?, ?, ?)",
      req.user?.id,
      problem,
      JSON.stringify(result.commands),
      result.description
    );

    res.json(result);
  } catch (err: any) {
    console.error("Gemini Error:", err);
    let message = "Figure generation failed. Please try another problem.";
    
    if (err.message?.includes("503")) {
      message = "AI models are currently under heavy load. Please wait a moment and try again.";
    } else if (err.message?.includes("429")) {
      message = "API quota exceeded. Please wait a minute before requesting another figure.";
    }
    
    res.status(500).json({ error: message });
  }
});

async function generateWithFallback(problem: string, systemInstruction: string): Promise<string> {
  // Use a variety of supported models to increase chance of success
  const models = [
    "gemini-3-flash-preview",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.1-pro-preview"
  ];
  let lastError: any = null;

  for (const modelName of models) {
    try {
      console.log(`Attempting generation with model: ${modelName}`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ parts: [{ text: problem }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              commands: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              description: { type: Type.STRING },
            },
            required: ["commands", "description"],
          },
        },
      });

      if (!response.text) throw new Error("Empty response");
      return response.text;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${modelName} failed:`, err.message);
      
      // If it's a 503 (Unavailable), 429 (Quota), or 404 (Not Found), try the next model
      if (err.message?.includes("503") || err.message?.includes("429") || err.message?.includes("404")) {
        continue;
      }
      
      // For other serious errors, throw immediately
      throw err;
    }
  }

  throw lastError || new Error("All available models failed");
}

app.get("/api/history", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(
      "SELECT * FROM history WHERE user_id = ? ORDER BY timestamp DESC",
      req.user?.id
    );
    const history = rows.map((row) => ({
      ...row,
      generated_commands: JSON.parse(row.generated_commands),
    }));
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
