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

const modalProps = ref({
  title: 'Limited Time Offer',
  description: 'Don\'t miss out on our latest updates and exclusive offers designed just for you.',
  ctaPositive: 'Get Started Now',
  ctaNegative: 'Maybe later',
  ctaLink: 'https://example.com'
})

const promoProps = ref({
  title: 'Extra 50% OFF first month',
  description: 'Use code <strong>OASIS50</strong> • New subscribers only',
  ctaLabel: 'Claim Now',
  ctaLink: '/subscribe'
})

// Sync from campaign data only once when loaded
watch(campaign, (newCampaign) => {
  if (!newCampaign) return

  const tplType = newCampaign.templateType as TemplateType
  if (tplType && CAMPAIGN_TEMPLATES[tplType] && !selectedTemplate.value) {
    selectedTemplate.value = tplType
  }

  // Restore props if it's the modal-with-cta-redirect template
  if (selectedTemplate.value === 'modal-with-cta-redirect') {
    // 1. Restore Creative URL
    if (!selectedCreativeUrl.value) {
      const creatives = (newCampaign as CampaignWithCreatives).creatives
      if (creatives && creatives.length > 0) {
        selectedCreativeUrl.value = creatives[0]?.fileUrl || null
      } else if (newCampaign.html) {
        const match = newCampaign.html.match(/background-image: url\(['"]?(.*?)['"]?\)/)
        if (match && match[1] && match[1] !== '{{creativeUrl}}') {
          selectedCreativeUrl.value = match[1]
        }
      }
    }

    // 2. Restore Text Props from HTML if available
    if (newCampaign.html) {
      const titleMatch = newCampaign.html.match(/<h3[^>]*>(.*?)<\/h3>/)
      if (titleMatch?.[1]) modalProps.value.title = titleMatch[1]

      const descMatch = newCampaign.html.match(/<p[^>]*>(.*?)<\/p>/)
      if (descMatch?.[1]) modalProps.value.description = descMatch[1]

      const positiveMatch = newCampaign.html.match(/<[ab][^>]*data-oasis-goal="click"[^>]*>(.*?)<\/[ab]>/)
      if (positiveMatch?.[1]) modalProps.value.ctaPositive = positiveMatch[1]

      const negativeMatch = newCampaign.html.match(/<button[^>]*background: transparent;[^>]*>(.*?)<\/button>/)
      if (negativeMatch?.[1]) modalProps.value.ctaNegative = negativeMatch[1]

      const linkMatch = newCampaign.html.match(/href="([^"]*)"/)
      if (linkMatch?.[1] && linkMatch[1] !== '{{ctaLink}}') {
        modalProps.value.ctaLink = linkMatch[1]
      }
    }

    // 3. Sync from Goal if available (takes priority for the link)
    if (newCampaign.goal?.destinationUrl) {
      modalProps.value.ctaLink = newCampaign.goal.destinationUrl
    }
  }

  // Restore props if it's the promo-code template
  if (selectedTemplate.value === 'promo-code') {
    if (newCampaign.html) {
      const titleMatch = newCampaign.html.match(/<p[^>]*font-weight:\s*600[^>]*>(.*?)<\/p>/)
      if (titleMatch?.[1]) promoProps.value.title = titleMatch[1]

      const descMatch = newCampaign.html.match(/<p[^>]*font-size:\s*12px[^>]*>(.*?)<\/p>/)
      if (descMatch?.[1]) promoProps.value.description = descMatch[1]

      const labelMatch = newCampaign.html.match(/<a[^>]*data-oasis-goal="click"[^>]*>(.*?)<\/a>/)
      if (labelMatch?.[1]) promoProps.value.ctaLabel = labelMatch[1]

      const linkMatch = newCampaign.html.match(/href="([^"]*)"/)
      if (linkMatch?.[1] && linkMatch[1] !== '{{ctaLink}}') {
        promoProps.value.ctaLink = linkMatch[1]
      }
    }

    if (newCampaign.goal?.destinationUrl) {
      promoProps.value.ctaLink = newCampaign.goal.destinationUrl
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

  if (selectedTemplate.value === 'modal-with-cta-redirect') {
    const creativeUrl = selectedCreativeUrl.value || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
    html = html
      .replace('{{creativeUrl}}', creativeUrl)
      .replace('{{title}}', modalProps.value.title)
      .replace('{{description}}', modalProps.value.description)
      .replace('{{ctaPositive}}', modalProps.value.ctaPositive)
      .replace('{{ctaNegative}}', modalProps.value.ctaNegative)
      .replace('{{ctaLink}}', modalProps.value.ctaLink)
  } else if (selectedTemplate.value === 'promo-code') {
    html = html
      .replace('{{promoTitle}}', promoProps.value.title)
      .replace('{{promoDescription}}', promoProps.value.description)
      .replace('{{ctaLabel}}', promoProps.value.ctaLabel)
      .replace('{{ctaLink}}', promoProps.value.ctaLink)
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
    html = html
      .replace('{{creativeUrl}}', creativeUrl)
      .replace('{{title}}', modalProps.value.title)
      .replace('{{description}}', modalProps.value.description)
      .replace('{{ctaPositive}}', modalProps.value.ctaPositive)
      .replace('{{ctaNegative}}', modalProps.value.ctaNegative)
      .replace('{{ctaLink}}', modalProps.value.ctaLink)
  } else if (selectedTemplate.value === 'promo-code') {
    html = html
      .replace('{{promoTitle}}', promoProps.value.title)
      .replace('{{promoDescription}}', promoProps.value.description)
      .replace('{{ctaLabel}}', promoProps.value.ctaLabel)
      .replace('{{ctaLink}}', promoProps.value.ctaLink)
  }

  await patch({
    templateType: selectedTemplate.value,
    campaignType: tpl.defaults.campaignType,
    elementSelector: tpl.defaults.elementSelector,
    html,
    goal: selectedTemplate.value === 'modal-with-cta-redirect'
      ? {
          type: 'click',
          selector: '[data-oasis-goal="click"]',
          destinationUrl: modalProps.value.ctaLink
        }
      : selectedTemplate.value === 'promo-code'
        ? {
            type: 'click',
            selector: '[data-oasis-goal="click"]',
            destinationUrl: promoProps.value.ctaLink
          }
        : campaign.value?.goal
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

    <div class="flex flex-col gap-8">
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
        <div class="space-y-1">
          <h2 class="text-2xl font-bold text-zinc-900 dark:text-white">
            Design Custom Template
          </h2>
          <p class="text-zinc-500">
            Edit the props to customize the template
          </p>
        </div>
        <UCard variant="outline">
          <div
            v-if="selectedTemplate === 'modal-with-cta-redirect'"
            class="space-y-6"
          >
            <div class="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/50">
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

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UFormField label="Modal Title">
                <UInput
                  v-model="modalProps.title"
                  placeholder="Enter title..."
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Modal Description"
                class="md:col-span-2"
              >
                <UTextarea
                  v-model="modalProps.description"
                  placeholder="Enter description..."
                  class="w-full"
                  :rows="3"
                />
              </UFormField>
              <UFormField label="Positive CTA Label">
                <UInput
                  v-model="modalProps.ctaPositive"
                  placeholder="Enter button text..."
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Positive CTA Link">
                <UInput
                  v-model="modalProps.ctaLink"
                  placeholder="https://..."
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Negative CTA Label">
                <UInput
                  v-model="modalProps.ctaNegative"
                  placeholder="Enter button text..."
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>

          <div
            v-else-if="selectedTemplate === 'promo-code'"
            class="space-y-6"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UFormField label="Promo Title">
                <UInput
                  v-model="promoProps.title"
                  placeholder="Enter promo title..."
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Promo Description">
                <UInput
                  v-model="promoProps.description"
                  placeholder="Enter description..."
                  class="w-full"
                />
              </UFormField>
              <UFormField label="CTA Label">
                <UInput
                  v-model="promoProps.ctaLabel"
                  placeholder="Enter button text..."
                  class="w-full"
                />
              </UFormField>
              <UFormField label="CTA Link">
                <UInput
                  v-model="promoProps.ctaLink"
                  placeholder="/subscribe"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </UCard>
      </div>

      <div class="w-full">
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
