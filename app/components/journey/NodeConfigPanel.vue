<script setup lang="ts">
import type { JourneyNodeType } from '~~/shared/types/journey'
import { NODE_TYPE_LABELS, NODE_TYPE_ICONS } from '~~/shared/types/journey'

const props = defineProps<{
  nodeId: string
  nodeType: JourneyNodeType
  label: string
  config: Record<string, unknown>
}>()

const emit = defineEmits<{
  update: [config: Record<string, unknown>]
  updateLabel: [label: string]
  delete: []
  close: []
}>()

const localLabel = ref(props.label)
const localConfig = ref<Record<string, unknown>>({ ...props.config })

watch(() => props.config, (val) => {
  localConfig.value = { ...val }
})
watch(() => props.label, (val) => {
  localLabel.value = val
})

function save() {
  emit('updateLabel', localLabel.value)
  emit('update', { ...localConfig.value })
}

const { templates } = useEmailTemplates()

const selectClass = 'w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm'
</script>

<template>
  <div class="w-80 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden z-20">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
      <div class="flex items-center gap-2">
        <UIcon
          :name="NODE_TYPE_ICONS[nodeType]"
          class="w-4 h-4 text-indigo-500"
        />
        <span class="text-sm font-semibold">{{ NODE_TYPE_LABELS[nodeType] }}</span>
      </div>
      <UButton
        icon="i-lucide-x"
        variant="ghost"
        color="neutral"
        size="xs"
        @click="emit('close')"
      />
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <UFormField label="Label">
        <UInput
          v-model="localLabel"
          class="w-full"
          size="sm"
          @blur="save"
        />
      </UFormField>

      <!-- Email -->
      <template v-if="nodeType === 'action_email'">
        <UFormField label="Email Template">
          <select
            v-model="localConfig.templateId"
            :class="selectClass"
            @change="save"
          >
            <option value="">
              Select template...
            </option>
            <option
              v-for="t in templates"
              :key="t.id"
              :value="t.id"
            >
              {{ t.name }}
            </option>
          </select>
        </UFormField>
        <UFormField label="Subject Override">
          <input
            v-model="localConfig.subject"
            :class="selectClass"
            placeholder="Leave blank to use template subject"
            @blur="save"
          >
        </UFormField>
      </template>

      <!-- Push -->
      <template v-if="nodeType === 'action_push'">
        <UFormField label="Title">
          <input
            v-model="localConfig.title"
            :class="selectClass"
            @blur="save"
          >
        </UFormField>
        <UFormField label="Body">
          <textarea
            v-model="localConfig.body"
            :class="selectClass"
            rows="3"
            @blur="save"
          />
        </UFormField>
        <UFormField label="Action URL">
          <input
            v-model="localConfig.actionUrl"
            :class="selectClass"
            placeholder="https://..."
            @blur="save"
          >
        </UFormField>
      </template>

      <!-- Banner -->
      <template v-if="nodeType === 'action_banner'">
        <UFormField label="Campaign ID">
          <input
            v-model="localConfig.campaignId"
            :class="selectClass"
            placeholder="Link to campaign..."
            @blur="save"
          >
        </UFormField>
        <UFormField label="Placement">
          <input
            v-model="localConfig.placement"
            :class="selectClass"
            placeholder="e.g. homepage_hero"
            @blur="save"
          >
        </UFormField>
      </template>

      <!-- Webhook -->
      <template v-if="nodeType === 'action_webhook'">
        <UFormField label="URL">
          <input
            v-model="localConfig.url"
            :class="selectClass"
            placeholder="https://..."
            @blur="save"
          >
        </UFormField>
        <UFormField label="Method">
          <select
            v-model="localConfig.method"
            :class="selectClass"
            @change="save"
          >
            <option value="POST">
              POST
            </option>
            <option value="GET">
              GET
            </option>
            <option value="PUT">
              PUT
            </option>
            <option value="PATCH">
              PATCH
            </option>
          </select>
        </UFormField>
      </template>

      <!-- Condition -->
      <template v-if="nodeType === 'condition'">
        <UFormField label="Condition Type">
          <select
            v-model="localConfig.type"
            :class="selectClass"
            @change="save"
          >
            <option value="attribute">
              Contact Attribute
            </option>
            <option value="segment">
              Segment Membership
            </option>
            <option value="event">
              Event Fired
            </option>
          </select>
        </UFormField>
        <UFormField
          v-if="localConfig.type === 'attribute'"
          label="Field"
        >
          <input
            v-model="localConfig.field"
            :class="selectClass"
            placeholder="e.g. city"
            @blur="save"
          >
        </UFormField>
        <UFormField
          v-if="localConfig.type === 'attribute'"
          label="Operator"
        >
          <select
            v-model="localConfig.operator"
            :class="selectClass"
            @change="save"
          >
            <option value="equals">
              Equals
            </option>
            <option value="not_equals">
              Not Equals
            </option>
            <option value="contains">
              Contains
            </option>
            <option value="is_set">
              Is Set
            </option>
            <option value="is_not_set">
              Is Not Set
            </option>
          </select>
        </UFormField>
        <UFormField
          v-if="localConfig.type === 'attribute' && localConfig.operator !== 'is_set' && localConfig.operator !== 'is_not_set'"
          label="Value"
        >
          <input
            v-model="localConfig.value"
            :class="selectClass"
            @blur="save"
          >
        </UFormField>
        <UFormField
          v-if="localConfig.type === 'segment'"
          label="Segment ID"
        >
          <input
            v-model="localConfig.segmentId"
            :class="selectClass"
            placeholder="UUID of segment"
            @blur="save"
          >
        </UFormField>
      </template>

      <!-- Delay -->
      <template v-if="nodeType === 'delay'">
        <UFormField label="Delay Type">
          <select
            v-model="localConfig.type"
            :class="selectClass"
            @change="save"
          >
            <option value="duration">
              Wait for duration
            </option>
            <option value="until_date">
              Wait until date
            </option>
            <option value="until_event">
              Wait for event
            </option>
          </select>
        </UFormField>
        <template v-if="localConfig.type === 'duration'">
          <div class="flex gap-2">
            <UFormField
              label="Duration"
              class="flex-1"
            >
              <input
                :value="localConfig.duration?.value || 1"
                type="number"
                :class="selectClass"
                @input="localConfig.duration = { ...(localConfig.duration || {}), value: Number(($event.target as HTMLInputElement).value) }; save()"
              >
            </UFormField>
            <UFormField
              label="Unit"
              class="flex-1"
            >
              <select
                :value="localConfig.duration?.unit || 'hours'"
                :class="selectClass"
                @change="localConfig.duration = { ...(localConfig.duration || {}), unit: ($event.target as HTMLSelectElement).value }; save()"
              >
                <option value="minutes">
                  Minutes
                </option>
                <option value="hours">
                  Hours
                </option>
                <option value="days">
                  Days
                </option>
                <option value="weeks">
                  Weeks
                </option>
              </select>
            </UFormField>
          </div>
        </template>
        <UFormField
          v-if="localConfig.type === 'until_date'"
          label="Until Date"
        >
          <input
            v-model="localConfig.untilDate"
            type="datetime-local"
            :class="selectClass"
            @blur="save"
          >
        </UFormField>
        <UFormField
          v-if="localConfig.type === 'until_event'"
          label="Event Key"
        >
          <input
            v-model="localConfig.untilEventKey"
            :class="selectClass"
            placeholder="e.g. purchase_completed"
            @blur="save"
          >
        </UFormField>
      </template>

      <!-- Split -->
      <template v-if="nodeType === 'split'">
        <p class="text-xs text-zinc-500">
          Define A/B test variants with percentage splits.
        </p>
        <div
          v-for="(variant, idx) in (localConfig.variants || [{ label: 'A', percentage: 50 }, { label: 'B', percentage: 50 }])"
          :key="idx"
          class="flex gap-2 items-end"
        >
          <UFormField
            :label="idx === 0 ? 'Variant' : ''"
            class="flex-1"
          >
            <input
              v-model="variant.label"
              :class="selectClass"
              @blur="save"
            >
          </UFormField>
          <UFormField
            :label="idx === 0 ? '%' : ''"
            class="w-20"
          >
            <input
              v-model="variant.percentage"
              type="number"
              :class="selectClass"
              @blur="save"
            >
          </UFormField>
        </div>
      </template>

      <!-- Trigger -->
      <template v-if="nodeType === 'trigger'">
        <UFormField label="Event Key">
          <input
            v-model="localConfig.eventKey"
            :class="selectClass"
            placeholder="e.g. user.signed_up"
            @blur="save"
          >
        </UFormField>
      </template>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
      <UButton
        icon="i-lucide-trash-2"
        variant="ghost"
        color="error"
        size="xs"
        label="Delete Node"
        @click="emit('delete')"
      />
      <UButton
        size="xs"
        label="Apply"
        @click="save"
      />
    </div>
  </div>
</template>
