'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/client'
import { usePlayerStore } from '@/lib/stores/player-store'
import { useGameStore } from '@/lib/stores/game-store'
import { generateRoomCode, sanitizeDisplayName } from '@/lib/utils'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Toast from '@/components/ui/toast'

interface QuestionDraft {
  question: string
  options: string[]
  correctAnswer: string
}

const emptyQuestion = (): QuestionDraft => ({
  question: '',
  options: ['', '', '', ''],
  correctAnswer: '',
})

export default function HostSetupPage() {
  const router = useRouter()
  const { playerId, displayName, avatar } = usePlayerStore()
  const { setRoom, setQuestions, setPlayers, setHostPlayerId } = useGameStore()
  const { setRoomCode } = usePlayerStore()

  const [title, setTitle] = useState('')
  const [timer, setTimer] = useState(10)
  const [questions, setQuestionsState] = useState<QuestionDraft[]>([emptyQuestion()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateQuestion = (qi: number, field: keyof QuestionDraft, value: any) => {
    setQuestionsState((prev) => {
      const next = prev.map((q, i) => (i === qi ? { ...q, [field]: value } : q))
      return next
    })
  }

  const updateOption = (qi: number, oi: number, value: string) => {
    setQuestionsState((prev) => {
      const next = prev.map((q, i) => {
        if (i !== qi) return q
        const newOptions = [...q.options]
        newOptions[oi] = value
        return { ...q, options: newOptions }
      })
      return next
    })
  }

  const setCorrect = (qi: number, value: string) => {
    updateQuestion(qi, 'correctAnswer', value)
  }

  const addQuestion = () => {
    setQuestionsState((prev) => [...prev, emptyQuestion()])
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }, 50)
  }

  const removeQuestion = (qi: number) => {
    setQuestionsState((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((_, i) => i !== qi)
    })
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Please enter a quiz title')
      return
    }
    if (!playerId || !displayName) {
      router.push('/')
      return
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question.trim()) {
        setError(`Question ${i + 1} is missing the question text`)
        return
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j].trim()) {
          setError(`Question ${i + 1} is missing option ${String.fromCharCode(65 + j)}`)
          return
        }
      }
      if (!q.correctAnswer) {
        setError(`Question ${i + 1} is missing the correct answer`)
        return
      }
    }

    setLoading(true)
    setError(null)

    let code = generateRoomCode()
    let attempts = 0
    while (attempts < 10) {
      const { data: existing } = await getSupabase().from('rooms').select('id').eq('code', code).limit(1).maybeSingle()
      if (!existing) break
      code = generateRoomCode()
      attempts++
    }
    if (attempts >= 10) {
      setError('Could not generate unique room code. Try again.')
      setLoading(false)
      return
    }

    const { data: room, error: roomErr } = await getSupabase()
      .from('rooms')
      .insert({
        code,
        host_player_id: playerId,
        title: title.trim(),
        status: 'waiting',
        question_count: questions.length,
        timer_seconds: timer,
        difficulty: 'medium',
      })
      .select('*')
      .maybeSingle()

    if (roomErr || !room) {
      setError(`Failed to create room: ${roomErr?.message || 'Unknown error'}`)
      setLoading(false)
      return
    }

    const { error: playerErr } = await getSupabase().from('players').insert({
      room_id: room.id,
      player_id: playerId,
      display_name: sanitizeDisplayName(displayName) || 'Host',
      avatar,
      score: 0,
      is_host: true,
    }).select('*').maybeSingle()

    if (playerErr) {
      await getSupabase().from('rooms').delete().eq('id', room.id)
      setError(`Failed to create player: ${playerErr?.message || 'Unknown error'}`)
      setLoading(false)
      return
    }

    const { data: players } = await getSupabase()
      .from('players')
      .select('*')
      .eq('room_id', room.id)

    const questionsToInsert = questions.map((q, i) => ({
      room_id: room.id,
      question_number: i + 1,
      question_text: q.question.trim(),
      options: q.options.map((o) => o.trim()),
      correct_answer: q.correctAnswer,
    }))

    const { data: insertedQuestions, error: qErr } = await getSupabase()
      .from('questions')
      .insert(questionsToInsert)
      .select('*')

    if (qErr || !insertedQuestions || insertedQuestions.length === 0) {
      await getSupabase().from('rooms').delete().eq('id', room.id)
      setError(`Failed to save questions: ${qErr?.message || 'Unknown error'}`)
      setLoading(false)
      return
    }

    setRoom(room)
    setQuestions(insertedQuestions)
    setPlayers(players || [])
    setHostPlayerId(playerId)
    setRoomCode(code)

    router.push(`/host/${code}/lobby`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: 24,
    }}>
      <div style={{
        maxWidth: 600, margin: '0 auto',
        animation: 'fadeUp 0.5s ease both',
      }}>
        <h1 style={{
          fontFamily: "'SF Pro Display', -apple-system, sans-serif",
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#F0EEF8',
          textAlign: 'center',
          marginBottom: 4,
        }}>
          Create a quiz
        </h1>
        <p style={{
          color: 'rgba(240,238,248,0.3)',
          fontSize: '0.8rem',
          textAlign: 'center',
          marginBottom: 32,
        }}>
          Write your questions and set the correct answers
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label style={{
              color: 'rgba(240,238,248,0.4)',
              fontSize: '0.75rem',
              fontWeight: 500,
              marginBottom: 6,
              display: 'block',
            }}>
              Quiz Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. World History, Science, Pop Culture"
              maxLength={100}
            />
          </div>

          <div>
            <label style={{
              color: 'rgba(240,238,248,0.4)',
              fontSize: '0.75rem',
              fontWeight: 500,
              marginBottom: 8,
              display: 'block',
            }}>
              Timer (seconds)
            </label>
            <div className="toggle-group" style={{ display: 'flex', gap: 8 }}>
              {[5, 10, 15, 20].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimer(t)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 8,
                    border: timer === t
                      ? '1px solid rgba(123,79,255,0.5)'
                      : '1px solid rgba(255,255,255,0.08)',
                    background: timer === t
                      ? 'rgba(123,79,255,0.1)'
                      : 'transparent',
                    color: timer === t ? '#F0EEF8' : 'rgba(240,238,248,0.4)',
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s',
                    minHeight: 44,
                  }}
                  onMouseEnter={(e) => {
                    if (timer !== t) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (timer !== t) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    }
                  }}
                >{t}</button>
              ))}
            </div>
          </div>

          <div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 12,
            }}>
              <label style={{
                color: 'rgba(240,238,248,0.4)',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}>
                Questions ({questions.length})
              </label>
              <button
                onClick={addQuestion}
                style={{
                  background: 'none', border: '1px solid rgba(123,79,255,0.3)',
                  color: '#7B4FFF', borderRadius: 8, padding: '6px 14px',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(123,79,255,0.1)'
                  e.currentTarget.style.borderColor = 'rgba(123,79,255,0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.borderColor = 'rgba(123,79,255,0.3)'
                }}
              >
                + Add Question
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {questions.map((q, qi) => (
                <div
                  key={qi}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    padding: 20,
                    animation: 'fadeIn 0.3s ease both',
                  }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: 12,
                  }}>
                    <span style={{
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: '0.65rem',
                      color: 'rgba(123,79,255,0.5)',
                      letterSpacing: '0.06em',
                    }}>
                      QUESTION {String(qi + 1).padStart(2, '0')}
                    </span>
                    {questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(qi)}
                        style={{
                          background: 'none', border: 'none',
                          color: 'rgba(255,45,155,0.5)', cursor: 'pointer',
                          fontSize: '0.75rem', fontWeight: 500,
                          padding: '4px 8px', borderRadius: 4,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,45,155,0.1)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    value={q.question}
                    onChange={(e) => updateQuestion(qi, 'question', e.target.value)}
                    placeholder="Enter your question"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#F0EEF8',
                      fontSize: '0.9rem',
                      fontFamily: "'SF Pro Text', sans-serif",
                      outline: 'none',
                      marginBottom: 16,
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(123,79,255,0.4)'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)' }}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {q.options.map((opt, oi) => {
                      const letter = String.fromCharCode(65 + oi)
                      const isCorrect = q.correctAnswer === opt
                      return (
                        <div
                          key={oi}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                          }}
                        >
                          <button
                            onClick={() => setCorrect(qi, opt)}
                            aria-label={`Mark ${letter} as correct answer`}
                            style={{
                              width: 28, height: 28, borderRadius: '50%',
                              border: isCorrect
                                ? '2px solid var(--green)'
                                : '2px solid rgba(255,255,255,0.1)',
                              background: isCorrect ? 'rgba(0,255,136,0.12)' : 'transparent',
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.15s',
                              flexShrink: 0,
                              minWidth: 28,
                            }}
                            onMouseEnter={(e) => {
                              if (!isCorrect) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                            }}
                            onMouseLeave={(e) => {
                              if (!isCorrect) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                            }}
                          >
                            {isCorrect && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </button>
                          <span style={{
                            fontFamily: "var(--font-jetbrains), monospace",
                            fontSize: '0.75rem',
                            color: 'rgba(240,238,248,0.3)',
                            width: 16, textAlign: 'center',
                            flexShrink: 0,
                          }}>
                            {letter}
                          </span>
                          <input
                            value={opt}
                            onChange={(e) => updateOption(qi, oi, e.target.value)}
                            placeholder={`Option ${letter}`}
                            style={{
                              flex: 1,
                              padding: '10px 12px',
                              borderRadius: 8,
                              background: 'rgba(255,255,255,0.03)',
                              border: isCorrect
                                ? '1px solid rgba(0,255,136,0.2)'
                                : '1px solid rgba(255,255,255,0.06)',
                              color: '#F0EEF8',
                              fontSize: '0.85rem',
                              fontFamily: "'SF Pro Text', sans-serif",
                              outline: 'none',
                              transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => { e.target.style.borderColor = 'rgba(123,79,255,0.4)'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
                            onBlur={(e) => { e.target.style.borderColor = isCorrect ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.06)'; e.target.style.background = 'rgba(255,255,255,0.03)' }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleCreate}
            loading={loading}
            style={{ marginTop: 4 }}
          >
            Create Room
          </Button>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .toggle-group { flex-wrap: wrap; }
          .toggle-group button { flex: 1 1 40%; min-width: 0; }
        }
      `}</style>

      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
    </div>
  )
}
