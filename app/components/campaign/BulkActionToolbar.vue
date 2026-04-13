<script setup lang="ts">
defineProps<{
  count: number
}>()

const emit = defineEmits<{
  action: [action: 'pause' | 'resume' | 'archive']
  clear: []
}>()
</script>

<template>
  <div class="flex items-center gap-3 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded-lg">
    <span class="text-sm font-medium text-indigo-700 dark:text-indigo-300">
      {{ count }} selected
    </span>
    <div class="flex gap-1.5">
      <UButton size="xs" color="warning" variant="soft" icon="i-lucide-pause" label="Pause" @click="emit('action', 'pause')" />
      <UButton size="xs" color="primary" variant="soft" icon="i-lucide-play" label="Resume" @click="emit('action', 'resume')" />
      <UButton size="xs" color="neutral" variant="soft" icon="i-lucide-archive" label="Archive" @click="emit('action', 'archive')" />
    </div>
    <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-x" class="ml-auto" @click="emit('clear')" />
  </div>
</template>
