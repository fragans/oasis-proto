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
const { data, status } = useFetch<{ creatives: Creative[] }>('/api/creatives', {
  query: { tenantId: config.public.defaultTenantId }
})
const creatives = computed(() => data.value?.creatives || [])
const loading = computed(() => status.value === 'pending')

function handleSelect(creative: Creative) {
  emit('select', creative)
  open.value = false
}
</script>

<template>
  <UModal v-model:open="open">
    <template #header>
      <h3 class="text-lg font-semibold">
        Select Creative
      </h3>
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
      <div
        v-else-if="creatives.length === 0"
        class="py-12 text-center text-zinc-500"
      >
        <UIcon
          name="i-lucide-image-off"
          class="w-12 h-12 mx-auto mb-3 opacity-20"
        />
        <p>No creatives found.</p>
        <p class="text-xs">
          Upload an image in a campaign first.
        </p>
      </div>
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
