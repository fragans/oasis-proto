<script setup lang="ts">
import type { TriggerMode, CampaignTrigger } from '~~/shared/types/campaign'

definePageMeta({ layout: 'wizard' })

const route = useRoute()
const router = useRouter()
const campaignId = route.params.id as string

const { campaign, patch, saving } = useWizardDraft(campaignId)

const mode = ref<TriggerMode>('immediate')
const value = ref<number>(30)

// Sync from campaign data
watchEffect(() => {
  if (campaign.value?.trigger) {
    mode.value = campaign.value.trigger.mode
    value.value = campaign.value.trigger.value ?? 30
  }
})

const triggerOptions = [
  {
    label: 'Immediate',
    description: 'Show as soon as the page loads and the element is found.',
    value: 'immediate',
    icon: 'i-lucide-zap'
  },
  {
    label: 'On Scroll',
    description: 'Wait until the user scrolls a certain percentage of the page.',
    value: 'scroll',
    icon: 'i-lucide-mouse-pointer-2'
  },
  {
    label: 'Exit Intent',
    description: 'Show when the user is about to leave the page.',
    value: 'exit-intent',
    icon: 'i-lucide-log-out'
  }
]

async function handleNext() {
  const trigger: CampaignTrigger = { mode: mode.value }
  if (mode.value === 'scroll') {
    trigger.value = value.value
  }

  await patch({ trigger })
  router.push(`/campaigns/on-site-messages/${campaignId}/wizard/goal`)
}
</script>

<template>
  <div class="space-y-8 max-w-3xl mx-auto">
    <div class="space-y-1">
      <h2 class="text-2xl font-bold text-zinc-900 dark:text-white">
        Choose a Trigger
      </h2>
      <p class="text-zinc-500">
        Decide exactly when your message should appear to the user.
      </p>
    </div>

    <div class="space-y-6">
      <div class="grid grid-cols-1 gap-4">
        <button
          v-for="opt in triggerOptions"
          :key="opt.value"
          type="button"
          class="relative text-left border rounded-2xl p-6 transition-all focus:outline-none flex items-center gap-6"
          :class="mode === opt.value
            ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/10 ring-2 ring-primary-500'
            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'"
          @click="mode = opt.value as TriggerMode"
        >
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            :class="mode === opt.value ? 'bg-primary-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'"
          >
            <UIcon
              :name="opt.icon"
              class="w-6 h-6"
            />
          </div>
          <div class="flex-1">
            <p class="font-bold text-zinc-900 dark:text-white">
              {{ opt.label }}
            </p>
            <p class="text-sm text-zinc-500 mt-1 leading-snug">
              {{ opt.description }}
            </p>
          </div>
          <UIcon
            v-if="mode === opt.value"
            name="i-lucide-check-circle-2"
            class="text-primary-500 w-6 h-6"
          />
        </button>
      </div>

      <div
        v-if="mode === 'scroll'"
        class="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-4 duration-300"
      >
        <div class="max-w-xs">
          <label class="block text-sm font-bold text-zinc-900 dark:text-white mb-2">
            Scroll Depth Percentage
          </label>
          <div class="flex items-center gap-4">
            <UInput
              v-model.number="value"
              type="number"
              :min="1"
              :max="100"
              size="xl"
              class="flex-1"
              :ui="{ base: 'text-lg font-bold' }"
            />
            <span class="text-2xl font-bold text-zinc-400">%</span>
          </div>
          <USlider
            v-model="value"
            :min="1"
            :max="100"
            class="mt-6"
          />
        </div>
      </div>
    </div>

    <CampaignWizardFooter
      :saving="saving"
      can-continue
      @next="handleNext"
      @back="router.back()"
    />
  </div>
</template>
