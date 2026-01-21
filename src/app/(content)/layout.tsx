import { AuroraBackground } from '@/src/lib/components/home/aurora-background';
import '../globals.css';

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuroraBackground className="h-auto! min-h-screen">
      <div className="relative z-10 w-full max-w-480 mx-auto min-h-screen p-6 pt-32">
        {children}
      </div>
    </AuroraBackground>
  )
}
