import { useState, useRef, useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import ReactMarkdown from 'react-markdown'
import type { AssetNode } from '../../types/asset'

interface AssetEditorProps {
  asset: AssetNode
  content: string
  onChange: (content: string) => void
}

export function AssetEditor({ asset, content, onChange }: AssetEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()

  const handleChange = useCallback(
    (value: string) => {
      onChange(value)

      // Auto-save with 1s debounce
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        window.electronAPI.writeFile(asset.path, value)
      }, 1000)
    },
    [asset.path, onChange]
  )

  return (
    <div className="asset-editor">
      <div className="editor-header">
        <span className="editor-filename">{asset.name}</span>
        <div className="editor-toggle">
          <button
            className={mode === 'edit' ? 'active' : ''}
            onClick={() => setMode('edit')}
          >
            Edit
          </button>
          <button
            className={mode === 'preview' ? 'active' : ''}
            onClick={() => setMode('preview')}
          >
            Preview
          </button>
        </div>
      </div>
      <div className="editor-body">
        {mode === 'edit' ? (
          <CodeMirror
            value={content}
            onChange={handleChange}
            extensions={[markdown()]}
            theme={vscodeDark}
            basicSetup={{
              lineNumbers: false,
              foldGutter: false,
              highlightActiveLine: true
            }}
          />
        ) : (
          <div className="markdown-preview">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
