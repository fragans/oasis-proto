<script setup lang="ts">
import type { CampaignStatus } from '~~/shared/types/campaign'
import { PRIORITY_COLORS } from '~~/shared/types/campaign'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { fetchCampaign, updateCampaign, deleteCampaign, changeStatus, cloneCampaign } = useCampaign()

const id = route.params.id as string
const campaign = ref<Awaited<ReturnType<typeof fetchCampaign>> | null>(null)
const loading = ref(true)
const editing = ref(false)
const saving = ref(false)
const deleteDialogOpen = ref(false)
const deleting = ref(false)

const editForm = reactive({
  name: '',
  description: '',
  objective: '',
  priority: '' as string,
  startDate: '',
  endDate: ''
})

async function load() {
  loading.value = true
  try {
    campaign.value = await fetchCampaign(id)
  } catch {
    toast.add({ title: 'Message not found', color: 'error' })
    router.push('/campaigns/on-site-messages')
  } finally {
    loading.value = false
  }
}

function startEdit() {
  if (!campaign.value) return
  editForm.name = campaign.value.name
  editForm.description = campaign.value.description || ''
  editForm.objective = campaign.value.objective || ''
  editForm.priority = campaign.value.priority
  editForm.startDate = campaign.value.startDate ? new Date(campaign.value.startDate).toISOString().slice(0, 16) : ''
  editForm.endDate = campaign.value.endDate ? new Date(campaign.value.endDate).toISOString().slice(0, 16) : ''
  editing.value = true
}

async function saveEdit() {
  saving.value = true
  try {
    const data: Record<string, unknown> = {
      name: editForm.name,
      priority: editForm.priority
    }
    if (editForm.description) data.description = editForm.description
    if (editForm.objective) data.objective = editForm.objective
    if (editForm.startDate) data.startDate = new Date(editForm.startDate).toISOString()
    if (editForm.endDate) data.endDate = new Date(editForm.endDate).toISOString()

    await updateCampaign(id, data)
    editing.value = false
    await load()
    toast.add({ title: 'Message updated', color: 'success' })
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } }
    toast.add({ title: 'Error', description: fetchError.data?.message || 'Update failed', color: 'error' })
  } finally {
    saving.value = false
  }
}

async function onStatusChange(status: CampaignStatus) {
  try {
    await changeStatus(id, status)
    await load()
    toast.add({ title: `Message ${status}`, color: 'success' })
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } }
    toast.add({ title: 'Error', description: fetchError.data?.message || 'Status change failed', color: 'error' })
  }
}

async function onClone() {
  try {
    const cloned = await cloneCampaign(id)
    toast.add({ title: 'Message cloned', color: 'success' })
    if (cloned && typeof cloned === 'object' && 'id' in cloned) {
      router.push(`/campaigns/on-site-messages/${cloned.id}`)
    }
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } }
    toast.add({ title: 'Error', description: fetchError.data?.message || 'Clone failed', color: 'error' })
  }
}

async function onDelete() {
  deleting.value = true
  try {
    await deleteCampaign(id)
    toast.add({ title: 'Message deleted', color: 'success' })
    router.push('/campaigns/on-site-messages')
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } }
    toast.add({ title: 'Error', description: fetchError.data?.message || 'Delete failed', color: 'error' })
  } finally {
    deleting.value = false
  }
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' }
]

onMounted(load)
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Loading -->
    <div
      v-if="loading"
      class="space-y-4"
    >
      <div class="h-8 w-64 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
      <div class="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
    </div>

    <template v-else-if="campaign">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="neutral"
            size="sm"
            to="/campaigns/on-site-messages"
          />
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">
                {{ campaign.name }}
              </h1>
              <CampaignStatusBadge :status="campaign.status" />
            </div>
            <p
              v-if="campaign.objective"
              class="text-sm text-zinc-500 mt-1"
            >
              {{ campaign.objective }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <CampaignStatusTransitionButton
            :current-status="campaign.status"
            @transition="onStatusChange"
          />
          <UDropdownMenu
            :items="[
              { label: 'Edit', icon: 'i-lucide-pencil', onSelect: startEdit, disabled: !campaign.isEditable },
              { label: 'Clone', icon: 'i-lucide-copy', onSelect: onClone },
              { type: 'separator' },
              { label: 'Delete', icon: 'i-lucide-trash-2', onSelect: () => { deleteDialogOpen = true } }
            ]"
          >
            <UButton
              icon="i-lucide-more-horizontal"
              variant="ghost"
              color="neutral"
            />
          </UDropdownMenu>
        </div>
      </div>

      <!-- Edit Form -->
      <div
        v-if="editing"
        class="border border-indigo-200 dark:border-indigo-800 rounded-xl bg-white dark:bg-zinc-900 p-6 space-y-4"
      >
        <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
          Edit Message
        </h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Name</label>
            <UInput v-model="editForm.name" />
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Description</label>
            <UTextarea
              v-model="editForm.description"
              :rows="3"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Objective</label>
            <UInput v-model="editForm.objective" />
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Priority</label>
              <USelect
                v-model="editForm.priority"
                :items="priorityOptions"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Start Date</label>
              <UInput
                v-model="editForm.startDate"
                type="datetime-local"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">End Date</label>
              <UInput
                v-model="editForm.endDate"
                type="datetime-local"
              />
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <UButton
            variant="ghost"
            color="neutral"
            label="Cancel"
            @click="editing = false"
          />
          <UButton
            label="Save Changes"
            color="primary"
            :loading="saving"
            @click="saveEdit"
          />
        </div>
      </div>

      <!-- Campaign Info -->
      <div
        v-else
        class="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-6"
      >
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p class="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Priority
            </p>
            <UBadge
              :color="PRIORITY_COLORS[campaign.priority] ?? 'neutral'"
              variant="subtle"
              size="sm"
              class="mt-1.5 capitalize"
            >
              {{ campaign.priority }}
            </UBadge>
          </div>
          <div>
            <p class="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Start Date
            </p>
            <p class="text-sm text-zinc-900 dark:text-white mt-1.5">
              {{ formatDate(campaign.startDate) }}
            </p>
          </div>
          <div>
            <p class="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              End Date
            </p>
            <p class="text-sm text-zinc-900 dark:text-white mt-1.5">
              {{ formatDate(campaign.endDate) }}
            </p>
          </div>
          <div>
            <p class="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Days Remaining
            </p>
            <p class="text-sm text-zinc-900 dark:text-white mt-1.5">
              {{ campaign.daysRemaining ?? '—' }}
            </p>
          </div>
        </div>
        <div
          v-if="campaign.description"
          class="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800"
        >
          <p class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
            Description
          </p>
          <p class="text-sm text-zinc-700 dark:text-zinc-300">
            {{ campaign.description }}
          </p>
        </div>
      </div>

      <!-- Creatives -->
      <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-6">
        <h2 class="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          Creatives
        </h2>
        <div
          v-if="campaign.creatives && campaign.creatives.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <CampaignCreativePreview
            v-for="creative in campaign.creatives"
            :key="creative.id"
            :creative="creative"
          />
        </div>
        <div
          v-else
          class="text-center py-8"
        >
          <UIcon
            name="i-lucide-image"
            class="w-10 h-10 mx-auto mb-2 text-zinc-300 dark:text-zinc-700"
          />
          <p class="text-sm text-zinc-500">
            No creatives uploaded yet
          </p>
        </div>
      </div>

      <!-- Meta -->
      <div class="flex items-center justify-between text-xs text-zinc-400">
        <span>Created {{ formatDate(campaign.createdAt) }}</span>
        <span>Last updated {{ formatDate(campaign.updatedAt) }}</span>
      </div>
    </template>

    <!-- Delete dialog -->
    <CampaignConfirmDialog
      :open="deleteDialogOpen"
      title="Delete On Site Message"
      :description="`Are you sure you want to delete '${campaign?.name}'? This action cannot be undone.`"
      confirm-label="Delete"
      confirm-color="error"
      :loading="deleting"
      @update:open="deleteDialogOpen = $event"
      @confirm="onDelete"
    />
  </div>
</template>
