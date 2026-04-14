<script setup lang="ts">
import type { JourneyNodeType } from '~~/shared/types/journey'
import { NODE_TYPE_LABELS, NODE_TYPE_ICONS, NODE_TYPE_COLORS } from '~~/shared/types/journey'

const emit = defineEmits<{
  add: [type: JourneyNodeType]
}>()

const actionNodes: JourneyNodeType[] = ['action_email', 'action_push', 'action_banner', 'action_webhook']
const logicNodes: JourneyNodeType[] = ['condition', 'delay', 'split']

function onDragStart(event: DragEvent, type: JourneyNodeType) {
  event.dataTransfer?.setData('application/journey-node', type)
  event.dataTransfer!.effectAllowed = 'move'
}
</script>

<template>
  <div class="space-y-3">
    <p class="text-xs font-semibold uppercase tracking-wider text-zinc-400">
      Actions
    </p>
    <div class="space-y-1">
      <button
        v-for="type in actionNodes"
        :key="type"
        class="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-grab active:cursor-grabbing"
        draggable="true"
        @dragstart="onDragStart($event, type)"
        @click="emit('add', type)"
      >
        <UIcon
          :name="NODE_TYPE_ICONS[type]"
          class="w-4 h-4 shrink-0"
          :class="`text-${NODE_TYPE_COLORS[type]}-500`"
        />
        <span class="text-zinc-700 dark:text-zinc-300">{{ NODE_TYPE_LABELS[type] }}</span>
      </button>
    </div>

    <p class="text-xs font-semibold uppercase tracking-wider text-zinc-400 pt-2">
      Logic
    </p>
    <div class="space-y-1">
      <button
        v-for="type in logicNodes"
        :key="type"
        class="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-grab active:cursor-grabbing"
        draggable="true"
        @dragstart="onDragStart($event, type)"
        @click="emit('add', type)"
      >
        <UIcon
          :name="NODE_TYPE_ICONS[type]"
          class="w-4 h-4 shrink-0"
          :class="`text-${NODE_TYPE_COLORS[type]}-500`"
        />
        <span class="text-zinc-700 dark:text-zinc-300">{{ NODE_TYPE_LABELS[type] }}</span>
      </button>
    </div>
  </div>
</template>
