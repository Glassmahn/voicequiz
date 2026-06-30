'use client'

import { Component } from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: 'var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, textAlign: 'center',
        }}>
          <div>
            <h1 style={{
              fontFamily: "'SF Pro Display', sans-serif",
              fontSize: '1.5rem', fontWeight: 700,
              color: '#F0EEF8', marginBottom: 8,
            }}>
              Something went wrong
            </h1>
            <p style={{ color: 'rgba(240,238,248,0.3)', marginBottom: 24, fontSize: '0.85rem' }}>
              Try refreshing the page
            </p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
              style={{
                padding: '12px 28px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #FF2D9B, #7B4FFF)',
                color: '#fff', fontWeight: 600, fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
