<script setup lang="ts">
import type { SegmentRuleGroup, RuleOperator, StandardSegmentCategory, ContactAttribute, EventType } from '~~/shared/types/contact'
import type { RuleField, RuleEntry } from './SegmentRuleRow.vue'

const props = defineProps<{
  category?: StandardSegmentCategory | null
}>()

const model = defineModel<SegmentRuleGroup | null>({ default: null })

// ─── Static field sets per category ────────────────────────

const ATTRIBUTE_FIELDS: RuleField[] = [
  { value: 'contact.email', label: 'Email', type: 'string', category: 'Contact Properties' },
  { value: 'contact.firstName', label: 'First Name', type: 'string', category: 'Contact Properties' },
  { value: 'contact.lastName', label: 'Last Name', type: 'string', category: 'Contact Properties' },
  { value: 'contact.phone', label: 'Phone', type: 'string', category: 'Contact Properties' },
  { value: 'contact.gender', label: 'Gender', type: 'string', category: 'Contact Properties' },
  { value: 'contact.language', label: 'Language', type: 'string', category: 'Contact Properties' },
  { value: 'contact.birthday', label: 'Birthday', type: 'date', category: 'Contact Properties' },
  { value: 'contact.tags', label: 'Tags', type: 'string', category: 'Contact Properties' }
]

const DEVICE_FIELDS: RuleField[] = [
  { value: 'device.platform', label: 'Platform', type: 'string', category: 'Device' },
  { value: 'device.osVersion', label: 'OS Version', type: 'string', category: 'Device' },
  { value: 'device.appVersion', label: 'App Version', type: 'string', category: 'Device' },
  { value: 'device.deviceModel', label: 'Device Model', type: 'string', category: 'Device' },
  { value: 'device.lastActiveAt', label: 'Last Active', type: 'date', category: 'Device' }
]

const LOCATION_FIELDS: RuleField[] = [
  { value: 'contact.city', label: 'City', type: 'string', category: 'Location' },
  { value: 'contact.province', label: 'Province', type: 'string', category: 'Location' },
  { value: 'contact.country', label: 'Country', type: 'string', category: 'Location' }
]

const FALLBACK_EVENT_FIELDS: RuleField[] = [
  { value: 'event.sign_up.count', label: 'User Sign-Up', type: 'event_count', category: 'Events' },
  { value: 'event.purchase.count', label: 'Purchase', type: 'event_count', category: 'Events' },
  { value: 'event.page_view.count', label: 'Page View', type: 'event_count', category: 'Events' },
  { value: 'event.login.count', label: 'Login', type: 'event_count', category: 'Events' },
  { value: 'event.add_to_cart.count', label: 'Add to Cart', type: 'event_count', category: 'Events' }
]

// All fields combined (legacy fallback when no category)
const ALL_FIELDS: RuleField[] = [
  ...ATTRIBUTE_FIELDS,
  { value: 'contact.lastSeenAt', label: 'Last Visit Date', type: 'date', category: 'Visiting Behavior' },
  { value: 'contact.createdAt', label: 'Sign-Up Date', type: 'date', category: 'Visiting Behavior' },
  ...FALLBACK_EVENT_FIELDS
]

// ─── Dynamic field fetching ────────────────────────────────

const { data: attributesData, execute: fetchAttributes } = useFetch<{ attributes: ContactAttribute[] }>('/api/attributes', {
  query: { limit: 100 },
  immediate: false
})

const { data: eventTypesData, execute: fetchEventTypes } = useFetch<{ eventTypes: EventType[] }>('/api/event-types', {
  query: { limit: 100 },
  immediate: false
})

watch(() => props.category, (cat) => {
  if (cat === 'attributes') fetchAttributes()
  if (cat === 'events') fetchEventTypes()
}, { immediate: true })

// ─── Computed fields based on category ─────────────────────

const computedFields = computed<RuleField[]>(() => {
  switch (props.category) {
    case 'attributes': {
      const customFields: RuleField[] = (attributesData.value?.attributes || []).map(a => ({
        value: `attribute.${a.key}`,
        label: a.label,
        type: (a.type === 'boolean' ? 'string' : a.type) as RuleField['type'],
        category: a.category || 'Custom Attributes'
      }))
      return [...ATTRIBUTE_FIELDS, ...customFields]
    }
    case 'events': {
      const eventFields: RuleField[] = (eventTypesData.value?.eventTypes || []).map(e => ({
        value: `event.${e.key}.count`,
        label: e.label,
        type: 'event_count' as const,
        category: e.category || 'Events'
      }))
      return eventFields.length > 0 ? eventFields : FALLBACK_EVENT_FIELDS
    }
    case 'device':
      return DEVICE_FIELDS
    case 'location':
      return LOCATION_FIELDS
    default:
      return ALL_FIELDS
  }
})

// ─── Templates filtered by category ───────────────────────

interface Template {
  label: string
  description: string
  icon: string
  category?: StandardSegmentCategory
  rules: SegmentRuleGroup
}

const TEMPLATES: Template[] = [
  {
    label: 'Recent Sign-Ups',
    description: 'Users who signed up in the last 3 months',
    icon: 'i-lucide-user-plus',
    category: 'events',
    rules: {
      logic: 'and',
      rules: [
        { field: 'event.sign_up.count', operator: 'greater_than', value: { count: 0, timeframe: { amount: 3, unit: 'months' } } }
      ]
    }
  },
  {
    label: 'Active Visitors',
    description: 'Users who visited in the last 5 days',
    icon: 'i-lucide-eye',
    category: 'attributes',
    rules: {
      logic: 'and',
      rules: [
        { field: 'contact.lastSeenAt', operator: 'in_last' as RuleOperator, value: { amount: 5, unit: 'days' } }
      ]
    }
  },
  {
    label: 'Inactive Users',
    description: 'Not seen in the last 30 days',
    icon: 'i-lucide-user-x',
    category: 'attributes',
    rules: {
      logic: 'and',
      rules: [
        { field: 'contact.lastSeenAt', operator: 'before', value: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10) }
      ]
    }
  },
  {
    label: 'High-Value Shoppers',
    description: 'Purchased more than 3 times in last 30 days',
    icon: 'i-lucide-shopping-bag',
    category: 'events',
    rules: {
      logic: 'and',
      rules: [
        { field: 'event.purchase.count', operator: 'greater_than', value: { count: 3, timeframe: { amount: 30, unit: 'days' } } }
      ]
    }
  },
  {
    label: 'Mobile Users',
    description: 'Users on iOS or Android devices',
    icon: 'i-lucide-smartphone',
    category: 'device',
    rules: {
      logic: 'or',
      rules: [
        { field: 'device.platform', operator: 'equals', value: 'ios' },
        { field: 'device.platform', operator: 'equals', value: 'android' }
      ]
    }
  },
  {
    label: 'Indonesia Users',
    description: 'Users located in Indonesia',
    icon: 'i-lucide-map-pin',
    category: 'location',
    rules: {
      logic: 'and',
      rules: [
        { field: 'contact.country', operator: 'equals', value: 'ID' }
      ]
    }
  }
]

const filteredTemplates = computed(() => {
  if (!props.category) return TEMPLATES
  return TEMPLATES.filter(t => !t.category || t.category === props.category)
})

// ─── Rule management ──────────────────────────────────────

const rules = computed<RuleEntry[]>(() => {
  if (!model.value) return []
  return model.value.rules.map(r => ({
    field: r.field,
    operator: r.operator as RuleOperator | 'in_last',
    value: r.value
  }))
})

const logic = computed(() => model.value?.logic || 'and')

function emitUpdate(newRules: RuleEntry[], newLogic?: 'and' | 'or') {
  model.value = {
    logic: newLogic ?? logic.value,
    rules: newRules.map(r => ({
      field: r.field,
      operator: r.operator as RuleOperator,
      value: r.value
    }))
  }
}

function addRule() {
  const firstField = computedFields.value[0]
  const defaultField = firstField?.value || 'contact.email'
  const defaultOp = firstField?.type === 'event_count' ? 'greater_than' : 'contains'
  const defaultValue = firstField?.type === 'event_count'
    ? { count: 1, timeframe: { amount: 30, unit: 'days' } }
    : ''

  emitUpdate([
    ...rules.value,
    { field: defaultField, operator: defaultOp as RuleOperator, value: defaultValue }
  ])
}

function removeRule(idx: number) {
  const next = rules.value.filter((_, i) => i !== idx)
  if (next.length === 0) {
    model.value = null
  } else {
    emitUpdate(next)
  }
}

function updateRule(idx: number, updated: RuleEntry) {
  const next = rules.value.map((r, i) => i === idx ? updated : r)
  emitUpdate(next)
}

function toggleLogic() {
  emitUpdate(rules.value, logic.value === 'and' ? 'or' : 'and')
}

function applyTemplate(tpl: Template) {
  model.value = structuredClone(toRaw(tpl.rules))
}
</script>

<template>
  <div class="space-y-4">
    <!-- Predefined Templates -->
    <div v-if="rules.length === 0">
      <div v-if="filteredTemplates.length > 0">
        <p class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Quick Templates
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            v-for="tpl in filteredTemplates"
            :key="tpl.label"
            class="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all text-left group"
            @click="applyTemplate(tpl)"
          >
            <div class="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
              <UIcon
                :name="tpl.icon"
                class="w-4 h-4 text-indigo-600 dark:text-indigo-400"
              />
            </div>
            <div>
              <p class="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {{ tpl.label }}
              </p>
              <p class="text-xs text-zinc-500 mt-0.5">
                {{ tpl.description }}
              </p>
            </div>
          </button>
        </div>

        <div class="flex items-center gap-3 mt-4">
          <div class="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
          <span class="text-xs text-zinc-400">or build custom</span>
          <div class="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>

      <UButton
        icon="i-lucide-plus"
        label="Add Rule"
        variant="outline"
        color="neutral"
        size="sm"
        class="mt-3"
        @click="addRule"
      />
    </div>

    <!-- Rules -->
    <div
      v-else
      class="space-y-3"
    >
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs font-medium text-zinc-500 uppercase tracking-wider">Match</span>
        <UButton
          :label="logic === 'and' ? 'ALL' : 'ANY'"
          size="xs"
          :color="logic === 'and' ? 'primary' : 'warning'"
          variant="subtle"
          @click="toggleLogic"
        />
        <span class="text-xs text-zinc-500">of the following rules</span>
      </div>

      <div
        v-for="(rule, idx) in rules"
        :key="idx"
        class="relative"
      >
        <!-- AND/OR connector -->
        <div
          v-if="idx > 0"
          class="flex items-center gap-2 py-1.5"
        >
          <div class="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
          <UBadge
            :label="logic.toUpperCase()"
            :color="logic === 'and' ? 'primary' : 'warning'"
            variant="subtle"
            size="xs"
          />
          <div class="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        </div>

        <SegmentRuleRow
          :rule="rule"
          :fields="computedFields"
          :removable="true"
          @update:rule="updateRule(idx, $event)"
          @remove="removeRule(idx)"
        />
      </div>

      <div class="flex items-center gap-2 pt-1">
        <UButton
          icon="i-lucide-plus"
          label="Add Rule"
          variant="ghost"
          color="neutral"
          size="xs"
          @click="addRule"
        />
        <UButton
          icon="i-lucide-rotate-ccw"
          label="Reset"
          variant="ghost"
          color="error"
          size="xs"
          @click="model = null"
        />
      </div>
    </div>
  </div>
</template>
