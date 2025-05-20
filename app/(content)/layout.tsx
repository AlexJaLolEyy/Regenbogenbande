import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'

import Navigation from '@/lib/components/Navigation/navigation';


export default function ContentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="layout">
      <div className="left-box"></div>
      <div className="content-box">
          {children}
      </div>
      <div className="right-box"></div>
    </div>
  )
}
