'use client'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  style?: React.CSSProperties
}

export default function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, rgba(123,79,255,0.1) 25%, rgba(123,79,255,0.2) 50%, rgba(123,79,255,0.1) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

export function QuizSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 400, margin: '0 auto' }}>
      <Skeleton height={40} />
      <Skeleton height={20} width="60%" />
      <Skeleton height={60} />
      <Skeleton height={60} />
      <Skeleton height={60} />
      <Skeleton height={60} />
    </div>
  )
}

export function RoomSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', padding: 40 }}>
      <Skeleton height={30} width={200} />
      <Skeleton height={60} width={180} borderRadius={12} />
      <Skeleton height={20} width={140} />
      <div style={{ display: 'flex', gap: 10 }}>
        <Skeleton height={40} width={40} borderRadius="50%" />
        <Skeleton height={40} width={40} borderRadius="50%" />
        <Skeleton height={40} width={40} borderRadius="50%" />
      </div>
    </div>
  )
}
