import '../globals.css';

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="layout">
      <aside className="sidebar left-sidebar">
        {/* Left sidebar content - for future use */}
      </aside>
      <main className="main-content">
        {children}
      </main>
      <aside className="sidebar right-sidebar">
        {/* Right sidebar content - for future use */}
      </aside>
    </div>
  )
}
