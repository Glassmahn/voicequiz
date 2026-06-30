'use client'

import { create } from 'zustand'
import type { Room, Player, Question, GamePhase } from '@/types'

interface GameStore {
  room: Room | null
  players: Player[]
  questions: Question[]
  currentQuestionIndex: number
  phase: GamePhase
  hostPlayerId: string | null

  setRoom: (room: Room) => void
  setPlayers: (players: Player[]) => void
  addPlayer: (player: Player) => void
  removePlayer: (playerId: string) => void
  setQuestions: (questions: Question[]) => void
  setCurrentQuestionIndex: (index: number) => void
  setPhase: (phase: GamePhase) => void
  setHostPlayerId: (id: string) => void
  updatePlayerScore: (playerId: string, score: number) => void
  reset: () => void
}

export const useGameStore = create<GameStore>()((set) => ({
  room: null,
  players: [],
  questions: [],
  currentQuestionIndex: 0,
  phase: 'lobby',
  hostPlayerId: null,

  setRoom: (room) => set({ room }),
  setPlayers: (players) => set({ players }),
  addPlayer: (player) => set((state) => ({ players: [...state.players, player] })),
  removePlayer: (playerId) =>
    set((state) => ({ players: state.players.filter((p) => p.player_id !== playerId) })),
  setQuestions: (questions) => set({ questions }),
  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
  setPhase: (phase) => set({ phase }),
  setHostPlayerId: (id) => set({ hostPlayerId: id }),
  updatePlayerScore: (playerId, score) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.player_id === playerId ? { ...p, score } : p
      ),
    })),
  reset: () =>
    set({
      room: null,
      players: [],
      questions: [],
      currentQuestionIndex: 0,
      phase: 'lobby',
      hostPlayerId: null,
    }),
}))
