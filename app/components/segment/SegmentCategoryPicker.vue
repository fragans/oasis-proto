<script setup lang="ts">
import type { StandardSegmentCategory } from '~~/shared/types/contact'

const model = defineModel<StandardSegmentCategory | null>({ default: null })

const categories = [
  { value: 'attributes' as const, label: 'Attributes', description: 'Target users based on their attributes', icon: 'i-lucide-user' },
  { value: 'events' as const, label: 'Events', description: 'Target users based on performed events', icon: 'i-lucide-zap' },
  { value: 'device' as const, label: 'Device Attributes', description: 'Target by device model, OS, app version', icon: 'i-lucide-smartphone' },
  { value: 'location' as const, label: 'Location', description: 'Target by IP address location', icon: 'i-lucide-map-pin' }
]
</script>

<template>
  <div class="grid grid-cols-2 gap-2">
    <button
      v-for="cat in categories"
      :key="cat.value"
      type="button"
      class="flex items-start gap-3 p-3 rounded-lg border text-left text-sm transition-all"
      :class="model === cat.value
        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'"
      @click="model = cat.value"
    >
      <UIcon
        :name="cat.icon"
        class="w-5 h-5 mt-0.5 text-indigo-500 shrink-0"
      />
      <div>
        <div class="font-medium text-zinc-900 dark:text-white">
          {{ cat.label }}
        </div>
        <div class="text-xs text-zinc-500 mt-0.5">
          {{ cat.description }}
        </div>
      </div>
    </button>
  </div>
</template>
