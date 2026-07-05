import React from 'react'

function SkeletonLine({ width = '100%', height = 14, style = {} }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius: 4,
        backgroundColor: 'var(--clr-border)',
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  )
)

function SkeletonBlock({ style = {} }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height: 48,
        borderRadius: 8,
        backgroundColor: 'var(--clr-border)',
        opacity: 0.5,
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

export function PageSkeleton({ lines = 6, blocks = 3 }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{ padding: 'var(--sp-6) var(--sp-4)', maxWidth: 1000, margin: '0 auto' }}
    >
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
      <SkeletonLine width={200} height={24} style={{ marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 340px)', gap: 24 }}>
        <div>
          <SkeletonBlock style={{ width: '100%', height: 300, borderRadius: '50%' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: blocks }).map((_, i) => (
            <SkeletonBlock key={i} />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading content...</span>
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading settings"
      style={{ padding: 'var(--sp-6) var(--sp-4)', maxWidth: 600, margin: '0 auto' }}
    >
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
      <SkeletonLine width={180} height={24} style={{ marginBottom: 32 }} />
      {[1, 2, 3].map(i => (
        <div key={i} style={{ marginBottom: 24 }}>
          <SkeletonLine width={100} height={12} style={{ marginBottom: 8 }} />
          <SkeletonLine height={36} />
        </div>
      ))}
      <span className="sr-only">Loading settings...</span>
    </div>
  )
}

export function ArchiveSkeleton({ count = 5 }) {
  return (
    <div
      role="status"
      aria-label="Loading archive"
      style={{ padding: 'var(--sp-6) var(--sp-4)', maxWidth: 800, margin: '0 auto' }}
    >
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
      <SkeletonLine width={180} height={24} style={{ marginBottom: 32 }} />
      <SkeletonLine width={300} height={14} style={{ marginBottom: 16 }} />
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} style={{ marginBottom: 8 }} />
      ))}
      <span className="sr-only">Loading archive...</span>
    </div>
  )
}

export function AnalyticsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading analytics"
      style={{ padding: 'var(--sp-6) var(--sp-4)', maxWidth: 1000, margin: '0 auto' }}
    >
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
      <SkeletonLine width={200} height={24} style={{ marginBottom: 32 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[1, 2, 3, 4].map(i => (
          <SkeletonBlock key={i} style={{ height: 120 }} />
        ))}
      </div>
      <SkeletonBlock style={{ height: 300, marginTop: 24 }} />
      <span className="sr-only">Loading analytics...</span>
    </div>
  )
}
