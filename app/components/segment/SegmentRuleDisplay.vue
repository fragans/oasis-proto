<script setup lang="ts">
import type { SegmentRuleGroup } from '~~/shared/types/contact'

defineProps<{
  rules: SegmentRuleGroup
}>()

const FIELD_LABELS: Record<string, string> = {
  'contact.email': 'Email',
  'contact.firstName': 'First Name',
  'contact.lastName': 'Last Name',
  'contact.phone': 'Phone',
  'contact.gender': 'Gender',
  'contact.language': 'Language',
  'contact.city': 'City',
  'contact.province': 'Province',
  'contact.country': 'Country',
  'contact.lastSeenAt': 'Last Visit Date',
  'contact.createdAt': 'Sign-Up Date',
  'contact.birthday': 'Birthday',
  'contact.tags': 'Tags',
  'event.sign_up.count': 'User Sign-Up',
  'event.purchase.count': 'Purchase',
  'event.page_view.count': 'Page View',
  'event.login.count': 'Login',
  'event.add_to_cart.count': 'Add to Cart',
  'device.platform': 'Platform',
  'device.osVersion': 'OS Version',
  'device.appVersion': 'App Version',
  'device.deviceModel': 'Device Model',
  'device.lastActiveAt': 'Last Active'
}

function getFieldLabel(field: string): string {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field]
  if (field.startsWith('attribute.')) {
    return field.replace('attribute.', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  if (field.startsWith('event.') && field.endsWith('.count')) {
    return field.slice(6, -6).replace(/[_.]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  return field
}

const OPERATOR_LABELS: Record<string, string> = {
  equals: 'is',
  not_equals: 'is not',
  contains: 'contains',
  not_contains: 'does not contain',
  starts_with: 'starts with',
  ends_with: 'ends with',
  greater_than: 'is greater than',
  less_than: 'is less than',
  is_set: 'is set',
  is_not_set: 'is not set',
  before: 'is before',
  after: 'is after',
  in_last: 'was in the last'
}

const EVENT_OPERATOR_LABELS: Record<string, string> = {
  equals: 'exactly',
  not_equals: 'not',
  greater_than: 'at least',
  less_than: 'at most'
}

function getOperatorLabel(rule: { field: string, operator: string }): string {
  if (rule.field.startsWith('event.') && EVENT_OPERATOR_LABELS[rule.operator]) {
    return EVENT_OPERATOR_LABELS[rule.operator]!
  }
  return OPERATOR_LABELS[rule.operator] || rule.operator
}

function formatValue(rule: { field: string, operator: string, value: unknown }): string {
  if (rule.operator === 'is_set' || rule.operator === 'is_not_set') return ''

  if (rule.operator === 'in_last') {
    const v = rule.value as Record<string, unknown>
    return `${v.amount} ${v.unit}`
  }

  if (rule.field.startsWith('event.') && typeof rule.value === 'object' && rule.value !== null) {
    const v = rule.value as Record<string, unknown>
    const tf = v.timeframe as Record<string, unknown> | undefined
    if (tf) return `${v.count} time(s) in the last ${tf.amount} ${tf.unit}`
    return String(v.count ?? rule.value)
  }

  return String(rule.value ?? '')
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center gap-1.5 mb-3">
      <span class="text-xs text-zinc-500">Matching</span>
      <UBadge
        :label="rules.logic === 'and' ? 'ALL' : 'ANY'"
        :color="rules.logic === 'and' ? 'primary' : 'warning'"
        variant="subtle"
        size="xs"
      />
      <span class="text-xs text-zinc-500">of the following</span>
    </div>

    <UCard
      v-for="(rule, idx) in rules.rules"
      :key="idx"
    >
      <div class="flex items-center gap-1.5 flex-wrap text-sm">
        <UBadge
          v-if="idx > 0"
          :label="rules.logic.toUpperCase()"
          :color="rules.logic === 'and' ? 'primary' : 'warning'"
          variant="subtle"
          size="xs"
          class="mr-1"
        />
        <span class="font-medium text-zinc-900 dark:text-white">
          {{ getFieldLabel(rule.field) }}
        </span>
        <span class="text-zinc-500">
          {{ getOperatorLabel(rule) }}
        </span>
        <span
          v-if="formatValue(rule)"
          class="font-medium text-indigo-600 dark:text-indigo-400"
        >
          {{ formatValue(rule) }}
        </span>
      </div>
    </UCard>
  </div>
</template>
