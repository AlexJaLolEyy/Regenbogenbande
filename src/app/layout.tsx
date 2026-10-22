import { AppShell } from '@/src/lib/components/navigation/app-shell';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        {/* Apply the saved accent before first paint to avoid a flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var a=localStorage.getItem("accent");if(a)document.documentElement.setAttribute("data-accent",a)}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
