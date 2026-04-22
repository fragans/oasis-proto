<script setup lang="ts">
interface Creative {
  id: string
  campaignId: string
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
  createdAt: string
}

const config = useRuntimeConfig()
const { data, status, refresh } = useFetch<{ creatives: Creative[] }>('/api/creatives', {
  query: { tenantId: config.public.defaultTenantId }
})
const creatives = computed(() => data.value?.creatives || [])
const loading = computed(() => status.value === 'pending')

function formatSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-zinc-900 dark:text-white">
          Creative Gallery
        </h1>
        <p class="text-zinc-500 mt-1">
          View and manage all image assets uploaded across your campaigns.
        </p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        variant="ghost"
        color="neutral"
        :loading="loading"
        @click="() => refresh()"
      />
    </div>

    <div
      v-if="loading && creatives.length === 0"
      class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6"
    >
      <div
        v-for="i in 12"
        :key="i"
        class="space-y-3"
      >
        <div class="aspect-square bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-2xl" />
        <div class="h-4 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded w-3/4" />
        <div class="h-3 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded w-1/2" />
      </div>
    </div>

    <div
      v-else-if="creatives.length === 0"
      class="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl"
    >
      <div class="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-6">
        <UIcon
          name="i-lucide-image-off"
          class="w-10 h-10 text-zinc-300"
        />
      </div>
      <h2 class="text-xl font-bold text-zinc-900 dark:text-white mb-2">
        No creatives yet
      </h2>
      <p class="text-zinc-500 max-w-sm">
        Creatives are automatically added here when you upload images during campaign creation.
      </p>
      <UButton
        to="/campaigns/on-site-messages"
        label="Go to Campaigns"
        class="mt-8"
        variant="outline"
      />
    </div>

    <div
      v-else
      class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6"
    >
      <div
        v-for="creative in creatives"
        :key="creative.id"
        class="group space-y-3"
      >
        <div class="aspect-square rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 relative shadow-sm hover:shadow-md transition-shadow">
          <img
            :src="creative.fileUrl"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          >
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <UButton
              icon="i-lucide-external-link"
              color="neutral"
              variant="solid"
              size="sm"
              :to="creative.fileUrl"
              target="_blank"
            />
          </div>
        </div>
        <div class="min-w-0">
          <p
            class="text-sm font-bold text-zinc-900 dark:text-white truncate"
            :title="creative.fileName"
          >
            {{ creative.fileName }}
          </p>
          <p class="text-xs text-zinc-500 flex items-center gap-2">
            <span>{{ formatSize(creative.fileSize) }}</span>
            <span class="w-1 h-1 rounded-full bg-zinc-300" />
            <span class="uppercase">{{ creative.mimeType.split('/')[1] }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
