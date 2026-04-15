<script setup lang="ts">
import type { RuleOperator } from '~~/shared/types/contact'

export interface RuleField {
  value: string
  label: string
  type: 'string' | 'number' | 'date' | 'event_count'
  category: string
}

export interface RuleEntry {
  field: string
  operator: RuleOperator | 'in_last'
  value: unknown
}

const props = defineProps<{
  rule: RuleEntry
  fields: RuleField[]
  removable?: boolean
}>()

const emit = defineEmits<{
  'update:rule': [rule: RuleEntry]
  'remove': []
}>()

const OPERATOR_MAP: Record<string, { label: string, value: string }[]> = {
  string: [
    { label: 'equals', value: 'equals' },
    { label: 'not equals', value: 'not_equals' },
    { label: 'contains', value: 'contains' },
    { label: 'not contains', value: 'not_contains' },
    { label: 'starts with', value: 'starts_with' },
    { label: 'ends with', value: 'ends_with' },
    { label: 'is set', value: 'is_set' },
    { label: 'is not set', value: 'is_not_set' }
  ],
  number: [
    { label: 'equals', value: 'equals' },
    { label: 'not equals', value: 'not_equals' },
    { label: 'greater than', value: 'greater_than' },
    { label: 'less than', value: 'less_than' },
    { label: 'is set', value: 'is_set' },
    { label: 'is not set', value: 'is_not_set' }
  ],
  date: [
    { label: 'was in the last', value: 'in_last' },
    { label: 'before', value: 'before' },
    { label: 'after', value: 'after' },
    { label: 'equals', value: 'equals' },
    { label: 'is set', value: 'is_set' },
    { label: 'is not set', value: 'is_not_set' }
  ],
  event_count: [
    { label: 'exactly', value: 'equals' },
    { label: 'not', value: 'not_equals' },
    { label: 'at least', value: 'greater_than' },
    { label: 'at most', value: 'less_than' }
  ]
}

const TIME_UNITS = [
  { label: 'Days', value: 'days' },
  { label: 'Weeks', value: 'weeks' },
  { label: 'Months', value: 'months' },
  { label: 'Years', value: 'years' }
]

const selectedField = computed(() =>
  props.fields.find(f => f.value === props.rule.field)
)

const fieldType = computed(() => selectedField.value?.type || 'string')

const operators = computed(() => OPERATOR_MAP[fieldType.value] || OPERATOR_MAP.string)

const needsNoValue = computed(() =>
  props.rule.operator === 'is_set' || props.rule.operator === 'is_not_set'
)

const isRelativeDate = computed(() => props.rule.operator === 'in_last')

const isEventWithTimeframe = computed(() => fieldType.value === 'event_count')

const relativeAmount = computed(() => {
  const v = props.rule.value as Record<string, unknown> | null
  return v?.amount ?? 1
})

const relativeUnit = computed(() => {
  const v = props.rule.value as Record<string, unknown> | null
  return (v?.unit as string) ?? 'days'
})

const eventTimeframeAmount = computed(() => {
  const v = props.rule.value as Record<string, unknown> | null
  return v?.timeframe ? (v.timeframe as Record<string, unknown>).amount ?? 30 : 30
})

const eventTimeframeUnit = computed(() => {
  const v = props.rule.value as Record<string, unknown> | null
  return v?.timeframe ? ((v.timeframe as Record<string, unknown>).unit as string) ?? 'days' : 'days'
})

const eventCount = computed(() => {
  const v = props.rule.value as Record<string, unknown> | null
  return v?.count ?? 1
})

const fieldItems = computed(() => {
  const grouped = new Map<string, { label: string, value: string }[]>()
  for (const f of props.fields) {
    if (!grouped.has(f.category)) grouped.set(f.category, [])
    grouped.get(f.category)!.push({ label: f.label, value: f.value })
  }
  return Array.from(grouped.values())
})

function update(patch: Partial<RuleEntry>) {
  const updated = { ...props.rule, ...patch }
  if (patch.field && patch.field !== props.rule.field) {
    const newField = props.fields.find(f => f.value === patch.field)
    const newType = newField?.type || 'string'
    const validOps = OPERATOR_MAP[newType] ?? OPERATOR_MAP.string!
    if (!validOps.find(o => o.value === updated.operator)) {
      updated.operator = validOps[0]?.value as RuleOperator ?? 'equals'
    }
    if (newType === 'event_count') {
      updated.value = { count: 1, timeframe: { amount: 30, unit: 'days' } }
    } else if (newType === 'date') {
      updated.operator = 'in_last' as RuleOperator
      updated.value = { amount: 5, unit: 'days' }
    } else {
      updated.value = ''
    }
  }
  if (patch.operator === 'in_last') {
    if (typeof updated.value !== 'object' || !updated.value) {
      updated.value = { amount: 5, unit: 'days' }
    }
  }
  emit('update:rule', updated)
}

function updateRelative(patch: { amount?: number, unit?: string }) {
  const current = (props.rule.value as Record<string, unknown>) || { amount: 5, unit: 'days' }
  emit('update:rule', { ...props.rule, value: { ...current, ...patch } })
}

function updateEventValue(patch: { count?: number, timeframe?: { amount?: number, unit?: string } }) {
  const current = (props.rule.value as Record<string, unknown>) || { count: 1, timeframe: { amount: 30, unit: 'days' } }
  const currentTf = (current.timeframe as Record<string, unknown>) || { amount: 30, unit: 'days' }
  emit('update:rule', {
    ...props.rule,
    value: {
      count: patch.count ?? current.count,
      timeframe: { ...currentTf, ...(patch.timeframe || {}) }
    }
  })
}
</script>

<template>
  <UCard>
    <div class="flex items-start gap-2 flex-wrap">
      <!-- Field -->
      <USelect
        :model-value="rule.field"
        :items="fieldItems"
        value-key="value"
        placeholder="Select field..."
        size="sm"
        class="w-48"
        @update:model-value="update({ field: $event as string })"
      />

      <!-- Operator -->
      <USelect
        :model-value="rule.operator"
        :items="operators"
        value-key="value"
        size="sm"
        class="w-40"
        @update:model-value="update({ operator: $event as RuleOperator })"
      />

      <!-- Value: relative date (in the last X days/months) -->
      <template v-if="isRelativeDate && !needsNoValue">
        <UInput
          :model-value="String(relativeAmount)"
          type="number"
          size="sm"
          class="w-20"
          @update:model-value="updateRelative({ amount: Number($event) })"
        />
        <USelect
          :model-value="relativeUnit"
          :items="TIME_UNITS"
          value-key="value"
          size="sm"
          class="w-28"
          @update:model-value="updateRelative({ unit: $event as string })"
        />
      </template>

      <!-- Value: event count with timeframe -->
      <template v-else-if="isEventWithTimeframe && !needsNoValue">
        <UInput
          :model-value="String(eventCount)"
          type="number"
          size="sm"
          class="w-20"
          @update:model-value="updateEventValue({ count: Number($event) })"
        />
        <span class="text-xs text-zinc-500 self-center">time(s) in the last</span>
        <UInput
          :model-value="String(eventTimeframeAmount)"
          type="number"
          size="sm"
          class="w-20"
          @update:model-value="updateEventValue({ timeframe: { amount: Number($event) } })"
        />
        <USelect
          :model-value="eventTimeframeUnit"
          :items="TIME_UNITS"
          value-key="value"
          size="sm"
          class="w-28"
          @update:model-value="updateEventValue({ timeframe: { unit: $event as string } })"
        />
      </template>

      <!-- Value: number -->
      <template v-else-if="fieldType === 'number' && !needsNoValue">
        <UInput
          :model-value="String(rule.value ?? '')"
          type="number"
          placeholder="Value"
          size="sm"
          class="w-28"
          @update:model-value="update({ value: Number($event) })"
        />
      </template>

      <!-- Value: date (absolute) -->
      <template v-else-if="fieldType === 'date' && !needsNoValue">
        <UInput
          :model-value="String(rule.value ?? '')"
          type="date"
          size="sm"
          class="w-40"
          @update:model-value="update({ value: $event })"
        />
      </template>

      <!-- Value: string (default) -->
      <template v-else-if="!needsNoValue">
        <UInput
          :model-value="String(rule.value ?? '')"
          placeholder="Value"
          size="sm"
          class="w-40"
          @update:model-value="update({ value: $event })"
        />
      </template>

      <!-- Remove -->
      <UButton
        v-if="removable"
        icon="i-lucide-x"
        variant="ghost"
        color="neutral"
        size="xs"
        class="self-center absolute bottom-1 right-1"
        @click="emit('remove')"
      />
    </div>
  </UCard>
</template>
