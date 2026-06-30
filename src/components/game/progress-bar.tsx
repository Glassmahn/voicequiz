interface ProgressBarProps {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = total > 0 ? (current / total) * 100 : 0

  return (
    <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
      <div style={{
        height: '100%',
        width: `${Math.min(pct, 100)}%`,
        background: 'linear-gradient(90deg, #FF2D9B, #7B4FFF)',
        transition: 'width 0.4s ease',
        boxShadow: '0 0 8px rgba(123,79,255,0.3)',
      }} />
    </div>
  )
}
