'use client'

import { useState, useEffect, useRef } from 'react'
import Timer from '@/components/game/timer'

interface QuestionCardProps {
  questionNumber: number
  totalQuestions: number
  questionText: string
  duration: number
  timerRunning: boolean
  onTimerExpire: () => void
}

export default function QuestionCard({
  questionNumber,
  totalQuestions,
  questionText,
  duration,
  timerRunning,
  onTimerExpire,
}: QuestionCardProps) {
  const [animKey, setAnimKey] = useState(0)
  const prevQRef = useRef(questionNumber)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prevQRef.current !== questionNumber) {
      prevQRef.current = questionNumber
      setAnimKey((k) => k + 1)
      textRef.current?.focus()
    }
  }, [questionNumber])

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 16,
        padding: '32px 32px 28px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        minHeight: 320,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: '0.65rem',
          letterSpacing: '0.1em',
          color: 'rgba(240,238,248,0.25)',
          marginBottom: 24,
        }}>
          Question {String(questionNumber).padStart(2, '0')} / {String(totalQuestions).padStart(2, '0')}
        </div>
        <div
          ref={textRef}
          tabIndex={-1}
          key={animKey}
          style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
            fontWeight: 500,
            lineHeight: 1.5,
            color: '#F0EEF8',
            display: 'flex',
            alignItems: 'center',
            minHeight: 80,
            letterSpacing: '-0.01em',
            animation: animKey > 0 ? 'fadeIn 0.3s ease both' : undefined,
          }}
        >
          {questionText}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Timer duration={duration} running={timerRunning} onExpire={onTimerExpire} />
      </div>
    </div>
  )
}
