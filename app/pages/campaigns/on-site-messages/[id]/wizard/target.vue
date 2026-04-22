<script setup lang="ts">
import type { TargetingRule, DeviceType } from '~~/shared/types/campaign'

definePageMeta({ layout: 'wizard' })

const route = useRoute()
const router = useRouter()
const campaignId = route.params.id as string

const { campaign, patch, saving } = useWizardDraft(campaignId)

const operator = ref<'AND' | 'OR'>('AND')
const rules = ref<TargetingRule[]>([])

// Sync from campaign data
watchEffect(() => {
  if (campaign.value?.targeting) {
    operator.value = campaign.value.targeting.operator
    rules.value = [...campaign.value.targeting.rules]
  }
})

const addRuleOptions = [
  [
    { label: 'Geolocation', icon: 'i-lucide-map-pin', onSelect: () => addRule('geo') },
    { label: 'Device Type', icon: 'i-lucide-smartphone', onSelect: () => addRule('device') },
    { label: 'Login State', icon: 'i-lucide-user', onSelect: () => addRule('login') },
    { label: 'Page URL', icon: 'i-lucide-link', onSelect: () => addRule('page') },
    { label: 'GTM Attribute', icon: 'i-lucide-database', onSelect: () => addRule('gtm-attr') }
  ]
]

function addRule(kind: TargetingRule['kind']) {
  let newRule: TargetingRule

  switch (kind) {
    case 'geo':
      newRule = { kind: 'geo', countries: [] }
      break
    case 'device':
      newRule = { kind: 'device', types: ['mobile', 'desktop'] as DeviceType[] }
      break
    case 'login':
      newRule = { kind: 'login', state: 'logged-in' }
      break
    case 'page':
      newRule = { kind: 'page', match: 'contains', value: '' }
      break
    case 'gtm-attr':
      newRule = { kind: 'gtm-attr', key: '', op: 'equals', value: '' }
      break
    default:
      return
  }

  rules.value.push(newRule)
}

function updateRule(index: number, newRule: TargetingRule) {
  rules.value[index] = newRule
}

function removeRule(index: number) {
  rules.value.splice(index, 1)
}

async function handleNext() {
  await patch({
    targeting: {
      operator: operator.value,
      rules: rules.value
    }
  })
  router.push(`/campaigns/on-site-messages/${campaignId}/wizard/trigger`)
}
</script>

<template>
  <div class="space-y-8 max-w-4xl mx-auto">
    <div class="space-y-1">
      <h2 class="text-2xl font-bold text-zinc-900 dark:text-white">
        Define Your Audience
      </h2>
      <p class="text-zinc-500">
        Control who sees this message based on their location, device, and behavior.
      </p>
    </div>

    <div class="space-y-6">
      <!-- Rules List -->
      <div
        v-if="rules.length > 0"
        class="space-y-4"
      >
        <CampaignWizardTargetingRuleEditor
          v-for="(rule, index) in rules"
          :key="index"
          :rule="rule"
          :index="index"
          @update="(newRule: TargetingRule) => updateRule(index, newRule)"
          @remove="removeRule(index)"
        />
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="text-center py-12 px-6 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800"
      >
        <div class="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
          <UIcon
            name="i-lucide-users"
            class="w-8 h-8 text-zinc-400"
          />
        </div>
        <h3 class="text-lg font-bold text-zinc-900 dark:text-white mb-1">
          No targeting rules yet
        </h3>
        <p class="text-zinc-500 mb-6">
          Without rules, this message will be shown to everyone.
        </p>
        <UDropdownMenu
          :items="addRuleOptions"
          :popper="{ placement: 'bottom' }"
        >
          <UButton
            label="Add Your First Rule"
            icon="i-lucide-plus"
            size="lg"
          />
        </UDropdownMenu>
      </div>

      <!-- Add Rule Button (when list is not empty) -->
      <div
        v-if="rules.length > 0"
        class="flex justify-center pt-4"
      >
        <UDropdownMenu
          :items="addRuleOptions"
          :popper="{ placement: 'bottom' }"
        >
          <UButton
            label="Add Another Rule"
            variant="ghost"
            icon="i-lucide-plus"
          />
        </UDropdownMenu>
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
