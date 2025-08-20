import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FishFarm DeFi - 하루 커피값/밥값 벌기 챌린지',
  description: '물고기잡이 메타포로 쉽게 이해하는 DeFi V3 유동성 파밍 체험',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="antialiased bg-slate-900 text-white">
        {children}
      </body>
    </html>
  )
}