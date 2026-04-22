<script setup lang="ts">
import { CAMPAIGN_TEMPLATES } from '~~/shared/types/campaign'
import type { TemplateType, CampaignWithCreatives } from '~~/shared/types/campaign'

definePageMeta({ layout: 'wizard' })

const route = useRoute()
const router = useRouter()
const campaignId = route.params.id as string

const { campaign, patch, saving } = useWizardDraft(campaignId)

const selectedTemplate = ref<TemplateType | null>(null)
const selectedCreativeUrl = ref<string | null>(null)
const showCreativePicker = ref(false)

// Sync from campaign data only once when loaded
watch(campaign, (newCampaign) => {
  if (!newCampaign) return

  const tplType = newCampaign.templateType as TemplateType
  if (tplType && CAMPAIGN_TEMPLATES[tplType] && !selectedTemplate.value) {
    selectedTemplate.value = tplType
  }

  // Restore creative URL if it's the modal-with-cta-redirect template
  if (selectedTemplate.value === 'modal-with-cta-redirect' && !selectedCreativeUrl.value) {
    // 1. Try from creatives array (if it was uploaded/attached properly)
    const creatives = (newCampaign as CampaignWithCreatives).creatives
    if (creatives && creatives.length > 0) {
      selectedCreativeUrl.value = creatives[0]?.fileUrl || null
    // 2. Fallback: Parse from existing HTML if creatives array is empty
    } else if (newCampaign.html) {
      const match = newCampaign.html.match(/background-image: url\(['"]?(.*?)['"]?\)/)
      if (match && match[1] && match[1] !== '{{creativeUrl}}') {
        selectedCreativeUrl.value = match[1]
      }
    }
  }
}, { immediate: true })

const templateList = Object.entries(CAMPAIGN_TEMPLATES).map(([key, tpl]) => ({
  key: key as TemplateType,
  ...tpl
}))

const previewHtml = computed(() => {
  if (!selectedTemplate.value) return ''
  const tpl = CAMPAIGN_TEMPLATES[selectedTemplate.value]
  let html = tpl.defaults.html

  if (selectedTemplate.value === 'modal-with-cta-redirect' && selectedCreativeUrl.value) {
    html = html.replace('{{creativeUrl}}', selectedCreativeUrl.value)
  } else if (selectedTemplate.value === 'modal-with-cta-redirect') {
    // Placeholder if no creative selected yet
    html = html.replace('{{creativeUrl}}', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')
  }

  return html
})

function handleSelectTemplate(key: TemplateType) {
  selectedTemplate.value = key
  if (key !== 'modal-with-cta-redirect') {
    selectedCreativeUrl.value = null
  }
}

function handleSelectCreative(creative: { fileUrl: string }) {
  selectedCreativeUrl.value = creative.fileUrl
}

async function handleNext() {
  if (!selectedTemplate.value) return

  const tpl = CAMPAIGN_TEMPLATES[selectedTemplate.value]
  if (!tpl) return

  let html = tpl.defaults.html

  if (selectedTemplate.value === 'modal-with-cta-redirect') {
    const creativeUrl = selectedCreativeUrl.value || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
    html = html.replace('{{creativeUrl}}', creativeUrl)
  }

  await patch({
    templateType: selectedTemplate.value,
    campaignType: tpl.defaults.campaignType,
    elementSelector: tpl.defaults.elementSelector,
    html
  })

  router.push(`/campaigns/on-site-messages/${campaignId}/wizard/target`)
}
</script>

<template>
  <div class="space-y-8">
    <div class="space-y-1">
      <h2 class="text-2xl font-bold text-zinc-900 dark:text-white">
        Choose a Template
      </h2>
      <p class="text-zinc-500">
        Select the layout and style for your on-site message.
      </p>
    </div>

    <div class="flex flex-col xl:flex-row gap-8">
      <div class="flex-1 space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CampaignWizardTemplateTile
            v-for="tpl in templateList"
            :key="tpl.key"
            :tpl="tpl"
            :selected="selectedTemplate === tpl.key"
            @select="handleSelectTemplate"
          />
        </div>

        <div
          v-if="selectedTemplate === 'modal-with-cta-redirect'"
          class="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/50"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-20 h-20 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  v-if="selectedCreativeUrl"
                  :src="selectedCreativeUrl"
                  class="w-full h-full object-cover"
                >
                <div
                  v-else
                  class="text-zinc-400"
                >
                  <UIcon
                    name="i-lucide-image"
                    class="w-10 h-10"
                  />
                </div>
              </div>
              <div>
                <p class="font-bold text-zinc-900 dark:text-white">
                  Background Creative
                </p>
                <p class="text-sm text-zinc-500 mt-1">
                  Choose an image to display in the modal header.
                </p>
              </div>
            </div>
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-search"
              size="md"
              @click="showCreativePicker = true"
            >
              {{ selectedCreativeUrl ? 'Change Image' : 'Browse Gallery' }}
            </UButton>
          </div>
        </div>
      </div>

      <div class="xl:w-[450px] shrink-0">
        <div class="sticky top-8 space-y-4">
          <div
            v-if="selectedTemplate"
            class="h-[600px]"
          >
            <CampaignWizardHtmlPreview
              :html="previewHtml"
              :campaign-type="CAMPAIGN_TEMPLATES[selectedTemplate].defaults.campaignType"
            />
          </div>
          <div
            v-else
            class="h-[600px] rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center p-8 text-center"
          >
            <div class="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <UIcon
                name="i-lucide-eye"
                class="w-8 h-8 text-zinc-400"
              />
            </div>
            <p class="font-medium text-zinc-900 dark:text-white">
              No template selected
            </p>
            <p class="text-sm text-zinc-500 mt-1">
              Select a template on the left to see how it will look.
            </p>
          </div>
        </div>
      </div>
    </div>

    <CreativePickerModal
      v-model:open="showCreativePicker"
      @select="handleSelectCreative"
    />

    <CampaignWizardFooter
      :saving="saving"
      :can-continue="!!selectedTemplate"
      @next="handleNext"
      @back="router.back()"
    />
  </div>
</template>
