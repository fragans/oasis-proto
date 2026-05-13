<script setup lang="ts">
import type { Campaign } from '~~/shared/types/campaign'
import type { TableColumn } from '@nuxt/ui'

const route = useRoute()
const org = computed(() => route.params.org as string)

definePageMeta({ layout: 'default' })

const router = useRouter()
const { campaigns, total, loading, filters, refresh, updateFilters } = useCampaigns()
const { deleteCampaign, cloneCampaign } = useCampaign()
const { isAdmin: canEdit } = useRole()

const selected = ref<string[]>([])
const deleteTarget = ref<Campaign | null>(null)
const deleting = ref(false)

const selectedCampaign = ref<Campaign | null>(null)
const isDrawerOpen = ref(false)

function showDetails(campaign: Campaign) {
  selectedCampaign.value = campaign
  isDrawerOpen.value = true
}

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
  const actions = []

  if (canEdit.value) {
    actions.push(
      {
        label: 'Edit',
        icon: 'i-lucide-pencil',
        onSelect() {
          router.push(`/${org.value}/campaigns/on-site-messages/${campaign.id}/wizard/template`)
        }
      },
      {
        label: 'Clone',
        icon: 'i-lucide-copy',
        onSelect() {
          onClone(campaign.id)
        }
      },
      { type: 'separator' as const }
    )
  }

  actions.push({
    label: 'Details',
    icon: 'i-lucide-info',
    onSelect() {
      showDetails(campaign)
    }
  })

  if (canEdit.value) {
    actions.push({
      label: 'Delete',
      icon: 'i-lucide-trash-2',
      onSelect() {
        deleteTarget.value = campaign
      }
    })
  }

  return actions
}

const columns = computed(() => {
  const cols: TableColumn<Campaign>[] = [
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

  if (canEdit.value) {
    cols.unshift({
      id: 'select',
      meta: {
        class: {
          th: 'w-10'
        }
      }
    })
  }

  return cols
})

onMounted(() => {
  refresh()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">
          On Site Messages
        </h1>
        <p class="text-sm mt-1">
          Manage your banner campaigns across KG Media properties
        </p>
      </div>
      <UButton
        v-if="canEdit"
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
      v-if="canEdit && selected.length > 0"
      :count="selected.length"
      @action="onBulkAction"
      @clear="selected = []"
    />

    <!-- Table -->
    <UTable
      :data="campaigns"
      :columns="columns"
      :loading="loading"
      class="rounded-xl overflow-hidden"
      :ui="{
        td: 'px-4 py-3',
        th: 'px-4 py-3 text-left font-medium'
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
        <span
          v-if="!canEdit"
          class="font-medium cursor-pointer"
          @click="showDetails(row.original)"
        >
          {{ row.original.name }}
        </span>
        <NuxtLink
          v-else
          :to="`/${org}/campaigns/on-site-messages/${row.original.id}/wizard/template`"
          class="font-medium text-default"
        >
          {{ row.original.name }}
        </NuxtLink>
      </template>

      <template #status-cell="{ row }">
        <CampaignStatusBadge :status="row.original.status" />
      </template>

      <template #priority-cell="{ row }">
        <span class="capitalize">
          {{ row.original.priority }}
        </span>
      </template>

      <template #dateRange-cell="{ row }">
        <span>
          {{ formatDate(row.original.startDate) }} — {{ formatDate(row.original.endDate) }}
        </span>
      </template>

      <template #updatedAt-cell="{ row }">
        <span>
          {{ formatDate(row.original.updatedAt) }}
        </span>
      </template>

      <template #actions-cell="{ row }">
        <div class="flex items-center gap-1">
          <UButton
            icon="i-lucide-info"
            variant="ghost"
            color="neutral"
            size="xs"
            @click="showDetails(row.original)"
          />
          <UDropdownMenu :items="getRowActions(row.original)">
            <UButton
              icon="i-lucide-more-horizontal"
              variant="ghost"
              color="neutral"
              size="xs"
            />
          </UDropdownMenu>
        </div>
      </template>

      <template #empty>
        <div class="px-4 py-16 text-center">
          <UIcon
            name="i-lucide-megaphone"
            class="w-12 h-12 mx-auto mb-4"
          />
          <p class="font-medium">
            No messages yet
          </p>
          <p class="text-sm mt-1 mb-4">
            Create your first message to get started
          </p>
          <UButton
            v-if="canEdit"
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
      <p class="text-sm">
        Showing {{ (filters.page - 1) * filters.limit + 1 }}–{{ Math.min(filters.page * filters.limit, total) }} of {{
          total }}
      </p>
      <UPagination
        v-model:page="filters.page"
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
    <CampaignDetailDrawer
      v-model:open="isDrawerOpen"
      :campaign="selectedCampaign"
    />
  </div>
</template>
