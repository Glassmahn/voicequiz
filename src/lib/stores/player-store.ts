'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PlayerIdentity } from '@/types'
import { generatePlayerId } from '@/lib/utils'
import { getRandomAvatarKey } from '@/components/ui/avatar'

interface PlayerStore extends PlayerIdentity {
  roomCode: string
  setDisplayName: (name: string) => void
  setAvatar: (avatar: string) => void
  setPlayerId: (id: string) => void
  setRoomCode: (code: string) => void
  initialize: () => void
  reset: () => void
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      playerId: '',
      displayName: '',
      avatar: 'a0',
      roomCode: '',
      setRoomCode: (code) => set({ roomCode: code }),
      setDisplayName: (name) => set({ displayName: name }),
      setAvatar: (avatar) => set({ avatar }),
      setPlayerId: (id) => set({ playerId: id }),
      initialize: () => {
        if (!get().playerId) {
          set({ playerId: generatePlayerId(), avatar: getRandomAvatarKey() })
        }
      },
      reset: () => {
        set({ playerId: generatePlayerId(), displayName: '', roomCode: '', avatar: getRandomAvatarKey() })
      },
    }),
    {
      name: 'vq-player',
    }
  )
)
