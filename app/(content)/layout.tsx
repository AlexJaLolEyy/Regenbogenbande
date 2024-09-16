import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'

import Navigation from '@/lib/components/Navigation/navigation';
import { Providers } from '../providers';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Regenbogenbande',
  description: 'Website featuring content for the "Regenbogenbande"',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (

    <html lang="en" className='light'>
      <body className={inter.className}>
      <Navigation></Navigation>
        <div className='layout'>
          <div className='left-box'></div>
          <div className='content-box'>
            <Providers>
              {children}
            </Providers>
          </div>
          <div className='right-box'></div>
        </div>
      </body>
    </html>
  )
}
