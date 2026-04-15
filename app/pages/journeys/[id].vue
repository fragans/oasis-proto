<script setup lang="ts">
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'
import type { JourneyNodeType, JourneyStatus } from '~~/shared/types/journey'
import { NODE_TYPE_LABELS } from '~~/shared/types/journey'

definePageMeta({ layout: 'canvas' })

defineShortcuts({
  meta_s: () => {
    if (isEditable.value) handleSave()
  },
  meta_z: () => {
    if (isEditable.value) undo()
  },
  meta_shift_z: () => {
    if (isEditable.value) redo()
  }
})
const route = useRoute()
const router = useRouter()
const toast = useToast()
const journeyId = route.params.id as string

const { fetchJourney, changeStatus, saveGraph, deleteJourney } = useJourney()

const journey = ref<Awaited<ReturnType<typeof fetchJourney>> | null>(null)
const loading = ref(true)
const saving = ref(false)
const selectedNodeId = ref<string | null>(null)
const showDeleteConfirm = ref(false)
const deleting = ref(false)

const {
  nodes,
  edges,
  addNodes,
  addEdges,
  removeNodes,
  setNodes,
  setEdges,
  onConnect,
  fitView,
  project
} = useVueFlow({
  id: 'journey-builder'
})

const { pushSnapshot, undo, redo, canUndo, canRedo } = useCanvasHistory(nodes, edges, setNodes, setEdges)

// Load journey data
async function loadJourney() {
  loading.value = true
  try {
    const data = await fetchJourney(journeyId)
    journey.value = data

    // Convert to Vue Flow format
    setNodes(data.nodes.map(n => ({
      id: n.id,
      type: 'journey',
      position: { x: n.positionX, y: n.positionY },
      data: { type: n.type, label: n.label || NODE_TYPE_LABELS[n.type as JourneyNodeType], config: n.config }
    })))

    setEdges(data.edges.map(e => ({
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      sourceHandle: e.sourceHandle || undefined,
      label: e.label || undefined,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 }
    })))

    nextTick(() => fitView({ padding: 0.2 }))
  } finally {
    loading.value = false
  }
}

onMounted(loadJourney)

// Connect nodes
onConnect((params) => {
  pushSnapshot()
  addEdges([{
    ...params,
    id: `e-${Date.now()}`,
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2 }
  }])
})

// Add a new node
function addNode(type: JourneyNodeType) {
  pushSnapshot()
  const id = `node-${Date.now()}`
  const yPositions = nodes.value.map(n => n.position.y)
  const maxY = yPositions.length > 0 ? Math.max(...yPositions) : 0

  addNodes([{
    id,
    type: 'journey',
    position: { x: 400, y: maxY + 120 },
    data: { type, label: NODE_TYPE_LABELS[type], config: getDefaultConfig(type) }
  }])
}

function getDefaultConfig(type: JourneyNodeType): Record<string, unknown> {
  switch (type) {
    case 'delay': return { type: 'duration', duration: { value: 1, unit: 'hours' } }
    case 'condition': return { type: 'attribute', operator: 'equals' }
    case 'split': return { variants: [{ label: 'A', percentage: 50 }, { label: 'B', percentage: 50 }] }
    case 'action_webhook': return { method: 'POST' }
    default: return {}
  }
}

// Handle drop from palette
function onDrop(event: DragEvent) {
  const type = event.dataTransfer?.getData('application/journey-node') as JourneyNodeType
  if (!type) return

  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const position = project({
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top
  })

  pushSnapshot()
  addNodes([{
    id: `node-${Date.now()}`,
    type: 'journey',
    position,
    data: { type, label: NODE_TYPE_LABELS[type], config: getDefaultConfig(type) }
  }])
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
}

// Selected node for config panel
const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null
  return nodes.value.find(n => n.id === selectedNodeId.value) || null
})

function onNodeClick(event: { node: { id: string } }) {
  selectedNodeId.value = event.node.id
}

function onPaneClick() {
  selectedNodeId.value = null
}

function updateNodeConfig(config: Record<string, unknown>) {
  if (!selectedNodeId.value) return
  pushSnapshot()
  const node = nodes.value.find(n => n.id === selectedNodeId.value)
  if (node) {
    node.data = { ...node.data, config }
  }
  selectedNodeId.value = null
}

function updateNodeLabel(label: string) {
  if (!selectedNodeId.value) return
  pushSnapshot()
  const node = nodes.value.find(n => n.id === selectedNodeId.value)
  if (node) {
    node.data = { ...node.data, label }
  }
}

function deleteSelectedNode() {
  if (!selectedNodeId.value) return
  pushSnapshot()
  removeNodes([selectedNodeId.value])
  selectedNodeId.value = null
}

// Save graph to server
async function handleSave() {
  saving.value = true
  try {
    const graphData = {
      nodes: nodes.value.map(n => ({
        id: n.id,
        type: n.data.type as JourneyNodeType,
        label: n.data.label,
        config: n.data.config,
        positionX: Math.round(n.position.x),
        positionY: Math.round(n.position.y)
      })),
      edges: edges.value.map(e => ({
        id: e.id,
        sourceNodeId: e.source,
        targetNodeId: e.target,
        sourceHandle: e.sourceHandle || undefined,
        label: (e.label as string) || undefined
      }))
    }

    await saveGraph(journeyId, graphData)
    toast.add({ title: 'Journey saved', color: 'success' })
    await loadJourney()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save'
    toast.add({ title: 'Error', description: message, color: 'error' })
  } finally {
    saving.value = false
  }
}

// Status change
async function handleStatusChange(newStatus: JourneyStatus) {
  try {
    await changeStatus(journeyId, newStatus)
    toast.add({ title: `Journey ${newStatus}`, color: 'success' })
    await loadJourney()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Status change failed'
    toast.add({ title: 'Error', description: message, color: 'error' })
  }
}

// Delete journey
async function handleDelete() {
  deleting.value = true
  try {
    await deleteJourney(journeyId)
    router.push('/journeys')
  } finally {
    deleting.value = false
  }
}

const isEditable = computed(() => journey.value?.isEditable ?? false)
const availableTransitions = computed(() => journey.value?.availableTransitions ?? [])
</script>

<template>
  <div class="flex flex-col h-screen -m-6">
    <!-- Toolbar -->
    <div class="fixed top-8 right-8 px-4 py-2 bg-white dark:bg-zinc-900/50 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm z-10">
      <div class="flex gap-3">
        <div class="flex items-center gap-3">
          <div v-if="journey">
            <h2 class="font-semibold text-zinc-900 dark:text-white text-sm">
              {{ journey.name }}
            </h2>
            <p class="text-xs text-zinc-500">
              {{ journey.description || 'No description' }}
            </p>
          </div>
          <JourneyStatusBadge
            v-if="journey"
            :status="journey.status"
          />
        </div>

        <div class="flex items-center gap-2">
          <!-- Undo / Redo -->
          <UButton
            v-if="isEditable"
            icon="i-lucide-undo-2"
            size="xs"
            variant="ghost"
            color="neutral"
            :disabled="!canUndo"
            @click="undo"
          />
          <UButton
            v-if="isEditable"
            icon="i-lucide-redo-2"
            size="xs"
            variant="ghost"
            color="neutral"
            :disabled="!canRedo"
            @click="redo"
          />

          <!-- Status transitions -->
          <UButton
            v-for="status in availableTransitions"
            :key="status"
            :label="status === 'active' ? 'Activate' : status.charAt(0).toUpperCase() + status.slice(1)"
            size="xs"
            :color="status === 'active' ? 'success' : status === 'paused' ? 'warning' : 'neutral'"
            variant="outline"
            @click="handleStatusChange(status)"
          />

          <UButton
            v-if="isEditable"
            icon="i-lucide-save"
            label="Save"
            size="xs"
            :loading="saving"
            @click="handleSave"
          />

          <UDropdownMenu
            :content="{
              align: 'end',
              side: 'bottom',
              sideOffset: 12
            }"
            :items="[
              { label: 'Delete Journey', icon: 'i-lucide-trash-2', onSelect() { showDeleteConfirm = true } }
            ]"
          >
            <UButton
              icon="i-lucide-more-horizontal"
              variant="ghost"
              color="neutral"
              size="xs"
            />
          </UDropdownMenu>
        </div>
      </div>
    </div>

    <!-- Builder area -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Node palette (only in draft) -->
      <div
        v-if="isEditable"
        class="fixed inset-y-1/4 left-4 z-10 w-52 p-3 overflow-y-auto shrink-0 bg-white dark:bg-zinc-900/50 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm"
      >
        <JourneyNodePalette @add="addNode" />
      </div>

      <!-- Canvas -->
      <div
        class="flex-1 relative"
        @drop="isEditable ? onDrop($event) : undefined"
        @dragover="isEditable ? onDragOver($event) : undefined"
      >
        <div
          v-if="loading"
          class="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="w-8 h-8 text-zinc-400 animate-spin"
          />
        </div>

        <VueFlow
          v-else
          :nodes="nodes"
          :edges="edges"
          :nodes-draggable="isEditable"
          :nodes-connectable="isEditable"
          :edges-updatable="isEditable"
          class="bg-zinc-50 dark:bg-zinc-950"
          @node-drag-start="pushSnapshot"
          @node-click="onNodeClick"
          @pane-click="onPaneClick"
        >
          <template #node-journey="nodeProps">
            <JourneyNode
              :id="nodeProps.id"
              :data="nodeProps.data"
              :selected="nodeProps.id === selectedNodeId"
            />
          </template>

          <Background
            pattern-color="#e4e4e7"
            :gap="20"
          />
          <Controls />
          <MiniMap />
        </VueFlow>
      </div>

      <!-- Config panel -->
      <JourneyNodeConfigPanel
        v-if="selectedNode && isEditable"
        :node-id="selectedNode.id"
        :node-type="selectedNode.data.type"
        :label="selectedNode.data.label"
        :config="selectedNode.data.config"
        @update="updateNodeConfig"
        @update-label="updateNodeLabel"
        @delete="deleteSelectedNode"
        @close="selectedNodeId = null"
      />

      <!-- Read-only info panel -->
      <div
        v-else-if="selectedNode && !isEditable"
        class="w-72 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
      >
        <h3 class="font-semibold text-sm mb-2">
          {{ selectedNode.data.label }}
        </h3>
        <pre class="text-xs text-zinc-500 whitespace-pre-wrap">{{ JSON.stringify(selectedNode.data.config, null, 2) }}</pre>
      </div>
    </div>

    <!-- Delete dialog -->
    <JourneyConfirmDialog
      v-model:open="showDeleteConfirm"
      title="Delete Journey"
      :description="`Are you sure you want to delete '${journey?.name}'? This will remove all enrollments and execution history.`"
      confirm-label="Delete"
      :loading="deleting"
      @confirm="handleDelete"
    />
  </div>
</template>
