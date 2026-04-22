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

const showCreateModal = ref(false)

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getRowActions(campaign: Campaign) {
  return [
    { label: 'Edit', icon: 'i-lucide-pencil', onSelect() { router.push(`/campaigns/on-site-messages/${campaign.id}/wizard/template`) } },
    { label: 'Clone', icon: 'i-lucide-copy', onSelect() { onClone(campaign.id) } },
    { type: 'separator' as const },
    { label: 'Delete', icon: 'i-lucide-trash-2', onSelect() { deleteTarget.value = campaign } }
  ]
}

const columns = [
  {
    id: 'select',
    meta: {
      class: {
        th: 'w-10'
      }
    }
  },
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'status',
    header: 'Status'
  },
  {
    accessorKey: 'priority',
    header: 'Priority'
  },
  {
    id: 'dateRange',
    header: 'Date Range'
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated'
  },
  {
    id: 'actions',
    meta: {
      class: {
        th: 'w-10'
      }
    }
  }
]
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">
          On Site Messages
        </h1>
        <p class="text-sm text-zinc-500 mt-1">
          Manage your banner campaigns across KG Media properties
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        label="New Message"
        color="primary"
        @click="showCreateModal = true"
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
    <UTable
      :data="campaigns"
      :columns="columns"
      :loading="loading"
      class="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden"
      :ui="{
        td: 'px-4 py-3',
        th: 'px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50'
      }"
    >
      <template #select-header>
        <UCheckbox
          :model-value="selected.length === campaigns.length && campaigns.length > 0"
          :indeterminate="selected.length > 0 && selected.length < campaigns.length"
          @update:model-value="toggleAll"
        />
      </template>

      <template #select-cell="{ row }">
        <UCheckbox
          :model-value="selected.includes(row.original.id)"
          @update:model-value="toggleSelect(row.original.id)"
        />
      </template>

      <template #name-cell="{ row }">
        <NuxtLink
          :to="`/campaigns/on-site-messages/${row.original.id}/wizard/template`"
          class="font-medium text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          {{ row.original.name }}
        </NuxtLink>
      </template>

      <template #status-cell="{ row }">
        <CampaignStatusBadge :status="row.original.status" />
      </template>

      <template #priority-cell="{ row }">
        <span class="capitalize text-zinc-600 dark:text-zinc-400">
          {{ row.original.priority }}
        </span>
      </template>

      <template #dateRange-cell="{ row }">
        <span class="text-zinc-600 dark:text-zinc-400">
          {{ formatDate(row.original.startDate) }} — {{ formatDate(row.original.endDate) }}
        </span>
      </template>

      <template #updatedAt-cell="{ row }">
        <span class="text-zinc-500">
          {{ formatDate(row.original.updatedAt) }}
        </span>
      </template>

      <template #actions-cell="{ row }">
        <UDropdownMenu :items="getRowActions(row.original)">
          <UButton
            icon="i-lucide-more-horizontal"
            variant="ghost"
            color="neutral"
            size="xs"
          />
        </UDropdownMenu>
      </template>

      <template #empty>
        <div class="px-4 py-16 text-center">
          <UIcon
            name="i-lucide-megaphone"
            class="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-700"
          />
          <p class="text-zinc-600 dark:text-zinc-400 font-medium">
            No messages yet
          </p>
          <p class="text-sm text-zinc-400 mt-1 mb-4">
            Create your first message to get started
          </p>
          <UButton
            label="Create Message"
            color="primary"
            size="sm"
            @click="showCreateModal = true"
          />
        </div>
      </template>
    </UTable>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="flex items-center justify-between"
    >
      <p class="text-sm text-zinc-500">
        Showing {{ (filters.page - 1) * filters.limit + 1 }}–{{ Math.min(filters.page * filters.limit, total) }} of {{
          total }}
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
      title="Delete Message"
      :description="`Are you sure you want to delete '${deleteTarget?.name}'? This action cannot be undone.`"
      confirm-label="Delete"
      confirm-color="error"
      :loading="deleting"
      @update:open="deleteTarget = null"
      @confirm="onDelete"
    />
    <CampaignOsmCreateNameModal v-model:open="showCreateModal" />
  </div>
</template>
