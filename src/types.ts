export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Question {
  id?: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  is_important?: boolean;
}

export interface TestAttempt {
  id: number;
  test_type: 'Full' | 'Subject';
  subject?: string;
  score: number;
  total: number;
  duration: number;
  date: string;
}

export interface Bookmark {
  id: number;
  question_data: string;
}

export interface LeaderboardEntry {
  id: number;
  name: string;
  tests_taken: number;
  total_score: number;
  possible_score: number;
  avg_accuracy: number;
}

export type Subject = 
  | 'Mathematics' 
  | 'Physics' 
  | 'Chemistry' 
  | 'Programming in C' 
  | 'Data Structures' 
  | 'Digital Electronics' 
  | 'Computer Organization' 
  | 'Operating Systems' 
  | 'Database Management Systems' 
  | 'Computer Networks';
