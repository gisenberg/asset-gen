import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface AncestorSectionProps {
  filePath: string
  content: string
}

export function AncestorSection({ filePath, content }: AncestorSectionProps) {
  const [collapsed, setCollapsed] = useState(true)
  const filename = filePath.split('/').pop() || filePath

  return (
    <div className={`ancestor-section ${collapsed ? 'collapsed' : ''}`}>
      <div className="ancestor-label" onClick={() => setCollapsed(!collapsed)}>
        <span className="ancestor-chevron">{collapsed ? '▶' : '▼'}</span>
        Context: {filename}
      </div>
      {!collapsed && (
        <div className="ancestor-content">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}
