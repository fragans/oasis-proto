<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  confirmLabel?: string
  confirmColor?: 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'
  loading?: boolean
}>()

const emit = defineEmits<{
  confirm: []
}>()

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <UModal v-model:open="open">
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ title || 'Confirm' }}
      </h3>
    </template>

    <template #body>
      <p class="text-sm text-zinc-600 dark:text-zinc-400">
        {{ description || 'Are you sure?' }}
      </p>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          @click="open = false"
        >
          Cancel
        </UButton>
        <UButton
          :color="(confirmColor as any) || 'error'"
          :loading="loading"
          @click="emit('confirm')"
        >
          {{ confirmLabel || 'Confirm' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
