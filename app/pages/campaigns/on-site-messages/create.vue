<script setup lang="ts">
import { CAMPAIGN_TEMPLATES } from '~~/shared/types/campaign'
import type { TemplateType, CampaignTrigger, CampaignType } from '~~/shared/types/campaign'

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
  endDate: '',
  // Multi-tenant
  tenantId: 'kompasid',
  // Edge-worker delivery
  templateType: '' as TemplateType | '',
  campaignType: 'sticky' as CampaignType,
  elementSelector: '',
  html: '',
  trigger: { mode: 'scroll', value: 30 } as CampaignTrigger,
  segment: null as string | null,
  isTestMode: false
})

const uploadedCreatives = ref<{ url: string, fileName: string, fileSize: number, mimeType: string }[]>([])

// ── Template Selection ────────────────────────────────────────────────────────

function selectTemplate(key: TemplateType) {
  const tpl = CAMPAIGN_TEMPLATES[key]
  form.templateType = key
  form.campaignType = tpl.defaults.campaignType
  form.elementSelector = tpl.defaults.elementSelector
  form.html = tpl.defaults.html
  form.trigger = { ...tpl.defaults.trigger }
}

// ── Creatives ─────────────────────────────────────────────────────────────────

function onCreativeUploaded(creative: { url: string, fileName: string, fileSize: number, mimeType: string }) {
  uploadedCreatives.value.push(creative)
}

function removeCreative(index: number) {
  uploadedCreatives.value.splice(index, 1)
}

// ── Submit ───────────────────────────────────────────────────────────────────

async function onSubmit(action: 'draft' | 'schedule') {
  submitting.value = true
  try {
    const data = {
      tenantId: form.tenantId,
      name: form.name,
      priority: form.priority,
      ...(form.description && { description: form.description }),
      ...(form.objective && { objective: form.objective }),
      ...(form.startDate && { startDate: new Date(form.startDate).toISOString() }),
      ...(form.endDate && { endDate: new Date(form.endDate).toISOString() }),
      // Edge-worker fields
      templateType: form.templateType || undefined,
      campaignType: form.campaignType,
      elementSelector: form.elementSelector || undefined,
      html: form.html || undefined,
      trigger: form.trigger,
      segment: form.segment || undefined,
      isTestMode: form.isTestMode
    }

    const campaign = await createCampaign(data) as { id: string }

    // Upload creatives
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

    // Transition to scheduled
    if (action === 'schedule' && form.startDate) {
      await $fetch(`/api/campaigns/${campaign.id}/status`, {
        method: 'PATCH',
        body: { status: 'scheduled' }
      })
    }

    toast.add({ title: 'Message created', color: 'success' })
    router.push(`/campaigns/on-site-messages/${campaign.id}`)
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

const templateList = Object.entries(CAMPAIGN_TEMPLATES).map(([key, tpl]) => ({
  key: key as TemplateType,
  ...tpl
}))
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
        New Message
      </h1>
      <p class="text-sm text-zinc-500">
        Create a new on-site message for KG Media properties
      </p>
    </div>

    <!-- Step 1: Template Picker -->
    <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-6 space-y-4">
      <div>
        <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
          Message Template
        </h2>
        <p class="text-sm text-zinc-500 mt-0.5">
          Choose a template to pre-fill the message HTML and trigger settings.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          v-for="tpl in templateList"
          :key="tpl.key"
          type="button"
          class="relative text-left border rounded-xl p-4 transition-all focus:outline-none"
          :class="form.templateType === tpl.key
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 ring-2 ring-primary-500'
            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 bg-white dark:bg-zinc-900'"
          @click="selectTemplate(tpl.key)"
        >
          <div class="flex items-start gap-3">
            <UIcon
              :name="tpl.icon"
              class="mt-0.5 w-5 h-5 shrink-0"
              :class="form.templateType === tpl.key ? 'text-primary-500' : 'text-zinc-400'"
            />
            <div>
              <p class="font-medium text-sm text-zinc-900 dark:text-white">
                {{ tpl.label }}
              </p>
              <p class="text-xs text-zinc-500 mt-0.5 leading-snug">
                {{ tpl.description }}
              </p>
            </div>
          </div>
          <UIcon
            v-if="form.templateType === tpl.key"
            name="i-lucide-check-circle-2"
            class="absolute top-3 right-3 text-primary-500 w-4 h-4"
          />
        </button>
      </div>
    </div>

    <!-- Step 2: Campaign Details -->
    <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-6 space-y-5">
      <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
        Message Details
      </h2>

      <div class="space-y-4">
        <!-- Tenant ID -->
        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Tenant ID
            <span class="ml-1 text-xs text-zinc-400 font-normal">(multi-tenant scope)</span>
          </label>
          <UInput
            v-model="form.tenantId"
            placeholder="e.g. kompasid"
            size="md"
          />
          <p class="text-xs text-zinc-400 mt-1">
            Maps to KV key <code
              class="bg-zinc-100 dark:bg-zinc-800 px-1 rounded"
            >tenant:{{ form.tenantId || '…' }}:campaigns</code>
          </p>
        </div>

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
            placeholder="Message description..."
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

    <!-- Step 3: Delivery Settings (Edge Worker) -->
    <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-6 space-y-5">
      <div>
        <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
          Delivery Settings
        </h2>
        <p class="text-sm text-zinc-500 mt-0.5">
          Controls how oasis-edge injects this message into the target page.
        </p>
      </div>

      <div class="space-y-4">
        <!-- Element Selector -->
        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Element Selector
          </label>
          <UInput
            v-model="form.elementSelector"
            placeholder="e.g. body, article.main-content"
            size="md"
            :ui="{ base: 'font-mono' }"
          />
          <p class="text-xs text-zinc-400 mt-1">
            CSS selector where HTMLRewriter will prepend the banner HTML.
          </p>
        </div>

        <!-- Trigger -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Trigger Mode</label>
            <USelect
              v-model="form.trigger.mode"
              :items="[
                { label: 'Immediate', value: 'immediate' },
                { label: 'On Scroll (%)', value: 'scroll' },
                { label: 'Exit Intent', value: 'exit-intent' }
              ]"
              size="md"
            />
          </div>
          <div v-if="form.trigger.mode === 'scroll'">
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Scroll Depth (%)
            </label>
            <UInput
              v-model.number="form.trigger.value"
              type="number"
              :min="1"
              :max="100"
              placeholder="30"
              size="md"
            />
          </div>
        </div>

        <!-- HTML Preview -->
        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Message HTML</label>
          <UTextarea
            v-model="form.html"
            placeholder="<div>Your message HTML...</div>"
            :rows="6"
            :ui="{ base: 'font-mono text-xs' }"
          />
        </div>

        <!-- isTestMode -->
        <div
          class="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
        >
          <UCheckbox
            id="is-test-mode"
            v-model="form.isTestMode"
          />
          <div>
            <label
              for="is-test-mode"
              class="text-sm font-medium text-amber-900 dark:text-amber-200 cursor-pointer"
            >
              Test Mode Only (<code class="text-xs bg-amber-100 dark:bg-amber-900 px-1 rounded">oasis_test=1</code>)
            </label>
            <p class="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              When enabled, this message is only injected when the <code>oasis_test=1</code> cookie is present.
              Useful for QA without affecting real users.
            </p>
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
        to="/campaigns/on-site-messages"
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
