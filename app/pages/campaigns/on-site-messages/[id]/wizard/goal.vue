<script setup lang="ts">
import type { CampaignGoal } from '~~/shared/types/campaign'

definePageMeta({ layout: 'wizard' })

const route = useRoute()
const router = useRouter()
const campaignId = route.params.id as string

const { campaign, patch, saving } = useWizardDraft(campaignId)

const type = ref<'click'>('click')
const selector = ref('[data-oasis-goal="click"]')
const destinationUrl = ref('')

// Sync from campaign data
watchEffect(() => {
  if (campaign.value) {
    if (campaign.value.goal) {
      type.value = campaign.value.goal.type
      selector.value = campaign.value.goal.selector
      destinationUrl.value = campaign.value.goal.destinationUrl || ''
    }
  }
})

async function handleNext() {
  const goal: CampaignGoal = {
    type: type.value,
    selector: selector.value,
    destinationUrl: destinationUrl.value || undefined
  }

  await patch({ goal })
  router.push(`/campaigns/on-site-messages/${campaignId}/wizard/launch`)
}
</script>

<template>
  <div class="space-y-8 max-w-2xl mx-auto">
    <div class="space-y-1">
      <h2 class="text-2xl font-bold text-zinc-900 dark:text-white">
        Define Your Goal
      </h2>
      <p class="text-zinc-500">
        Tell us what success looks like for this message. We'll track it automatically.
      </p>
    </div>

    <div class="space-y-6">
      <div class="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        <UFormField
          label="Goal Type"
          description="How should we measure engagement?"
        >
          <USelect
            v-model="type"
            :options="[{ label: 'Click on Element', value: 'click' }]"
            size="lg"
            disabled
          />
        </UFormField>

        <UFormField
          label="Target Element Selector"
          description="The CSS selector for the button or link that triggers the goal."
          required
        >
          <UInput
            v-model="selector"
            placeholder="e.g. .btn-primary, [data-oasis-cta]"
            size="lg"
            :ui="{ base: 'font-mono' }"
          />
          <template #help>
            Default is <code class="bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-xs">[data-oasis-goal="click"]</code> which is present in predefined templates.
          </template>
        </UFormField>

        <UFormField
          label="Destination URL (Optional)"
          description="If set, we'll automatically navigate the user here after tracking the click."
        >
          <UInput
            v-model="destinationUrl"
            placeholder="https://kompas.id/subscribe"
            size="lg"
            type="text"
          />
        </UFormField>
      </div>

      <div class="flex items-start gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
        <UIcon
          name="i-lucide-info"
          class="w-5 h-5 text-blue-500 shrink-0 mt-0.5"
        />
        <p class="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
          <strong>Pro Tip:</strong> You can test your goal tracking on your live site using the <code class="bg-blue-100 dark:bg-blue-900 px-1 rounded text-xs font-mono">oasis_test=1</code> cookie. Test Mode is enabled by default for all new campaigns.
        </p>
      </div>
    </div>

    <CampaignWizardFooter
      :saving="saving"
      :can-continue="!!selector"
      @next="handleNext"
      @back="router.back()"
    />
  </div>
</template>
