<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  select: [creative: { fileUrl: string }]
}>()

interface Creative {
  id: string
  fileUrl: string
}

const config = useRuntimeConfig()
const { data, status, refresh } = useAsyncData('creatives-picker', () => $fetch<{ creatives: Creative[] }>('/api/creatives', {
  query: { tenantId: config.public.defaultTenantId }
}))
const creatives = computed(() => data.value?.creatives || [])
const loading = computed(() => status.value === 'pending')

watch(open, (isOpen) => {
  if (isOpen) {
    refresh()
  }
})

function handleSelect(creative: Creative) {
  emit('select', creative)
  open.value = false
}
</script>

<template>
  <UModal v-model:open="open">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3 class="text-lg font-semibold">
          Select a Creative
        </h3>
        <UButton
          icon="i-lucide-refresh-cw"
          variant="ghost"
          color="neutral"
          size="sm"
          :loading="loading"
          @click="() => refresh()"
        />
      </div>
    </template>

    <template #body>
      <div
        v-if="loading"
        class="grid grid-cols-3 gap-4"
      >
        <div
          v-for="i in 6"
          :key="i"
          class="aspect-square bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg"
        />
      </div>
      <CreativeEmptyState v-else-if="creatives.length === 0" />
      <div
        v-else
        class="grid grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2"
      >
        <button
          v-for="creative in creatives"
          :key="creative.id"
          class="aspect-square rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500 transition-all group bg-zinc-50 dark:bg-zinc-800"
          @click="handleSelect(creative)"
        >
          <img
            :src="creative.fileUrl"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform"
          >
        </button>
      </div>
    </template>

    <template #footer>
      <UButton
        variant="ghost"
        color="neutral"
        @click="open = false"
      >
        Cancel
      </UButton>
    </template>
  </UModal>
</template>
