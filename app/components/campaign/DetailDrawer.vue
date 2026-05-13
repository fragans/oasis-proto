<script setup lang="ts">
import type { Campaign } from '~~/shared/types/campaign'

const { isAdmin: canEdit } = useRole()

const props = defineProps<{
  open: boolean
  campaign: Campaign | null
}>()

const emit = defineEmits(['update:open', 'refresh'])

const route = useRoute()

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const isOpen = computed({
  get: () => props.open,
  set: val => emit('update:open', val)
})

const updating = ref(false)
const toast = useToast()

async function updateStatus(status: CampaignStatus) {
  if (!props.campaign) return
  updating.value = true
  try {
    await $fetch(`/api/campaigns/${props.campaign.id}/status`, {
      method: 'PATCH',
      body: { status }
    })
    toast.add({
      title: 'Success',
      description: `Campaign status updated to ${status}`,
      color: 'success'
    })
    emit('refresh')
  } catch (e) {
    toast.add({
      title: 'Error',
      description: e instanceof Error ? e.message : 'Failed to update status',
      color: 'error'
    })
  } finally {
    updating.value = false
  }
}

const statusActions = computed(() => {
  if (!props.campaign) return []
  const currentStatus = props.campaign.status
  const transitions = STATUS_TRANSITIONS[currentStatus] || []

  return transitions.map(status => ({
    label: status.charAt(0).toUpperCase() + status.slice(1),
    color: STATUS_COLORS[status],
    icon: STATUS_ICONS[status],
    onSelect: () => updateStatus(status)
  }))
})
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    title="Campaign Details"
    :ui="{
      content: 'sm:max-w-md'
    }"
  >
    <template
      v-if="campaign"
      #body
    >
      <div class="space-y-8">
        <!-- Header: Title + Campaign ID -->
        <div class="space-y-3">
          <h2 class="text-xl font-bold">
            {{ campaign.name }}
          </h2>
          <CampaignStatusBadge :status="campaign.status" />
        </div>

        <!-- Metadata Section: Created On, Priority, ID -->
        <section>
          <div class="mb-4 space-y-2">
            <h3 class="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 text-muted">
              <UIcon
                name="i-lucide-info"
                class="w-4 h-4"
              />
              Metadata
            </h3>
            <p class="text-xs font-mono py-0.5 rounded">
              ID: {{ campaign.id }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-xs text-muted ">
                Created On
              </p>
              <p class="text-sm  ">
                {{ formatDate(campaign.createdAt) }}
              </p>
            </div>
            <div class="space-y-1">
              <p class="text-xs text-muted">
                Priority
              </p>
              <div class="flex">
                <UBadge
                  :color="campaign.priority === 'critical' ? 'error' : campaign.priority === 'high' ? 'warning' : campaign.priority === 'medium' ? 'info' : 'neutral'"
                  variant="subtle"
                  size="sm"
                  class="capitalize"
                >
                  {{ campaign.priority }}
                </UBadge>
              </div>
            </div>
            <div class="space-y-1 col-span-2">
              <p class="text-xs text-muted">
                Date Range
              </p>
              <p class="text-sm">
                {{ formatDate(campaign.startDate) }} — {{ formatDate(campaign.endDate) }}
              </p>
            </div>
          </div>
        </section>

        <!-- Logic Section: Segmentation and Rules -->
        <section>
          <h3 class="text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 text-muted">
            <UIcon
              name="i-lucide-settings-2"
              class="w-4 h-4"
            />
            Logic (When/Where)
          </h3>

          <div class="space-y-4">
            <!-- Segmentation -->
            <div class="rounded-lg p-4 border border-muted">
              <p class="text-xs  mb-2 flex items-center gap-1.5">
                <UIcon
                  name="i-lucide-users"
                  class="w-3.5 h-3.5"
                />
                Segmentation
              </p>
              <p class="text-sm font-medium ">
                {{ campaign.segment || 'All Users' }}
              </p>
            </div>

            <!-- Rules -->
            <div class="rounded-lg p-4 border border-muted">
              <p class="text-xs  mb-2 flex items-center gap-1.5 text-muted">
                <UIcon
                  name="i-lucide-filter"
                  class="w-3.5 h-3.5"
                />
                Targeting Rules ({{ campaign.targeting?.operator || 'AND' }})
              </p>
              <div
                v-if="campaign.targeting?.rules?.length"
                class="space-y-2"
              >
                <div
                  v-for="(rule, index) in campaign.targeting.rules"
                  :key="index"
                  class="text-sm flex items-start gap-2"
                >
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="w-4 h-4 mt-0.5"
                  />
                  <div class="flex-1">
                    <span class="font-medium capitalize">{{ rule.kind }}:</span>
                    <span class="ml-1">
                      <template v-if="rule.kind === 'page'">
                        {{ rule.match }} '{{ rule.value }}'
                      </template>
                      <template v-else-if="rule.kind === 'device'">
                        {{ rule.types.join(', ') }}
                      </template>
                      <template v-else-if="rule.kind === 'geo'">
                        {{ rule.countries?.join(', ') || 'Global' }}
                      </template>
                      <template v-else-if="rule.kind === 'login'">
                        {{ rule.state }}
                      </template>
                      <template v-else>
                        {{ JSON.stringify(rule) }}
                      </template>
                    </span>
                  </div>
                </div>
              </div>
              <p
                v-else
                class="text-sm  italic"
              >
                No specific targeting rules
              </p>
            </div>

            <!-- Trigger -->
            <div class=" rounded-lg p-4 border border-muted">
              <p class="text-xs text-muted  mb-2 flex items-center gap-1.5">
                <UIcon
                  name="i-lucide-zap"
                  class="w-3.5 h-3.5"
                />
                Trigger
              </p>
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium   capitalize">
                  {{ campaign.trigger?.mode || 'immediate' }}
                </span>
                <span
                  v-if="campaign.trigger?.value"
                  class="text-xs "
                >
                  ({{ campaign.trigger.value }}{{ campaign.trigger.mode === 'scroll' ? '%' : 's' }})
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Goals Section: Clicks, Purchases -->
        <section>
          <h3 class="text-xs font-semibold  uppercase tracking-wider mb-4 flex items-center gap-2 text-muted">
            <UIcon
              name="i-lucide-target"
              class="w-4 h-4"
            />
            Goals (Measurement)
          </h3>
          <div class=" rounded-lg p-4 border border-muted">
            <div
              v-if="campaign.goal"
              class="space-y-3"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium   capitalize">
                  {{ campaign.goal.type }}
                </span>
                <UBadge
                  color="success"
                  variant="subtle"
                  size="sm"
                >
                  Active
                </UBadge>
              </div>
              <div class="space-y-1">
                <p class="text-xs ">
                  Selector
                </p>
                <p class="text-sm font-mono text-zinc-600 dark:">
                  {{ campaign.goal.selector }}
                </p>
              </div>
              <div
                v-if="campaign.goal.destinationUrl"
                class="space-y-1"
              >
                <p class="text-xs ">
                  Destination
                </p>
                <p class="text-sm text-zinc-600 dark: break-all">
                  {{ campaign.goal.destinationUrl }}
                </p>
              </div>
            </div>
            <p
              v-else
              class="text-sm  italic"
            >
              No goals defined for this campaign
            </p>
          </div>
        </section>
      </div>
    </template>

    <template #footer>
      <div
        v-if="canEdit"
        class="flex justify-between items-center gap-3 w-full"
      >
        <div class="flex gap-2">
          <UDropdownMenu
            v-if="statusActions.length > 0"
            :items="statusActions"
            :content="{ align: 'start' }"
          >
            <UButton
              label="Change Status"
              color="neutral"
              variant="outline"
              icon="i-lucide-list-restart"
              :loading="updating"
            />
          </UDropdownMenu>
        </div>

        <UButton
          v-if="campaign"
          label="Edit Campaign"
          icon="i-lucide-pencil"
          color="primary"
          :to="`/${route.params.org}/campaigns/on-site-messages/${campaign.id}/wizard/template`"
        />
      </div>
    </template>
  </USlideover>
</template>
