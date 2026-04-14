<script setup lang="ts">
import type { Segment } from '~~/shared/types/contact'

definePageMeta({ layout: 'default' })

const router = useRouter()
const { segments, total, loading, filters, refresh, updateFilters, deleteSegment } = useSegments()
const showCreate = ref(false)
const deleteTarget = ref<Segment | null>(null)
const deleting = ref(false)
const saving = ref(false)

const totalPages = computed(() => Math.ceil(total.value / filters.limit))

const form = reactive({
  name: '',
  description: '',
  type: 'static' as 'static' | 'dynamic',
  tags: ''
})

async function onCreate() {
  saving.value = true
  try {
    const created = await $fetch<Segment>('/api/segments', {
      method: 'POST',
      body: {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : []
      }
    })
    showCreate.value = false
    Object.assign(form, { name: '', description: '', type: 'static', tags: '' })
    router.push(`/audiences/segments/${created.id}`)
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await deleteSegment(deleteTarget.value.id)
    deleteTarget.value = null
    refresh()
  } finally {
    deleting.value = false
  }
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">
          Segments
        </h1>
        <p class="text-sm text-zinc-500 mt-1">
          Group contacts into targetable audiences
        </p>
      </div>
      <UButton icon="i-lucide-plus" label="New Segment" color="primary" @click="showCreate = true" />
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="flex gap-1.5">
        <UButton
          v-for="t in [{ label: 'All', value: '' }, { label: 'Static', value: 'static' }, { label: 'Dynamic', value: 'dynamic' }]"
          :key="t.value"
          :label="t.label"
          size="sm"
          :variant="filters.type === t.value ? 'solid' : 'ghost'"
          :color="filters.type === t.value ? 'primary' : 'neutral'"
          @click="updateFilters({ type: t.value as any })"
        />
      </div>
      <div class="flex-1 sm:max-w-xs ml-auto">
        <UInput
          :model-value="filters.search"
          icon="i-lucide-search"
          placeholder="Search segments..."
          size="sm"
          @update:model-value="updateFilters({ search: $event as string })"
        />
      </div>
    </div>

    <!-- List -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
    </div>

    <div v-else-if="segments.length === 0" class="text-center py-16 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900">
      <UIcon name="i-lucide-layers" class="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
      <p class="text-zinc-600 dark:text-zinc-400 font-medium">
        No segments yet
      </p>
      <p class="text-sm text-zinc-400 mt-1 mb-4">
        Create your first segment to target specific audiences
      </p>
      <UButton label="Create Segment" color="primary" size="sm" @click="showCreate = true" />
    </div>

    <div v-else class="space-y-3">
      <NuxtLink
        v-for="segment in segments"
        :key="segment.id"
        :to="`/audiences/segments/${segment.id}`"
        class="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
      >
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            :class="segment.type === 'dynamic' ? 'bg-violet-50 dark:bg-violet-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20'"
          >
            <UIcon
              :name="segment.type === 'dynamic' ? 'i-lucide-sparkles' : 'i-lucide-layers'"
              :class="segment.type === 'dynamic' ? 'text-violet-500' : 'text-indigo-500'"
              class="w-5 h-5"
            />
          </div>
          <div>
            <p class="font-medium text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {{ segment.name }}
            </p>
            <p class="text-sm text-zinc-500">
              {{ segment.contactCount.toLocaleString() }} contacts &middot;
              <UBadge :color="segment.type === 'dynamic' ? 'warning' : 'info'" variant="subtle" size="xs">{{ segment.type }}</UBadge>
              <span v-if="segment.tags.length > 0">
                &middot;
                <span v-for="(tag, idx) in segment.tags.slice(0, 3)" :key="tag">
                  {{ tag }}{{ idx < Math.min(segment.tags.length, 3) - 1 ? ', ' : '' }}
                </span>
              </span>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-zinc-400">{{ formatDate(segment.updatedAt) }}</span>
          <UButton
            icon="i-lucide-trash-2"
            variant="ghost"
            color="error"
            size="xs"
            @click.prevent="deleteTarget = segment"
          />
        </div>
      </NuxtLink>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between">
      <p class="text-sm text-zinc-500">
        Showing {{ (filters.page - 1) * filters.limit + 1 }}–{{ Math.min(filters.page * filters.limit, total) }} of {{ total }}
      </p>
      <UPagination v-model="filters.page" :total="total" :items-per-page="filters.limit" />
    </div>

    <!-- Create Modal -->
    <UModal :open="showCreate" @update:open="showCreate = $event">
      <template #header>
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">
          Create Segment
        </h3>
      </template>
      <template #body>
        <form class="space-y-4" @submit.prevent="onCreate">
          <UFormField label="Name">
            <UInput v-model="form.name" placeholder="VIP Subscribers" />
          </UFormField>
          <UFormField label="Description">
            <UInput v-model="form.description" placeholder="Optional description" />
          </UFormField>
          <UFormField label="Type">
            <div class="flex gap-2">
              <UButton
                label="Static"
                size="sm"
                :variant="form.type === 'static' ? 'solid' : 'outline'"
                :color="form.type === 'static' ? 'primary' : 'neutral'"
                @click="form.type = 'static'"
              />
              <UButton
                label="Dynamic"
                size="sm"
                :variant="form.type === 'dynamic' ? 'solid' : 'outline'"
                :color="form.type === 'dynamic' ? 'primary' : 'neutral'"
                @click="form.type = 'dynamic'"
              />
            </div>
          </UFormField>
          <UFormField label="Tags" hint="Comma-separated">
            <UInput v-model="form.tags" placeholder="premium, newsletter" />
          </UFormField>
        </form>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" label="Cancel" @click="showCreate = false" />
          <UButton label="Create" color="primary" :loading="saving" @click="onCreate" />
        </div>
      </template>
    </UModal>

    <!-- Delete dialog -->
    <CampaignConfirmDialog
      :open="!!deleteTarget"
      title="Delete Segment"
      :description="`Delete '${deleteTarget?.name}'? This will remove all contact memberships.`"
      confirm-label="Delete"
      confirm-color="error"
      :loading="deleting"
      @update:open="deleteTarget = null"
      @confirm="onDelete"
    />
  </div>
</template>
