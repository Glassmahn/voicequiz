'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/client'
import { usePlayerStore } from '@/lib/stores/player-store'
import { useGameStore } from '@/lib/stores/game-store'
import QuestionCard from '@/components/game/question-card'
import AnswerButton from '@/components/game/answer-button'
import type { AnswerState } from '@/components/game/answer-button'
import Leaderboard from '@/components/game/leaderboard'
import ProgressBar from '@/components/game/progress-bar'
import RoomCodeDisplay from '@/components/game/room-code-display'
import Logo from '@/components/ui/logo'
import { QuizSkeleton } from '@/components/ui/skeleton'
import type { Question, Player } from '@/types'

export default function PlayerGamePage() {
  const router = useRouter()
  const params = useParams()
  const roomCode = params.roomCode as string
  const { playerId } = usePlayerStore()
  const { players, setPlayers } = useGameStore()

  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [timerSeconds, setTimerSeconds] = useState(10)
  const [localIndex, setLocalIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [timerRunning, setTimerRunning] = useState(false)
  const [phase, setPhase] = useState<'showing' | 'answering' | 'answered'>('showing')
  const [answerStates, setAnswerStates] = useState<AnswerState[]>(['default', 'default', 'default', 'default'])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const startTimeRef = useRef<number>(0)

  const currentQuestion = allQuestions[localIndex]
  const totalQuestions = allQuestions.length
  const questionNumber = localIndex + 1

  useEffect(() => {
    if (!playerId || !roomCode) {
      router.push('/')
      return
    }

    const channel = getSupabase().channel(`room-${roomCode}`)

    channel.on('broadcast', { event: 'score:update' }, (payload: { payload: { players: Player[] } }) => {
      setPlayers(payload.payload.players as Player[])
    })

    channel.on('broadcast', { event: 'game:end' }, () => {
      router.push(`/play/${roomCode}/results`)
    })

    channel.subscribe()

    return () => {
      getSupabase().removeChannel(channel)
    }
  }, [playerId, roomCode, router, setPlayers])

  const questionIdsAnsweredRef = useRef(new Set<number>())

  useEffect(() => {
    if (!roomCode) return
    let cancelled = false
    const fetch = async () => {
      const { data: room } = await getSupabase()
        .from('rooms')
        .select('id, timer_seconds')
        .eq('code', roomCode)
        .maybeSingle()
      if (!room) return
      if (room.timer_seconds) setTimerSeconds(room.timer_seconds)
      const { data: qs } = await getSupabase()
        .from('questions')
        .select('*')
        .eq('room_id', room.id)
        .order('question_number')
      if (cancelled) return
      if (qs && qs.length > 0) {
        setAllQuestions(qs)
        setPhase('answering')
        setTimerRunning(true)
        startTimeRef.current = Date.now()
      }
      setLoading(false)
    }
    fetch()
    return () => { cancelled = true }
  }, [roomCode])

  const handleAnswer = useCallback((index: number) => {
    if (phase !== 'answering' || selectedIndex !== null || !currentQuestion) return
    if (questionIdsAnsweredRef.current.has(currentQuestion.question_number)) return

    questionIdsAnsweredRef.current.add(currentQuestion.question_number)

    const answer = currentQuestion.options[index]
    const isCorrect = answer === currentQuestion.correct_answer
    const timeTaken = Date.now() - startTimeRef.current

    setSelectedIndex(index)
    setPhase('answered')
    setTimerRunning(false)

    setAnswerStates(
      currentQuestion.options.map((opt) => {
        if (opt === currentQuestion.correct_answer) return 'correct'
        if (opt === answer && !isCorrect) return 'wrong'
        return 'default'
      })
    )

    getSupabase().channel(`room-${roomCode}`).send({
      type: 'broadcast',
      event: 'answer:submitted',
      payload: {
        player_id: playerId,
        answer,
        is_correct: isCorrect,
        time_taken_ms: timeTaken,
        question_number: currentQuestion.question_number,
      },
    })
  }, [phase, selectedIndex, currentQuestion, playerId, roomCode])

  const handleTimerExpire = useCallback(() => {
    if (phase !== 'answering') return
    setTimerRunning(false)
    setPhase('answered')
    if (currentQuestion) {
      setAnswerStates(
        currentQuestion.options.map((opt) =>
          opt === currentQuestion.correct_answer ? 'correct' : 'default'
        )
      )
    }
  }, [phase, currentQuestion])

  const handleNext = () => {
    if (localIndex < allQuestions.length - 1) {
      const nextIdx = localIndex + 1
      setLocalIndex(nextIdx)
      setPhase('answering')
      setTimerRunning(true)
      setSelectedIndex(null)
      setAnswerStates(['default', 'default', 'default', 'default'])
      startTimeRef.current = Date.now()
    } else {
      router.push(`/play/${roomCode}/results`)
    }
  }

  const options = currentQuestion?.options || []

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <QuizSkeleton />
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
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: '0.65rem',
            color: 'rgba(240,238,248,0.2)',
          }}>
            Q{questionNumber}/{totalQuestions || '?'}
          </span>
        </div>
      </nav>

      <ProgressBar current={questionNumber} total={totalQuestions} />

      <div className="game" style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
        maxWidth: 1000, margin: '0 auto', padding: '28px 24px 20px', alignItems: 'stretch',
      }}>
        {currentQuestion ? (
          <>
            <QuestionCard
              questionNumber={questionNumber}
              totalQuestions={totalQuestions}
              questionText={currentQuestion.question_text}
              duration={timerSeconds}
              timerRunning={timerRunning}
              onTimerExpire={handleTimerExpire}
            />

            <div className="a-panel" style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
              {options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i)
                return (
                  <AnswerButton
                    key={i}
                    letter={letter}
                    text={opt}
                    state={answerStates[i]}
                    onClick={() => handleAnswer(i)}
                    disabled={phase !== 'answering'}
                  />
                )
              })}

              {phase === 'answered' && (
                <button
                  onClick={handleNext}
                  style={{
                    fontFamily: "'SF Pro Text', sans-serif",
                    fontWeight: 600,
                    padding: '12px 40px',
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    color: '#fff',
                    fontSize: '0.85rem',
                    marginTop: 12,
                    background: 'linear-gradient(135deg, #FF2D9B, #7B4FFF)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    animation: 'fadeIn 0.3s ease both',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,45,155,0.3)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {localIndex < allQuestions.length - 1 ? 'Next Question' : 'See Results'}
                </button>
              )}
            </div>
          </>
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 80, color: 'rgba(240,238,248,0.3)' }}>
            Loading questions...
          </div>
        )}
      </div>

      <Leaderboard players={players} currentPlayerId={playerId} />

      <style>{`
        @media (max-width: 700px) {
          .game { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
