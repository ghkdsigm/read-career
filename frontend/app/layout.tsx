import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Career Scraper',
  description: 'AI 채용 공고 스크래퍼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}

