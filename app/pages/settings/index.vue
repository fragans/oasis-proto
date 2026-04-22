<script setup lang="ts">
definePageMeta({ layout: 'default' })

const toast = useToast()

const { data: tenantsData, refresh: refreshTenants } = await useFetch('/api/tenants')

const updating = ref<Record<string, boolean>>({})

async function toggleLive(tenantId: string, currentStatus: boolean) {
  updating.value[tenantId] = true
  try {
    const response = await $fetch(`/api/tenants/${tenantId}/is-live`, {
      method: 'PATCH',
      body: { isLive: !currentStatus }
    })

    if (response.success) {
      toast.add({
        title: 'Success',
        description: `Tenant ${tenantId} is now ${!currentStatus ? 'LIVE' : 'OFFLINE'}`,
        color: !currentStatus ? 'success' : 'neutral'
      })
      if (response.syncError) {
        toast.add({
          title: 'Warning',
          description: response.syncError,
          color: 'warning'
        })
      }
    }
    await refreshTenants()
  } catch (err) {
    toast.add({
      title: 'Error',
      description: JSON.stringify(err) || 'Failed to update status',
      color: 'error'
    })
  } finally {
    updating.value[tenantId] = false
  }
}

interface Tenant {
  id: string
  hostname: string
  apiUrl: string
  cookieName: string
  isLive: boolean
}

const deleteTarget = ref<Tenant | null>(null)
const deleting = ref(false)

async function removeTenant() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    const response = await $fetch<{ success: boolean, message: string }>(`/api/tenants/${deleteTarget.value.id}`, {
      method: 'DELETE'
    })

    if (response.success) {
      toast.add({
        title: 'Tenant Deleted',
        description: response.message,
        color: 'success'
      })
      await refreshTenants()
    }
  } catch (err: unknown) {
    toast.add({
      title: 'Error',
      description: err instanceof Error ? err.message : 'Failed to delete tenant',
      color: 'error'
    })
  } finally {
    deleting.value = false
    deleteTarget.value = null
  }
}

// Create Tenant
const showCreateModal = ref(false)
const creating = ref(false)
const newTenant = ref({
  id: '',
  hostname: '',
  apiUrl: '',
  cookieName: 'oasis_guid'
})

async function createTenant() {
  creating.value = true
  try {
    const response = await $fetch('/api/tenants', {
      method: 'POST',
      body: newTenant.value
    })

    if (response.success) {
      toast.add({
        title: 'Success',
        description: `Tenant ${newTenant.value.id} created successfully`,
        color: 'success'
      })
      showCreateModal.value = false
      newTenant.value = { id: '', hostname: '', apiUrl: '', cookieName: 'oasis_guid' }
      await refreshTenants()
    }
  } catch (err: unknown) {
    toast.add({
      title: 'Error',
      description: err instanceof Error ? err.message : 'Failed to create tenant',
      color: 'error'
    })
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-4xl">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">
          General Settings
        </h1>
        <p class="text-sm text-zinc-500 mt-1">
          Manage global configurations for your properties
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        label="Add Tenant"
        color="primary"
        @click="showCreateModal = true"
      />
    </div>

    <div class="grid gap-6">
      <template v-if="tenantsData?.tenants">
        <div
          v-for="tenant in tenantsData.tenants"
          :key="tenant.id"
          class="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900"
        >
          <div class="p-6">
            <div class="flex items-start justify-between">
              <div class="space-y-1">
                <h3 class="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  {{ tenant.id.toUpperCase() }}
                  <UBadge
                    v-if="tenant.isLive"
                    size="xs"
                    color="success"
                    variant="subtle"
                  >
                    Live
                  </UBadge>
                  <UBadge
                    v-else
                    size="xs"
                    color="neutral"
                    variant="subtle"
                  >
                    Maintenance
                  </UBadge>
                </h3>
                <p class="text-sm text-zinc-500">
                  {{ tenant.hostname }}
                </p>
              </div>

              <div class="flex items-center gap-3">
                <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Live Mode
                </span>
                <USwitch
                  :model-value="tenant.isLive"
                  :loading="updating[tenant.id]"
                  @update:model-value="toggleLive(tenant.id, tenant.isLive)"
                />
              </div>
            </div>

            <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <span class="text-xs font-medium text-zinc-400 uppercase tracking-wider">Storage Cookie</span>
                <p
                  class="text-sm font-mono bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded border border-zinc-100 dark:border-zinc-800 w-fit"
                >
                  {{ tenant.cookieName }}
                </p>
              </div>
              <div class="space-y-1">
                <span class="text-xs font-medium text-zinc-400 uppercase tracking-wider">Ingest API URL</span>
                <p
                  class="text-sm font-mono bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded border border-zinc-100 dark:border-zinc-800 w-fit"
                >
                  {{ tenant.apiUrl }}
                </p>
              </div>
            </div>
          </div>

          <div
            class="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center"
          >
            <p class="text-xs text-zinc-500 max-w-1/2">
              When Live Mode is enabled, the Edge worker will inject campaigns into the live site.
            </p>
            <div class="flex items-center gap-2">
              <UButton
                variant="link"
                color="error"
                size="xs"
                icon="i-lucide-trash-2"
                @click="deleteTarget = tenant"
              >
                Delete Tenant
              </UButton>
              <UButton
                variant="link"
                color="primary"
                size="xs"
                trailing-icon="i-lucide-external-link"
                :to="`https://${tenant.hostname}`"
                target="_blank"
              >
                Visit Site
              </UButton>
            </div>
          </div>
        </div>
      </template>

      <div
        v-else
        class="py-12 text-center"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="w-8 h-8 animate-spin mx-auto text-zinc-300"
        />
      </div>
    </div>

    <!-- Info Card -->
    <UCard class="bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-200 dark:border-indigo-800">
      <div class="flex gap-4">
        <div class="shrink-0">
          <UIcon
            name="i-lucide-info"
            class="w-6 h-6 text-indigo-500"
          />
        </div>

        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-indigo-900 dark:text-indigo-100 uppercase tracking-wide">
            Edge Synchronization
          </h3>

          <p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Changing the <strong>Live Mode</strong> status automatically triggers a synchronization to the Cloudflare
            Edge
            KV.
            The <code>oasis-edge</code> worker uses this flag to determine if it should serve personalized content or
            act as
            a transparent proxy.
          </p>

          <div class="text-xs text-zinc-500 pt-2 border-t border-indigo-100 dark:border-indigo-900/50">
            Current Environment: <UBadge
              size="xs"
              variant="soft"
              color="neutral"
            >
              Staging
            </UBadge>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Delete Confirmation -->
    <CampaignConfirmDialog
      :open="!!deleteTarget"
      title="Delete Tenant"
      :description="`Are you sure you want to delete ${deleteTarget?.id?.toUpperCase()}? This will permanently remove all related campaigns from the database and Cloudflare KV.`"
      confirm-label="Delete Everything"
      confirm-color="error"
      :loading="deleting"
      @update:open="deleteTarget = null"
      @confirm="removeTenant"
    />

    <!-- Create Tenant Modal -->
    <UModal
      v-model:open="showCreateModal"
      title="Add New Property"
    >
      <template #body>
        <form
          class="space-y-4"
          @submit.prevent="createTenant"
        >
          <UFormField
            label="Unique ID"
            help="Internal slug, e.g. 'kompasid-staging'"
          >
            <UInput
              v-model="newTenant.id"
              placeholder="tenant-id"
            />
          </UFormField>

          <UFormField
            label="Public Hostname"
            help="The domain bound to the Cloudflare Worker"
          >
            <UInput
              v-model="newTenant.hostname"
              placeholder="oasis-edge.example.com"
            />
          </UFormField>

          <UFormField
            label="Origin URL (Host Target)"
            help="Where the worker fetches content from"
          >
            <UInput
              v-model="newTenant.apiUrl"
              placeholder="https://www.example.com"
            />
          </UFormField>

          <UFormField
            label="Storage Cookie"
            help="Name of the cookie to store the GUID"
          >
            <UInput
              v-model="newTenant.cookieName"
              placeholder="oasis_guid"
            />
          </UFormField>

          <div class="flex justify-end gap-3 mt-6">
            <UButton
              variant="ghost"
              label="Cancel"
              @click="showCreateModal = false"
            />
            <UButton
              type="submit"
              label="Create Tenant"
              color="primary"
              :loading="creating"
            />
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>
