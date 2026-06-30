export interface Room {
  id: string
  code: string
  host_player_id: string
  title: string
  status: 'waiting' | 'active' | 'finished'
  question_count: number
  timer_seconds: number
  difficulty: 'easy' | 'medium' | 'hard'
  current_question: number
  created_at: string
}

export interface Player {
  id: string
  room_id: string
  player_id: string
  display_name: string
  avatar: string
  score: number
  is_host: boolean
  created_at: string
}

export interface Question {
  id: string
  room_id: string
  question_number: number
  question_text: string
  options: string[]
  correct_answer: string
  created_at: string
}

export interface Answer {
  id: string
  room_id: string
  question_id: string
  player_id: string
  answer: string
  is_correct: boolean
  time_taken_ms: number
  created_at: string
}

export interface PlayerIdentity {
  playerId: string
  displayName: string
  avatar: string
}

export interface QuizConfig {
  topic: string
  questionCount: number
  timerSeconds: number
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface GeneratedQuestion {
  question: string
  options: string[]
  correctAnswer: string
}

export interface QuizGenerationResponse {
  questions: GeneratedQuestion[]
}

export type GamePhase = 'lobby' | 'playing' | 'results'
