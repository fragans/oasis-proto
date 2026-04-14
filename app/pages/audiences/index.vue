<script setup lang="ts">
definePageMeta({ layout: 'default' })

const stats = ref({ contacts: 0, attributes: 0, events: 0, segments: 0 })

onMounted(async () => {
  try {
    const [
      contactsRes,
      segmentsRes,
      attributesRes,
      eventsTypesRes
    ] = await Promise.all([
      $fetch<{ total: number }>('/api/contacts', { query: { limit: 1 } }),
      $fetch<{ total: number }>('/api/segments', { query: { limit: 1 } }),
      $fetch<{ total: number }>('/api/attributes', { query: { limit: 1 } }),
      $fetch<{ total: number }>('/api/event-types', { query: { limit: 1 } })
    ])
    stats.value.contacts = contactsRes.total
    stats.value.segments = segmentsRes.total
    stats.value.attributes = attributesRes.total
    stats.value.events = eventsTypesRes.total
  } catch {
    // Ignore errors and keep stats at 0
  }
})

const cards = computed(() => [
  { label: 'Total Contacts', value: stats.value.contacts, icon: 'i-lucide-users', color: 'text-indigo-500', to: '/audiences/contacts' },
  { label: 'Segments', value: stats.value.segments, icon: 'i-lucide-layers', color: 'text-violet-500', to: '/audiences/segments' },
  { label: 'Attributes', value: stats.value.attributes, icon: 'i-lucide-tag', color: 'text-amber-500', to: '/audiences/attributes' },
  { label: 'Event Types', value: stats.value.events, icon: 'i-lucide-zap', color: 'text-emerald-500', to: '/audiences/events' }
])
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">
        Audiences
      </h1>
      <p class="text-sm text-zinc-500 mt-1">
        Manage contacts, segments, attributes, and event types
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <NuxtLink
        v-for="card in cards"
        :key="card.label"
        :to="card.to"
        class="group border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-white dark:bg-zinc-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all hover:shadow-md"
      >
        <div class="flex items-center justify-between mb-3">
          <UIcon
            :name="card.icon"
            :class="['w-6 h-6', card.color]"
          />
          <UIcon
            name="i-lucide-arrow-right"
            class="w-4 h-4 text-zinc-300 dark:text-zinc-700 group-hover:text-indigo-500 transition-colors"
          />
        </div>
        <p class="text-2xl font-bold text-zinc-900 dark:text-white">
          {{ card.value !== null ? card.value.toLocaleString() : '—' }}
        </p>
        <p class="text-sm text-zinc-500 mt-0.5">
          {{ card.label }}
        </p>
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 bg-white dark:bg-zinc-900">
        <h2 class="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
          Quick Actions
        </h2>
        <div class="space-y-2">
          <UButton
            to="/audiences/contacts"
            variant="ghost"
            color="neutral"
            icon="i-lucide-user-plus"
            label="Add Contact"
            block
            class="justify-start"
          />
          <UButton
            to="/audiences/segments"
            variant="ghost"
            color="neutral"
            icon="i-lucide-layers"
            label="Create Segment"
            block
            class="justify-start"
          />
          <UButton
            to="/audiences/attributes"
            variant="ghost"
            color="neutral"
            icon="i-lucide-tag"
            label="Manage Attributes"
            block
            class="justify-start"
          />
          <UButton
            to="/settings/api"
            variant="ghost"
            color="neutral"
            icon="i-lucide-key"
            label="API Tokens"
            block
            class="justify-start"
          />
        </div>
      </div>

      <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 bg-white dark:bg-zinc-900">
        <h2 class="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
          Ingest API
        </h2>
        <p class="text-sm text-zinc-500 mb-4">
          Send contact data and events to OASIS via the Ingest API.
        </p>
        <div class="bg-zinc-950 rounded-lg p-4 text-sm font-mono text-zinc-300 overflow-x-auto">
          <pre>POST /api/v1/contacts/ingest
{
  "email": "user@example.com",
  "attributes": { "plan": "pro" },
  "events": [
    { "event": "page_view", "properties": { "url": "/pricing" } }
  ]
}
          </pre>
        </div>
      </div>
    </div>
  </div>
</template>
