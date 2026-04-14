<script setup lang="ts">
definePageMeta({ layout: 'default' })

interface ApiToken {
  id: string
  name: string
  prefix: string
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

const tokens = ref<ApiToken[]>([])
const loading = ref(true)
const showCreate = ref(false)
const saving = ref(false)
const deleteTarget = ref<ApiToken | null>(null)
const deleting = ref(false)
const newTokenValue = ref('')
const tokenName = ref('')

async function load() {
  loading.value = true
  try {
    const res = await $fetch<{ tokens: ApiToken[] }>('/api/tokens')
    tokens.value = res.tokens
  } finally {
    loading.value = false
  }
}

async function onCreate() {
  saving.value = true
  try {
    const res = await $fetch<{ token: string } & ApiToken>('/api/tokens', {
      method: 'POST',
      body: { name: tokenName.value }
    })
    newTokenValue.value = res.token
    tokenName.value = ''
    await load()
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`/api/tokens/${deleteTarget.value.id}`, { method: 'DELETE' })
    deleteTarget.value = null
    await load()
  } finally {
    deleting.value = false
  }
}

function copyToken() {
  navigator.clipboard.writeText(newTokenValue.value)
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(load)
</script>

<template>
  <div class="space-y-6 max-w-3xl">
    <div>
      <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">
        API Tokens
      </h1>
      <p class="text-sm text-zinc-500 mt-1">
        Manage API tokens for the Ingest API endpoint
      </p>
    </div>

    <!-- New token alert -->
    <div v-if="newTokenValue"
      class="border border-emerald-300 dark:border-emerald-800 rounded-xl p-4 bg-emerald-50 dark:bg-emerald-900/20">
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            Token created. Copy it now — it won't be shown again.
          </p>
          <div class="flex items-center gap-2 mt-2">
            <code
              class="flex-1 bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-900 dark:text-white break-all">
              {{ newTokenValue }}
            </code>
            <UButton icon="i-lucide-copy" variant="outline" color="neutral" size="sm" @click="copyToken" />
          </div>
        </div>
      </div>
      <div class="flex justify-end mt-3">
        <UButton label="Done" size="sm" variant="ghost" @click="newTokenValue = ''" />
      </div>
    </div>

    <!-- Create -->
    <div class="flex gap-2">
      <UInput v-model="tokenName" placeholder="Token name (e.g. Production API)" class="flex-1" />
      <UButton icon="i-lucide-plus" label="Generate Token" color="primary" :loading="saving" :disabled="!tokenName"
        @click="onCreate" />
    </div>

    <!-- Token list -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 2" :key="i" class="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
    </div>

    <div v-else-if="tokens.length === 0"
      class="text-center py-12 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900">
      <UIcon name="i-lucide-key" class="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
      <p class="text-zinc-600 dark:text-zinc-400 font-medium">
        No API tokens
      </p>
      <p class="text-sm text-zinc-400 mt-1">
        Generate a token to start using the Ingest API
      </p>
    </div>

    <div v-else
      class="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
      <div v-for="token in tokens" :key="token.id" class="flex items-center justify-between px-4 py-3">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <UIcon name="i-lucide-key" class="w-4 h-4 text-zinc-500" />
          </div>
          <div>
            <p class="text-sm font-medium text-zinc-900 dark:text-white">
              {{ token.name }}
            </p>
            <p class="text-xs text-zinc-400">
              <code class="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{{ token.prefix }}••••••••</code>
              &middot; Created {{ formatDate(token.createdAt) }}
              <span v-if="token.lastUsedAt"> &middot; Last used {{ formatDate(token.lastUsedAt) }}</span>
            </p>
          </div>
        </div>
        <UButton icon="i-lucide-trash-2" variant="ghost" color="error" size="xs" @click="deleteTarget = token" />
      </div>
    </div>


    <UCard class="bg-primary-50/50 dark:bg-primary-950/10 border-primary-200 dark:border-primary-800">
      <div class="flex gap-4">
        <div class="shrink-0">
          <UIcon name="i-heroicons-information-circle-20-solid" class="w-6 h-6 text-primary-500" />
        </div>

        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-primary-900 dark:text-primary-100 uppercase tracking-wide">
            API Token Management
          </h3>

          <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            This page manages authentication credentials for your <strong>Ingest API</strong> — the endpoint that
            external systems (apps, SDKs, scripts) call to send data (events, contact activity, etc.) into Oasis.
          </p>

          <div class="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 italic">
              Typical Workflow:
            </p>
            <ul class="space-y-2">
              <li class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <UBadge size="xs" variant="soft" color="primary">1</UBadge>
                <span><strong>Generate</strong> a token here and copy it.</span>
              </li>
              <li class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <UBadge size="xs" variant="soft" color="primary">2</UBadge>
                <span><strong>Plug it</strong> into your app/SDK as a Bearer token.</span>
              </li>
              <li class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <UBadge size="xs" variant="soft" color="primary">3</UBadge>
                <span><strong>Send events</strong> to <code
                    class="text-xs bg-gray-200 dark:bg-gray-800 px-1 rounded">/api/v1/...</code> using that
                  token.</span>
              </li>
              <li class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <UBadge size="xs" variant="soft" color="primary">4</UBadge>
                <span><strong>Monitor usage</strong> via "last used" and revoke when finished.</span>
              </li>
            </ul>
          </div>

          <p class="text-xs text-gray-500 dark:text-gray-500">
            Essentially the API key management page for your platform's data ingestion layer.
          </p>
        </div>
      </div>
    </UCard>

    <!-- Delete dialog -->
    <CampaignConfirmDialog :open="!!deleteTarget" title="Revoke Token"
      :description="`Revoke '${deleteTarget?.name}'? Any systems using this token will lose access.`"
      confirm-label="Revoke" confirm-color="error" :loading="deleting" @update:open="deleteTarget = null"
      @confirm="onDelete" />
  </div>
</template>
