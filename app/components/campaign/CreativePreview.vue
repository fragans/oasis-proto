<script setup lang="ts">
import type { Creative } from '~~/shared/types/campaign'

defineProps<{
  creative: Creative
}>()

function formatSize(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div class="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
    <div class="aspect-video bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
      <img
        :src="creative.fileUrl"
        :alt="creative.altText || creative.fileName"
        class="max-w-full max-h-full object-contain"
      >
    </div>
    <div class="p-3 space-y-1">
      <p class="text-sm font-medium text-zinc-900 dark:text-white truncate">
        {{ creative.fileName }}
      </p>
      <div class="flex items-center gap-3 text-xs text-zinc-500">
        <span v-if="creative.width && creative.height">{{ creative.width }}x{{ creative.height }}</span>
        <span>{{ formatSize(creative.fileSize) }}</span>
        <span v-if="creative.mimeType">{{ creative.mimeType }}</span>
      </div>
      <a
        v-if="creative.clickUrl"
        :href="creative.clickUrl"
        target="_blank"
        class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
      >
        {{ creative.clickUrl }}
      </a>
    </div>
  </div>
</template>
