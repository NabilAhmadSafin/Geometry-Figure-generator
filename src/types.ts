export interface User {
  id: number;
  username: string;
}

export interface HistoryItem {
  id: number;
  problem_text: string;
  generated_commands: string[];
  description: string;
  timestamp: string;
}

export interface GeminiResponse {
  commands: string[];
  description: string;
}
