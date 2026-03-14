import { Allotment } from 'allotment'
import 'allotment/dist/style.css'
import { AssetTree } from './components/tree/AssetTree'
import { EditorPane } from './components/editor/EditorPane'
import { PreviewPane } from './components/preview/PreviewPane'
import { Toolbar } from './components/layout/Toolbar'
import { useFileWatch } from './hooks/useFileWatch'

export default function App() {
  useFileWatch()

  return (
    <div className="app">
      <Toolbar />
      <div className="app-panels">
        <Allotment>
          <Allotment.Pane minSize={200} preferredSize={260}>
            <AssetTree />
          </Allotment.Pane>
          <Allotment.Pane minSize={300}>
            <EditorPane />
          </Allotment.Pane>
          <Allotment.Pane minSize={250} preferredSize={350}>
            <PreviewPane />
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  )
}
