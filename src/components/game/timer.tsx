'use client'

import { useRef, useEffect, useState } from 'react'

interface TimerProps {
  duration: number
  running: boolean
  onExpire: () => void
  size?: number
}

export default function Timer({ duration, running, onExpire, size = 64 }: TimerProps) {
  const [remaining, setRemaining] = useState(duration)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startRef = useRef<number>(0)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    setRemaining(duration)
  }, [duration])

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    startRef.current = Date.now()
    setRemaining(duration)

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000)
      const left = Math.max(0, duration - elapsed)
      setRemaining(left)
      if (left <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        onExpireRef.current()
      }
    }, 100)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, duration])

  const isLow = remaining <= 5
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - remaining / duration)
  const strokeColor = isLow ? '#FF2D9B' : '#7B4FFF'
  const glowColor = isLow ? 'rgba(255,45,155,0.3)' : 'rgba(123,79,255,0.25)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} role="timer" aria-label={`${remaining} seconds remaining`}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox="0 0 64 64" style={{ position: 'absolute', inset: 0, filter: `drop-shadow(0 0 6px ${strokeColor})` }}>
          <circle cx="32" cy="32" r={radius} fill="none" stroke={glowColor} strokeWidth={6} opacity={0.5} />
        </svg>
        <svg width={size} height={size} viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)', position: 'relative' }}>
          <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
          <circle
            cx="32" cy="32" r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={remaining >= 0 ? offset : circumference}
            style={{
              transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s',
            }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: "var(--font-jetbrains), monospace", fontSize: '1rem', fontWeight: 700,
          color: strokeColor,
          transition: 'color 0.3s',
          lineHeight: 1.1,
        }}>
          {remaining}
          <span style={{
            fontSize: '0.4rem', fontWeight: 500,
            color: isLow ? 'rgba(255,45,155,0.5)' : 'rgba(240,238,248,0.2)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            {isLow ? 'hurry' : 'sec'}
          </span>
        </div>
      </div>
    </div>
  )
}
