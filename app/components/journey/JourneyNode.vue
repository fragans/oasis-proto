<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { JourneyNodeType } from '~~/shared/types/journey'
import { NODE_TYPE_LABELS, NODE_TYPE_ICONS, NODE_TYPE_COLORS } from '~~/shared/types/journey'

const props = defineProps<{
  id: string
  data: {
    type: JourneyNodeType
    label: string
    config: Record<string, unknown>
  }
  selected?: boolean
}>()

const borderColor = computed(() => {
  const color = NODE_TYPE_COLORS[props.data.type]
  return props.selected
    ? `border-${color}-500 ring-2 ring-${color}-200 dark:ring-${color}-800`
    : `border-${color}-200 dark:border-${color}-800 hover:border-${color}-400`
})

const bgColor = computed(() => {
  const color = NODE_TYPE_COLORS[props.data.type]
  return `bg-${color}-50 dark:bg-${color}-950/30`
})

const configSummary = computed(() => {
  const c = props.data.config
  switch (props.data.type) {
    case 'action_email': return (c.subject as string) || 'No subject'
    case 'action_push': return (c.title as string) || 'No title'
    case 'action_webhook': return (c.url as string) || 'No URL'
    case 'delay': {
      const d = c.duration as { value: number, unit: string } | undefined
      if (d) return `Wait ${d.value} ${d.unit}`
      return 'Configure delay'
    }
    case 'condition': return (c.field as string) || 'Configure condition'
    case 'split': {
      const v = c.variants as { label: string }[] | undefined
      if (v?.length) return v.map(x => x.label).join(' / ')
      return 'Configure split'
    }
    case 'trigger': return (c.eventKey as string) || 'Entry point'
    default: return ''
  }
})

const isConditionOrSplit = computed(() => props.data.type === 'condition' || props.data.type === 'split')
</script>

<template>
  <div
    class="rounded-xl border-2 transition-all shadow-sm w-56"
    :class="[borderColor, bgColor]"
  >
    <!-- Header -->
    <div class="flex items-center gap-2 px-3 py-2 border-b border-inherit">
      <UIcon
        :name="NODE_TYPE_ICONS[data.type]"
        class="w-4 h-4 shrink-0"
        :class="`text-${NODE_TYPE_COLORS[data.type]}-500`"
      />
      <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-200 truncate">
        {{ data.label || NODE_TYPE_LABELS[data.type] }}
      </span>
    </div>

    <!-- Body -->
    <div class="px-3 py-2">
      <p class="text-xs text-zinc-500 dark:text-zinc-400 truncate">
        {{ configSummary }}
      </p>
    </div>

    <!-- Handles -->
    <Handle
      v-if="data.type !== 'trigger'"
      type="target"
      :position="Position.Top"
      class="w-3 h-3 bg-zinc-400 border-2 border-white dark:border-zinc-900"
    />

    <Handle
      v-if="!isConditionOrSplit"
      type="source"
      :position="Position.Bottom"
      class="w-3 h-3 bg-indigo-500 border-2 border-white dark:border-zinc-900"
    />

    <!-- Condition/Split: Yes/No or variant handles -->
    <template v-if="data.type === 'condition'">
      <Handle
        id="yes"
        type="source"
        :position="Position.Bottom"
        class="w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-900 left-[30%]"
      />
      <Handle
        id="no"
        type="source"
        :position="Position.Bottom"
        class="w-3 h-3 bg-red-500 border-2 border-white dark:border-zinc-900 left-[70%]"
      />
    </template>

    <template v-if="data.type === 'split'">
      <Handle
        v-for="(variant, idx) in ((data.config.variants as { label: string }[]) || [{ label: 'A' }, { label: 'B' }])"
        :id="variant.label.toLowerCase().replace(/\s+/g, '_')"
        :key="variant.label"
        type="source"
        :position="Position.Bottom"
        class="w-3 h-3 bg-pink-500 border-2 border-white dark:border-zinc-900"
        :style="{ left: `${((idx + 1) / ((data.config.variants as any[])?.length || 2 + 1)) * 100}%` }"
      />
    </template>
  </div>
</template>
