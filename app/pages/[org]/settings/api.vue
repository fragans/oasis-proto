<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { client } = useUserSession()
const toast = useToast()

const newTokenValue = ref('')
const tokenName = ref('')
const deleteTarget = ref<{ id: string, name: string } | null>(null)
const deleting = ref(false)

// Use useAsyncData to wrap the client call and handle the potential null client
const { data: apiKeys, refresh, status } = await useAsyncData('api-keys', async () => {
  if (!client) return []
  const res = await client.apiKey.list()
  return res.data || []
})

async function onCreate() {
  if (!tokenName.value) return
  try {
    if (!client) return
    const { data: key } = await client.apiKey.create({
      name: tokenName.value
    })
    if (key) {
      newTokenValue.value = key.token
      tokenName.value = ''
      refresh()
      toast.add({ title: 'Success', description: 'API token generated' })
    }
  } catch (err) {
    toast.add({
      title: 'Error',
      description: err instanceof Error ? err.message : 'Failed to create token',
      color: 'error'
    })
  }
}

async function onDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    if (!client) return
    await client.apiKey.revoke({ id: deleteTarget.value.id })
    refresh()
    toast.add({ title: 'Success', description: 'API token revoked', color: 'success' })
    deleteTarget.value = null
  } catch (err) {
    toast.add({
      title: 'Error',
      description: err instanceof Error ? err.message : 'Failed to revoke token',
      color: 'error'
    })
  } finally {
    deleting.value = false
  }
}

function copyToken() {
  navigator.clipboard.writeText(newTokenValue.value)
  toast.add({ title: 'Copied', description: 'Token copied to clipboard', color: 'success' })
}

function formatDate(date: string | number | Date | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="space-y-6 max-w-3xl">
    <div>
      <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">
        API Tokens
      </h1>
      <p class="text-sm text-zinc-500 mt-1">
        Manage API tokens for the Ingest API endpoint (Native Better Auth)
      </p>
    </div>

    <!-- New token alert -->
    <div
      v-if="newTokenValue"
      class="border border-emerald-300 dark:border-emerald-800 rounded-xl p-4 bg-emerald-50 dark:bg-emerald-900/20"
    >
      <div class="flex items-start gap-3">
        <UIcon
          name="i-lucide-check-circle"
          class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
        />
        <div class="flex-1">
          <p class="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            Token created. Copy it now — it won't be shown again.
          </p>
          <div class="flex items-center gap-2 mt-2">
            <code class="flex-1 bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-900 dark:text-white break-all">
              {{ newTokenValue }}
            </code>
            <UButton
              icon="i-lucide-copy"
              variant="outline"
              color="neutral"
              size="sm"
              @click="copyToken"
            />
          </div>
        </div>
      </div>
      <div class="flex justify-end mt-3">
        <UButton
          label="Done"
          size="sm"
          variant="ghost"
          @click="newTokenValue = ''"
        />
      </div>
    </div>

    <!-- Create -->
    <div class="flex gap-2">
      <UInput
        v-model="tokenName"
        placeholder="Token name (e.g. Production API)"
        class="flex-1"
      />
      <UButton
        icon="i-lucide-plus"
        label="Generate Token"
        color="primary"
        :loading="status === 'pending'"
        :disabled="!tokenName"
        @click="onCreate"
      />
    </div>

    <!-- Token list -->
    <div
      v-if="status === 'pending' && !apiKeys"
      class="space-y-3"
    >
      <div
        v-for="i in 2"
        :key="i"
        class="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse"
      />
    </div>
    <template v-else>
      <div
        v-if="!apiKeys?.length"
        class="text-center py-12 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900"
      >
        <UIcon
          name="i-lucide-key"
          class="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-700"
        />
        <p class="text-zinc-600 dark:text-zinc-400 font-medium">
          No API tokens
        </p>
        <p class="text-sm text-zinc-400 mt-1">
          Generate a token to start using the Ingest API
        </p>
      </div>
      <div
        v-else
        class="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800"
      >
        <div
          v-for="token in apiKeys"
          :key="token.id"
          class="flex items-center justify-between px-4 py-3"
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <UIcon
                name="i-lucide-key"
                class="w-4 h-4 text-zinc-500"
              />
            </div>
            <div>
              <p class="text-sm font-medium text-zinc-900 dark:text-white">
                {{ token.name }}
              </p>
              <p class="text-xs text-zinc-400">
                <code class="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">ID: {{ token.id.substring(0, 8) }}...</code>
                &middot; Created {{ formatDate(token.createdAt) }}
                <span v-if="token.lastUsedAt"> &middot; Last used {{ formatDate(token.lastUsedAt) }}</span>
              </p>
            </div>
          </div>
          <UButton
            icon="i-lucide-trash-2"
            variant="ghost"
            color="error"
            size="xs"
            @click="deleteTarget = token"
          />
        </div>
      </div>
    </template>

    <UCard class="bg-primary-50/50 dark:bg-primary-950/10 border-primary-200 dark:border-primary-800">
      <div class="flex gap-4">
        <div class="shrink-0">
          <UIcon
            name="i-heroicons-information-circle-20-solid"
            class="w-6 h-6 text-primary-500"
          />
        </div>

        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-primary-900 dark:text-primary-100 uppercase tracking-wide">
            API Token Management (Native)
          </h3>

          <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            This page manages native <strong>Better Auth API Keys</strong>. These keys allow external systems to authenticate with Oasis using the <code>Authorization: Bearer &lt;token&gt;</code> header.
          </p>
        </div>
      </div>
    </UCard>

    <!-- Delete dialog -->
    <CampaignConfirmDialog
      :open="!!deleteTarget"
      title="Revoke Token"
      :description="`Revoke '${deleteTarget?.name}'? Any systems using this token will lose access.`"
      confirm-label="Revoke"
      confirm-color="error"
      :loading="deleting"
      @update:open="deleteTarget = null"
      @confirm="onDelete"
    />
  </div>
</template>
