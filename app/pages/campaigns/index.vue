<script setup lang="ts">
import type { Campaign } from '~~/shared/types/campaign'

definePageMeta({ layout: 'default' })

const router = useRouter()
const { campaigns, total, loading, filters, refresh, updateFilters } = useCampaigns()
const { deleteCampaign, cloneCampaign } = useCampaign()

const selected = ref<string[]>([])
const deleteTarget = ref<Campaign | null>(null)
const deleting = ref(false)

const totalPages = computed(() => Math.ceil(total.value / filters.limit))

function toggleSelect(id: string) {
  const idx = selected.value.indexOf(id)
  if (idx >= 0) selected.value.splice(idx, 1)
  else selected.value.push(id)
}

function toggleAll() {
  if (selected.value.length === campaigns.value.length) {
    selected.value = []
  } else {
    selected.value = campaigns.value.map(c => c.id)
  }
}

async function onBulkAction(action: 'pause' | 'resume' | 'archive') {
  await $fetch('/api/campaigns/bulk', {
    method: 'PATCH',
    body: { ids: selected.value, action }
  })
  selected.value = []
  refresh()
}

async function onDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await deleteCampaign(deleteTarget.value.id)
    deleteTarget.value = null
    refresh()
  } finally {
    deleting.value = false
  }
}

async function onClone(id: string) {
  await cloneCampaign(id)
  refresh()
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getRowActions(campaign: Campaign) {
  return [
    { label: 'View', icon: 'i-lucide-eye', onSelect() { router.push(`/campaigns/${campaign.id}`) } },
    { label: 'Clone', icon: 'i-lucide-copy', onSelect() { onClone(campaign.id) } },
    { type: 'separator' as const },
    { label: 'Delete', icon: 'i-lucide-trash-2', onSelect() { deleteTarget.value = campaign } }
  ]
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">
          Campaigns
        </h1>
        <p class="text-sm text-zinc-500 mt-1">
          Manage your banner campaigns across KG Media properties
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        label="New Campaign"
        color="primary"
        to="/campaigns/create"
      />
    </div>

    <!-- Filters -->
    <CampaignFilters
      :current-status="filters.status"
      :search="filters.search"
      @update:status="updateFilters({ status: $event })"
      @update:search="updateFilters({ search: $event })"
    />

    <!-- Bulk actions -->
    <CampaignBulkActionToolbar
      v-if="selected.length > 0"
      :count="selected.length"
      @action="onBulkAction"
      @clear="selected = []"
    />

    <!-- Table -->
    <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
      <table class="w-full text-sm">
        <thead class="bg-zinc-50 dark:bg-zinc-800/50">
          <tr>
            <th class="w-10 px-4 py-3">
              <input
                type="checkbox"
                :checked="selected.length === campaigns.length && campaigns.length > 0"
                :indeterminate="selected.length > 0 && selected.length < campaigns.length"
                class="rounded border-zinc-300"
                @change="toggleAll"
              >
            </th>
            <th class="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
              Name
            </th>
            <th class="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
              Status
            </th>
            <th class="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
              Priority
            </th>
            <th class="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
              Date Range
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
        <tbody v-else-if="campaigns.length === 0">
          <tr>
            <td
              colspan="7"
              class="px-4 py-16 text-center"
            >
              <UIcon
                name="i-lucide-megaphone"
                class="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-700"
              />
              <p class="text-zinc-600 dark:text-zinc-400 font-medium">
                No campaigns yet
              </p>
              <p class="text-sm text-zinc-400 mt-1 mb-4">
                Create your first campaign to get started
              </p>
              <UButton
                to="/campaigns/create"
                label="Create Campaign"
                color="primary"
                size="sm"
              />
            </td>
          </tr>
        </tbody>
        <tbody
          v-else
          class="divide-y divide-zinc-100 dark:divide-zinc-800"
        >
          <tr
            v-for="campaign in campaigns"
            :key="campaign.id"
            class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <td class="px-4 py-3">
              <input
                type="checkbox"
                :checked="selected.includes(campaign.id)"
                class="rounded border-zinc-300"
                @change="toggleSelect(campaign.id)"
              >
            </td>
            <td class="px-4 py-3">
              <NuxtLink
                :to="`/campaigns/${campaign.id}`"
                class="font-medium text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                {{ campaign.name }}
              </NuxtLink>
            </td>
            <td class="px-4 py-3">
              <CampaignStatusBadge :status="campaign.status" />
            </td>
            <td class="px-4 py-3 capitalize text-zinc-600 dark:text-zinc-400">
              {{ campaign.priority }}
            </td>
            <td class="px-4 py-3 text-zinc-600 dark:text-zinc-400">
              {{ formatDate(campaign.startDate) }} — {{ formatDate(campaign.endDate) }}
            </td>
            <td class="px-4 py-3 text-zinc-500">
              {{ formatDate(campaign.updatedAt) }}
            </td>
            <td class="px-4 py-3">
              <UDropdownMenu :items="getRowActions(campaign)">
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

    <!-- Delete dialog -->
    <CampaignConfirmDialog
      :open="!!deleteTarget"
      title="Delete Campaign"
      :description="`Are you sure you want to delete '${deleteTarget?.name}'? This action cannot be undone.`"
      confirm-label="Delete"
      confirm-color="error"
      :loading="deleting"
      @update:open="deleteTarget = null"
      @confirm="onDelete"
    />
  </div>
</template>
