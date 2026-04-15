import type { GraphNode, GraphEdge } from '@vue-flow/core'

interface Snapshot {
  nodes: Array<{ id: string, position: { x: number, y: number }, data: Record<string, unknown> }>
  edges: Array<{ id: string, source: string, target: string, sourceHandle?: string, label?: string }>
}

function captureSnapshot(nodes: GraphNode[], edges: GraphEdge[]): Snapshot {
  return {
    nodes: nodes.map(n => ({
      id: n.id,
      position: { ...n.position },
      data: JSON.parse(JSON.stringify(n.data))
    })),
    edges: edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || undefined,
      label: (e.label as string) || undefined
    }))
  }
}

export function useCanvasHistory(
  nodes: Ref<GraphNode[]>,
  edges: Ref<GraphEdge[]>,
  setNodes: (nodes: GraphNode[]) => void,
  setEdges: (edges: GraphEdge[]) => void
) {
  const undoStack = ref<Snapshot[]>([])
  const redoStack = ref<Snapshot[]>([])
  const maxHistory = 50

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  function pushSnapshot() {
    const snap = captureSnapshot(nodes.value, edges.value)
    undoStack.value = [...undoStack.value.slice(-(maxHistory - 1)), snap]
    redoStack.value = []
  }

  function restoreSnapshot(snap: Snapshot) {
    setNodes(snap.nodes.map(n => ({
      id: n.id,
      type: 'journey',
      position: { ...n.position },
      data: JSON.parse(JSON.stringify(n.data))
    })) as GraphNode[])

    setEdges(snap.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      label: e.label,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 }
    })) as GraphEdge[])
  }

  function undo() {
    if (!canUndo.value) return
    const current = captureSnapshot(nodes.value, edges.value)
    redoStack.value = [...redoStack.value, current]
    const prev = undoStack.value[undoStack.value.length - 1]
    undoStack.value = undoStack.value.slice(0, -1)
    restoreSnapshot(prev)
  }

  function redo() {
    if (!canRedo.value) return
    const current = captureSnapshot(nodes.value, edges.value)
    undoStack.value = [...undoStack.value, current]
    const next = redoStack.value[redoStack.value.length - 1]
    redoStack.value = redoStack.value.slice(0, -1)
    restoreSnapshot(next)
  }

  return { pushSnapshot, undo, redo, canUndo, canRedo }
}
