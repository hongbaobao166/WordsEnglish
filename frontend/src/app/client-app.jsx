'use client'

import dynamic from 'next/dynamic'

const LearningApp = dynamic(() => import('../next-client'), { ssr: false, loading: () => <main className="state">Đang tải không gian học tập…</main> })

export default function ClientApp() {
  return <LearningApp />
}
