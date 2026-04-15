<script setup lang="ts">
definePageMeta({ layout: 'default' })

const router = useRouter()
const { createCampaign } = useCampaign()
const toast = useToast()

const submitting = ref(false)

const form = reactive({
  name: '',
  description: '',
  objective: '',
  priority: 'medium' as const,
  startDate: '',
  endDate: ''
})

const uploadedCreatives = ref<{ url: string, fileName: string, fileSize: number, mimeType: string }[]>([])

function onCreativeUploaded(creative: { url: string, fileName: string, fileSize: number, mimeType: string }) {
  uploadedCreatives.value.push(creative)
}

function removeCreative(index: number) {
  uploadedCreatives.value.splice(index, 1)
}

async function onSubmit(action: 'draft' | 'schedule') {
  submitting.value = true
  try {
    const data = {
      name: form.name,
      priority: form.priority,
      ...(form.description && { description: form.description }),
      ...(form.objective && { objective: form.objective }),
      ...(form.startDate && { startDate: new Date(form.startDate).toISOString() }),
      ...(form.endDate && { endDate: new Date(form.endDate).toISOString() })
    }

    const campaign = await createCampaign(data) as { id: string }

    // Add creatives to campaign
    if (uploadedCreatives.value.length > 0) {
      await Promise.all(uploadedCreatives.value.map(creative =>
        $fetch(`/api/campaigns/${campaign.id}/creatives`, {
          method: 'POST',
          body: {
            fileUrl: creative.url,
            fileName: creative.fileName,
            fileSize: creative.fileSize,
            mimeType: creative.mimeType
          }
        })
      ))
    }

    // If scheduling, transition status
    if (action === 'schedule' && form.startDate) {
      await $fetch(`/api/campaigns/${campaign.id}/status`, {
        method: 'PATCH',
        body: { status: 'scheduled' }
      })
    }

    toast.add({ title: 'Campaign created', color: 'success' })
    router.push(`/campaigns/${campaign.id}`)
  } catch (err) {
    console.log(err)
    toast.add({ title: 'Error', description: 'Failed to create campaign', color: 'error' })
  } finally {
    submitting.value = false
  }
}

const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' }
]
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-8">
    <!-- Header -->
    <div>
      <p class="text-sm text-zinc-500">
        Create a new banner campaign for KG Media properties
      </p>
    </div>

    <!-- Campaign Details -->
    <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-6 space-y-5">
      <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
        Campaign Details
      </h2>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Name *</label>
          <UInput
            v-model="form.name"
            placeholder="e.g. Summer Sale Banner"
            size="md"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Description</label>
          <UTextarea
            v-model="form.description"
            placeholder="Campaign description..."
            :rows="3"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Objective</label>
          <UInput
            v-model="form.objective"
            placeholder="e.g. Drive subscriptions to Kompas.id"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Priority</label>
            <USelect
              v-model="form.priority"
              :items="priorityOptions"
              size="md"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Start Date</label>
            <UInput
              v-model="form.startDate"
              type="datetime-local"
              size="md"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">End Date</label>
            <UInput
              v-model="form.endDate"
              type="datetime-local"
              size="md"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Creatives -->
    <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-6 space-y-5">
      <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
        Creatives
      </h2>

      <CampaignCreativeUploader @uploaded="onCreativeUploaded" />

      <div
        v-if="uploadedCreatives.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <div
          v-for="(creative, i) in uploadedCreatives"
          :key="i"
          class="relative"
        >
          <div class="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 flex items-center gap-3">
            <img
              :src="creative.url"
              :alt="creative.fileName"
              class="w-16 h-16 object-cover rounded"
            >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate text-zinc-900 dark:text-white">
                {{ creative.fileName }}
              </p>
              <p class="text-xs text-zinc-500">
                {{ creative.mimeType }}
              </p>
            </div>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="xs"
              @click="removeCreative(i)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-3 pb-8">
      <UButton
        variant="ghost"
        color="neutral"
        label="Cancel"
        to="/campaigns"
      />
      <UButton
        label="Save as Draft"
        color="neutral"
        variant="soft"
        :loading="submitting"
        :disabled="!form.name"
        @click="onSubmit('draft')"
      />
      <UButton
        label="Schedule"
        color="primary"
        icon="i-lucide-clock"
        :loading="submitting"
        :disabled="!form.name || !form.startDate"
        @click="onSubmit('schedule')"
      />
    </div>
  </div>
</template>
