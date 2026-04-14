<script setup lang="ts">
import type { Journey, JourneyStatus } from '~~/shared/types/journey'

definePageMeta({ layout: 'default' })

const router = useRouter()
const { journeys, total, loading, filters, refresh, updateFilters } = useJourneys()
const { deleteJourney } = useJourney()

const showCreate = ref(false)
const deleteTarget = ref<Journey | null>(null)
const deleting = ref(false)

const statusFilters: { label: string, value: JourneyStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
  { label: 'Archived', value: 'archived' }
]

const totalPages = computed(() => Math.ceil(total.value / filters.limit))

async function onDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await deleteJourney(deleteTarget.value.id)
    deleteTarget.value = null
    refresh()
  } finally {
    deleting.value = false
  }
}

function onCreated(journey: { id: string }) {
  router.push(`/journeys/${journey.id}`)
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getRowActions(journey: Journey) {
  return [
    { label: 'Open Builder', icon: 'i-lucide-pencil-ruler', onSelect() { router.push(`/journeys/${journey.id}`) } },
    { type: 'separator' as const },
    { label: 'Delete', icon: 'i-lucide-trash-2', onSelect() { deleteTarget.value = journey } }
  ]
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">
          Journeys
        </h1>
        <p class="text-sm text-zinc-500 mt-1">
          Multi-step, multi-channel campaign automation
        </p>
      </div>
      <div class="flex gap-2">
        <UButton
          icon="i-lucide-mail"
          label="Templates"
          variant="outline"
          color="neutral"
          to="/journeys/templates"
        />
        <UButton
          icon="i-lucide-plus"
          label="New Journey"
          color="primary"
          @click="showCreate = true"
        />
      </div>
    </div>

    <!-- Status filter chips -->
    <div class="flex items-center gap-2 flex-wrap">
      <UButton
        v-for="sf in statusFilters"
        :key="sf.value"
        :label="sf.label"
        size="sm"
        :variant="filters.status === sf.value ? 'solid' : 'outline'"
        :color="filters.status === sf.value ? 'primary' : 'neutral'"
        @click="updateFilters({ status: sf.value })"
      />
      <div class="flex-1" />
      <UInput
        :model-value="filters.search"
        placeholder="Search journeys..."
        icon="i-lucide-search"
        size="sm"
        class="w-64"
        @update:model-value="updateFilters({ search: String($event) })"
      />
    </div>

    <!-- Table -->
    <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
      <table class="w-full text-sm">
        <thead class="bg-zinc-50 dark:bg-zinc-800/50">
          <tr>
            <th class="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
              Name
            </th>
            <th class="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
              Status
            </th>
            <th class="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
              Trigger
            </th>
            <th class="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">
              Enrolled
            </th>
            <th class="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">
              Completed
            </th>
            <th class="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
              Updated
            </th>
            <th class="w-10 px-4 py-3" />
          </tr>
        </thead>

        <tbody
          v-if="loading"
          class="divide-y divide-zinc-100 dark:divide-zinc-800"
        >
          <tr
            v-for="i in 5"
            :key="i"
          >
            <td
              colspan="7"
              class="px-4 py-4"
            >
              <div class="h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            </td>
          </tr>
        </tbody>

        <tbody v-else-if="journeys.length === 0">
          <tr>
            <td
              colspan="7"
              class="px-4 py-16 text-center"
            >
              <UIcon
                name="i-lucide-route"
                class="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-700"
              />
              <p class="text-zinc-600 dark:text-zinc-400 font-medium">
                No journeys yet
              </p>
              <p class="text-sm text-zinc-400 mt-1 mb-4">
                Create your first journey to automate campaigns
              </p>
              <UButton
                label="Create Journey"
                color="primary"
                size="sm"
                @click="showCreate = true"
              />
            </td>
          </tr>
        </tbody>

        <tbody
          v-else
          class="divide-y divide-zinc-100 dark:divide-zinc-800"
        >
          <tr
            v-for="journey in journeys"
            :key="journey.id"
            class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <td class="px-4 py-3">
              <NuxtLink
                :to="`/journeys/${journey.id}`"
                class="font-medium text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                {{ journey.name }}
              </NuxtLink>
              <p
                v-if="journey.description"
                class="text-xs text-zinc-500 mt-0.5 truncate max-w-xs"
              >
                {{ journey.description }}
              </p>
            </td>
            <td class="px-4 py-3">
              <JourneyStatusBadge :status="journey.status" />
            </td>
            <td class="px-4 py-3 capitalize text-zinc-600 dark:text-zinc-400">
              {{ journey.triggerType }}
            </td>
            <td class="px-4 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
              {{ journey.enrollmentCount.toLocaleString() }}
            </td>
            <td class="px-4 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
              {{ journey.completedCount.toLocaleString() }}
            </td>
            <td class="px-4 py-3 text-zinc-500">
              {{ formatDate(journey.updatedAt) }}
            </td>
            <td class="px-4 py-3">
              <UDropdownMenu :items="getRowActions(journey)">
                <UButton
                  icon="i-lucide-more-horizontal"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                />
              </UDropdownMenu>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="flex items-center justify-between"
    >
      <p class="text-sm text-zinc-500">
        Showing {{ (filters.page - 1) * filters.limit + 1 }}–{{ Math.min(filters.page * filters.limit, total) }} of {{ total }}
      </p>
      <UPagination
        v-model="filters.page"
        :total="total"
        :items-per-page="filters.limit"
      />
    </div>

    <!-- Create modal -->
    <JourneyCreateModal
      v-model:open="showCreate"
      @created="onCreated"
    />

    <!-- Delete dialog -->
    <JourneyConfirmDialog
      :open="!!deleteTarget"
      title="Delete Journey"
      :description="`Are you sure you want to delete '${deleteTarget?.name}'? This action cannot be undone.`"
      confirm-label="Delete"
      :loading="deleting"
      @update:open="deleteTarget = null"
      @confirm="onDelete"
    />
  </div>
</template>
