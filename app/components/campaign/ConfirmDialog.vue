<script setup lang="ts">
const props = defineProps<{
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  confirmColor?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'confirm': []
}>()
</script>

<template>
  <UModal
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <template #header>
      <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">
        {{ title }}
      </h3>
    </template>

    <template #body>
      <p
        v-if="description"
        class="text-sm text-zinc-600 dark:text-zinc-400"
      >
        {{ description }}
      </p>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          label="Cancel"
          @click="emit('update:open', false)"
        />
        <UButton
          :label="confirmLabel || 'Confirm'"
          :color="(confirmColor as any) || 'error'"
          :loading="loading"
          @click="emit('confirm')"
        />
      </div>
    </template>
  </UModal>
</template>
