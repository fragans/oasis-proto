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
</script>

<template>
  <div class="space-y-6 max-w-4xl">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">
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
        to="/settings/tenants/create"
      />
    </div>

    <div class="grid gap-6">
      <template v-if="tenantsData?.tenants">
        <UCard
          v-for="tenant in tenantsData.tenants"
          :key="tenant.id"
          :ui="{
            root: 'rounded-xl overflow-hidden',
            footer: 'flex justify-between items-center'
          }"
        >
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <h3 class="text-lg font-semibold flex items-center gap-2">
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
              <p class="text-sm">
                {{ tenant.hostname }}
              </p>
            </div>

            <div class="flex items-center gap-3">
              <span class="text-sm font-medium text-muted">
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
              <p class="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Storage Cookie
              </p>
              <UBadge
                color="neutral"
                variant="outline"
                size="lg"
                class="font-mono"
              >
                {{ tenant.cookieName }}
              </UBadge>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Ingest API URL
              </p>
              <UBadge
                color="neutral"
                variant="outline"
                size="lg"
                class="font-mono"
              >
                {{ tenant.apiUrl }}
              </UBadge>
            </div>
          </div>

          <template #footer>
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
          </template>
        </UCard>
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
    <div class="fixed bottom-4 right-4">
      <div class="max-w-md mx-auto">
        <UCard variant="subtle">
          <div class="flex gap-4">
            <div class="space-y-3">
              <h3 class="text-sm font-semibold text-indigo-900 uppercase tracking-wide">
                Edge Synchronization
              </h3>
              <p class="text-sm text-zinc-600 leading-relaxed">
                Changing the <strong>Live Mode</strong> status automatically triggers a synchronization to the Cloudflare
                Edge
                KV.
                The <code>oasis-edge</code> worker uses this flag to determine if it should serve personalized content or
                act as
                a transparent proxy.
              </p>
              <USeparator />
              <div class="text-xs text-zinc-500 pt-2">
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
      </div>
    </div>

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
  </div>
</template>
