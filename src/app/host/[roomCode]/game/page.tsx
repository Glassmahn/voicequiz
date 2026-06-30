'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/client'
import { useGameStore } from '@/lib/stores/game-store'
import { usePlayerStore } from '@/lib/stores/player-store'
import { calculateScore } from '@/lib/utils'
import QuestionCard from '@/components/game/question-card'
import AnswerButton from '@/components/game/answer-button'
import Leaderboard from '@/components/game/leaderboard'
import ProgressBar from '@/components/game/progress-bar'
import RoomCodeDisplay from '@/components/game/room-code-display'
import Logo from '@/components/ui/logo'
import { QuizSkeleton } from '@/components/ui/skeleton'
import type { Question } from '@/types'

type AnswerState = 'default' | 'selected' | 'correct' | 'wrong'

interface PlayerAnswer {
  player_id: string
  answer: string
  is_correct: boolean
  time_taken_ms: number
  question_number: number
}

export default function HostGamePage() {
  const router = useRouter()
  const params = useParams()
  const roomCode = params.roomCode as string
  const { playerId } = usePlayerStore()
  const { room, questions, players, setRoom, setQuestions, setPlayers, setHostPlayerId } = useGameStore()
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [phase, setPhase] = useState<'showing' | 'answering' | 'revealed'>('showing')
  const [playerAnswers, setPlayerAnswers] = useState<PlayerAnswer[]>([])
  const [submittedCount, setSubmittedCount] = useState(0)
  const startTimeRef = useRef<number>(0)
  const advanceRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<any>(null)
  const handleNextRef = useRef<() => void>(() => {})

  const currentQuestion: Question | undefined = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex >= questions.length - 1

  useEffect(() => {
    if (!playerId || !roomCode) {
      router.push('/')
      return
    }

    let cancelled = false

    const init = async () => {
      let resolvedRoom = room
      if (!resolvedRoom) {
        const { data: roomData } = await getSupabase()
          .from('rooms')
          .select('*')
          .eq('code', roomCode)
          .maybeSingle()

        if (!roomData || roomData.host_player_id !== playerId) {
          router.push('/')
          return
        }

        setRoom(roomData)
        setHostPlayerId(playerId)
        resolvedRoom = roomData

        const { data: qs } = await getSupabase()
          .from('questions')
          .select('*')
          .eq('room_id', roomData.id)
          .order('question_number')

        if (qs && qs.length > 0) setQuestions(qs)

        const { data: playersData } = await getSupabase()
          .from('players')
          .select('*')
          .eq('room_id', roomData.id)

        setPlayers(playersData || [])
      } else if (resolvedRoom.host_player_id !== playerId) {
        router.push('/')
        return
      }

      if (cancelled) return
      setLoading(false)

      const channel = getSupabase().channel(`room-${roomCode}`)
      channelRef.current = channel
      channel
        .on('broadcast', { event: 'answer:submitted' }, (payload: { payload: PlayerAnswer }) => {
          setPlayerAnswers((prev) => [...prev, payload.payload])
          setSubmittedCount((c) => c + 1)
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') startQuestion()
        })
    }

    init()

    return () => {
      cancelled = true
      if (advanceRef.current) clearTimeout(advanceRef.current)
      if (channelRef.current) getSupabase().removeChannel(channelRef.current)
    }
  }, [playerId, roomCode])

  const startQuestion = useCallback(() => {
    setPhase('answering')
    setTimerRunning(true)
    setPlayerAnswers([])
    setSubmittedCount(0)
    startTimeRef.current = Date.now()

    getSupabase().channel(`room-${roomCode}`).send({
      type: 'broadcast',
      event: 'question:start',
      payload: {
        questionNumber: currentQuestionIndex,
        question: currentQuestion,
        timerSeconds: room?.timer_seconds || 10,
        totalQuestions: questions.length,
      },
    })
  }, [currentQuestionIndex, currentQuestion, roomCode, room?.timer_seconds, questions.length])

  const handleNext = useCallback(async () => {
    if (isLastQuestion) {
      await getSupabase()
        .from('rooms')
        .update({ status: 'finished' })
        .eq('id', room?.id)

      getSupabase().channel(`room-${roomCode}`).send({
        type: 'broadcast',
        event: 'game:end',
        payload: { players },
      })

      router.push(`/host/${roomCode}/results`)
    } else {
      const nextIndex = currentQuestionIndex + 1
      const nextQuestion = questions[nextIndex]

      setPhase('answering')
      setTimerRunning(true)
      setCurrentQuestionIndex(nextIndex)
      setSubmittedCount(0)
      startTimeRef.current = Date.now()

      getSupabase().channel(`room-${roomCode}`).send({
        type: 'broadcast',
        event: 'question:start',
        payload: {
          questionNumber: nextIndex,
          question: nextQuestion,
          timerSeconds: room?.timer_seconds || 10,
          totalQuestions: questions.length,
        },
      })

      await getSupabase()
        .from('rooms')
        .update({ current_question: nextIndex + 1 })
        .eq('id', room?.id)
    }
  }, [isLastQuestion, room, roomCode, players, currentQuestionIndex, router, questions])

  handleNextRef.current = handleNext

  const handleTimerExpire = useCallback(async () => {
    if (phase !== 'answering') return
    setTimerRunning(false)
    setPhase('revealed')

    const qAnswers = playerAnswers.filter((pa) => pa.question_number === currentQuestion?.question_number)

    const allCorrectAnswers = qAnswers.map((pa) => {
      const isCorrect = pa.answer === currentQuestion?.correct_answer
      return {
        ...pa,
        is_correct: isCorrect,
        score: calculateScore(isCorrect),
      }
    })

    const answerMap = new Map(allCorrectAnswers.map((a) => [a.player_id, a]))
    const updatedPlayers = players.map((p) => {
      const pa = answerMap.get(p.player_id)
      if (pa) {
        return { ...p, score: p.score + pa.score }
      }
      return p
    })

    for (const pa of allCorrectAnswers) {
      await getSupabase().from('answers').insert({
        room_id: room?.id,
        question_id: currentQuestion?.id,
        player_id: pa.player_id,
        answer: pa.answer,
        is_correct: pa.is_correct,
        time_taken_ms: pa.time_taken_ms,
      }).maybeSingle()

      await getSupabase().from('players').update({
        score: updatedPlayers.find((p) => p.player_id === pa.player_id)?.score || 0,
      }).eq('player_id', pa.player_id).eq('room_id', room?.id)
    }

    setPlayers(updatedPlayers)

    getSupabase().channel(`room-${roomCode}`).send({
      type: 'broadcast',
      event: 'question:end',
      payload: {
        correctAnswer: currentQuestion?.correct_answer,
        playerAnswers: allCorrectAnswers,
        updatedPlayers,
      },
    })

    getSupabase().channel(`room-${roomCode}`).send({
      type: 'broadcast',
      event: 'score:update',
      payload: { players: updatedPlayers },
    })

    if (advanceRef.current) clearTimeout(advanceRef.current)
    advanceRef.current = setTimeout(() => handleNextRef.current(), 3000)
  }, [phase, currentQuestion, playerAnswers, players, room, roomCode, setPlayers])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <QuizSkeleton />
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'rgba(240,238,248,0.3)', marginBottom: 16 }}>No questions found for this room.</p>
          <button onClick={() => router.push('/')} style={{
            padding: '12px 28px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #FF2D9B, #7B4FFF)',
            color: '#fff', fontWeight: 600, cursor: 'pointer',
          }}>Go Home</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--bg)',
      }}>
        <Logo size="sm" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <RoomCodeDisplay code={roomCode} size="sm" />
          <span style={{
            fontSize: '0.75rem',
            color: 'rgba(240,238,248,0.3)',
            fontWeight: 500,
          }}>
            {players.length} players
          </span>
          <span style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: '0.65rem',
            color: 'rgba(240,238,248,0.2)',
          }}>
            Q{currentQuestionIndex + 1}/{questions.length}
          </span>
        </div>
      </nav>

      <ProgressBar current={currentQuestionIndex + 1} total={questions.length} />

      <div className="game" style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
        maxWidth: 1000, margin: '0 auto', padding: '28px 24px 20px', alignItems: 'stretch',
      }}>
        <QuestionCard
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          questionText={currentQuestion.question_text}
          duration={room?.timer_seconds || 10}
          timerRunning={timerRunning}
          onTimerExpire={handleTimerExpire}
        />

        <div className="a-panel" style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
          {currentQuestion.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i)
            let state: AnswerState = 'default'

            if (phase === 'revealed') {
              if (opt === currentQuestion.correct_answer) state = 'correct'
            }

            return (
              <AnswerButton
                key={i}
                letter={letter}
                text={opt}
                state={state}
                onClick={() => {}}
                disabled={true}
              />
            )
          })}

          {phase === 'revealed' && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <p style={{ color: 'rgba(240,238,248,0.3)', fontSize: '0.8rem' }}>
                {submittedCount} of {players.length} answered
              </p>
            </div>
          )}
        </div>
      </div>

      <Leaderboard players={players} />

      <style>{`
        @media (max-width: 700px) {
          .game { grid-template-columns: 1fr; padding: 16px !important; gap: 16px !important; }
          nav { padding: 10px 12px !important; }
        }
        @media (max-width: 480px) {
          nav { flex-direction: column; gap: 8px; padding: 10px 12px !important; }
          nav > div:last-child { flex-wrap: wrap; justify-content: center; }
          .game { padding: 12px !important; }
        }
      `}</style>
    </div>
  )
}
