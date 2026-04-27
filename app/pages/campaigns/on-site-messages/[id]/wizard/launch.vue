<script setup lang="ts">
import { STATUS_TRANSITIONS } from '~~/shared/types/campaign'
import type { CampaignStatus } from '~~/shared/types/campaign'
import type { ButtonProps } from '@nuxt/ui'

definePageMeta({ layout: 'wizard' })

const route = useRoute()
const router = useRouter()
const campaignId = route.params.id as string

const { campaign, patch, saving } = useWizardDraft(campaignId)
const toast = useToast()

const startDate = ref('')
const endDate = ref('')
const isTestMode = ref(true)
const status = ref<CampaignStatus>('draft')

// Sync from campaign data
const initialized = ref(false)
// Sync from campaign data only once
watch(campaign, (val) => {
  if (val && !initialized.value) {
    if (val.startDate) {
      startDate.value = new Date(val.startDate).toISOString().slice(0, 16)
    }
    if (val.endDate) {
      endDate.value = new Date(val.endDate).toISOString().slice(0, 16)
    }
    isTestMode.value = val.isTestMode
    status.value = val.status
    initialized.value = true
  }
}, { immediate: true })

const { changeStatus } = useCampaign()

const statusOptionsMap = {
  draft: {
    label: 'Draft',
    description: 'Keep as a draft to edit later. It won\'t be visible to users.',
    icon: 'i-lucide-file-edit',
    color: 'neutral'
  },
  active: {
    label: 'Active',
    description: 'Launch immediately. It will be live on your site.',
    icon: 'i-lucide-play-circle',
    color: 'success'
  },
  scheduled: {
    label: 'Scheduled',
    description: 'Launch automatically at the specified start date.',
    icon: 'i-lucide-clock',
    color: 'warning'
  },
  paused: {
    label: 'Paused',
    description: 'Temporarily stop the campaign. It won\'t be visible to users.',
    icon: 'i-lucide-pause-circle',
    color: 'error'
  },
  completed: {
    label: 'Completed',
    description: 'Mark the campaign as finished. It won\'t be visible to users.',
    icon: 'i-lucide-check-circle',
    color: 'info'
  }
}

const availableOptions = computed(() => {
  if (!campaign.value) return []
  const current = campaign.value.status
  const transitions = STATUS_TRANSITIONS[current] || []
  const options = [current, ...transitions]

  return options.map(s => ({
    value: s,
    ...statusOptionsMap[s as keyof typeof statusOptionsMap]
  }))
})

const nextButtonLabel = computed(() => {
  if (status.value === 'active') return 'Launch Campaign'
  if (status.value === 'scheduled') return 'Schedule Campaign'
  return 'Finish'
})

async function handleNext() {
  try {
    // 1. Update general campaign data
    await patch({
      startDate: startDate.value ? new Date(startDate.value).toISOString() : null,
      endDate: endDate.value ? new Date(endDate.value).toISOString() : null,
      isTestMode: isTestMode.value
    })

    // 2. Handle status change if needed
    if (status.value !== campaign.value?.status) {
      await changeStatus(campaignId, status.value)
    }

    toast.add({
      title: 'Campaign Saved',
      description: status.value === 'active' ? 'Your campaign is now live!' : 'Your changes have been saved.',
      color: 'success'
    })

    router.push('/campaigns/on-site-messages')
  } catch (err: unknown) {
    toast.add({
      title: 'Save Failed',
      description: JSON.stringify(err),
      color: 'error'
    })
  }
}
</script>

<template>
  <div class="space-y-8 max-w-2xl mx-auto pb-32">
    <div class="space-y-1">
      <h2 class="text-2xl font-bold text-zinc-900 dark:text-white">
        Review & Launch
      </h2>
      <p class="text-zinc-500">
        Set the duration for your campaign and prepare for launch.
      </p>
    </div>

    <div class="space-y-6">
      <div class="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UFormField
            label="Start Date (Optional)"
            description="When should this message begin?"
          >
            <UInput
              v-model="startDate"
              type="datetime-local"
              size="lg"
            />
          </UFormField>
          <UFormField
            label="End Date (Optional)"
            description="When should this message stop?"
          >
            <UInput
              v-model="endDate"
              type="datetime-local"
              size="lg"
            />
          </UFormField>
        </div>

        <div class="pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <div class="space-y-4">
            <div class="space-y-1">
              <h3 class="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                Campaign Status
              </h3>
              <p class="text-sm text-zinc-500">
                Current: <span class="font-bold capitalize">{{ campaign?.status }}</span>. Choose to transition to a new state.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <UButton
                v-for="opt in availableOptions"
                :key="opt.value"
                type="button"
                block
                :color="opt.color as ButtonProps['color']"
                :variant="status === opt.value ? 'soft' : 'ghost'"
                :active="status === opt.value"
                :ui="{
                  base: 'relative text-left rounded-2xl p-4 flex flex-col gap-3 items-start h-auto transition-all ring-inset'
                }"
                @click="status = opt.value as CampaignStatus"
              >
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                  :class="status === opt.value
                    ? 'bg-current/15'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'"
                >
                  <UIcon
                    :name="opt.icon"
                    class="w-5 h-5"
                  />
                </div>

                <div>
                  <div class="flex items-center gap-2">
                    <p class="font-bold text-sm">
                      {{ opt.label }}
                    </p>
                    <UBadge
                      v-if="opt.value === campaign?.status"
                      variant="subtle"
                      size="xs"
                      color="neutral"
                    >
                      Current
                    </UBadge>
                  </div>
                  <p class="text-xs mt-1 leading-snug opacity-60">
                    {{ opt.description }}
                  </p>
                </div>

                <!-- Selected check -->
                <UIcon
                  v-if="status === opt.value"
                  name="i-lucide-check-circle-2"
                  class="w-5 h-5 absolute top-4 right-4"
                />
              </UButton>
            </div>
          </div>
        </div>

        <div class="pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <div class="flex items-start gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <UCheckbox
              id="test-mode"
              v-model="isTestMode"
              class="mt-1"
            />
            <div class="flex-1">
              <label
                for="test-mode"
                class="block font-bold text-amber-900 dark:text-amber-200 cursor-pointer"
              >
                Enable Test Mode
              </label>
              <p class="text-sm text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                If enabled, this message will only be visible to users with the <code class="bg-amber-100 dark:bg-amber-900 px-1 rounded text-xs font-mono">oasis_test=1</code> cookie. Use this for QA before going live.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Card -->
      <UCard>
        <h3 class="font-bold text-zinc-400 uppercase tracking-widest text-xs">
          Campaign Summary
        </h3>
        <div class="grid grid-cols-2 gap-y-4 gap-x-8">
          <div>
            <p class="text-xs text-zinc-500 uppercase font-medium">
              Name
            </p>
            <p class="font-bold truncate">
              {{ campaign?.name }}
            </p>
          </div>
          <div>
            <p class="text-xs text-zinc-500 uppercase font-medium">
              Type
            </p>
            <p class="font-bold uppercase text-xs tracking-wide">
              {{ campaign?.campaignType }}
            </p>
          </div>
          <div>
            <p class="text-xs text-zinc-500 uppercase font-medium">
              Targeting
            </p>
            <p class="font-bold">
              {{ campaign?.targeting?.rules?.length || 0 }} rules
            </p>
          </div>
          <div>
            <p class="text-xs text-zinc-500 uppercase font-medium">
              Goal
            </p>
            <p class="font-bold capitalize">
              {{ campaign?.goal?.type || 'Not set' }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <CampaignWizardFooter
      :saving="saving"
      can-continue
      :next-label="nextButtonLabel"
      next-icon="i-lucide-check"
      @next="handleNext"
      @back="router.back()"
    />
  </div>
</template>
