import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

import {Providers} from "./providers";
import {NextUIProvider} from "@nextui-org/react";

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
    
    <html lang="en" className='dark'>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
