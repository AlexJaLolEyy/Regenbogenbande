import '../globals.css';

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
