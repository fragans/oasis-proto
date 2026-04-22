<script setup lang="ts">
import type { TargetingRule } from '~~/shared/types/campaign'
import GeoRule from '~/components/campaign/wizard/rules/GeoRule.vue'
import DeviceRule from '~/components/campaign/wizard/rules/DeviceRule.vue'
import LoginStateRule from '~/components/campaign/wizard/rules/LoginStateRule.vue'
import PageRule from '~/components/campaign/wizard/rules/PageRule.vue'
import GtmAttrRule from '~/components/campaign/wizard/rules/GtmAttrRule.vue'

defineProps<{
  rule: TargetingRule
  index: number
}>()

const emit = defineEmits<{
  update: [rule: TargetingRule]
  remove: []
}>()

const components = {
  'geo': GeoRule,
  'device': DeviceRule,
  'login': LoginStateRule,
  'page': PageRule,
  'gtm-attr': GtmAttrRule
}

const ruleTypeLabels: Record<string, string> = {
  'geo': 'Geolocation',
  'device': 'Device Type',
  'login': 'Login State',
  'page': 'Page URL',
  'gtm-attr': 'GTM Attribute'
}

function handleUpdate(newRule: TargetingRule) {
  emit('update', newRule)
}
</script>

<template>
  <div class="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative group">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-xs">
          {{ index + 1 }}
        </div>
        <span class="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-xs">
          {{ ruleTypeLabels[rule.kind] }}
        </span>
      </div>

      <UButton
        color="error"
        variant="ghost"
        icon="i-lucide-trash-2"
        size="sm"
        class="opacity-0 group-hover:opacity-100 transition-opacity"
        @click="emit('remove')"
      />
    </div>

    <component
      :is="components[rule.kind]"
      :model-value="(rule as any)"
      @update:model-value="handleUpdate"
    />
  </div>
</template>
