<script setup lang="ts">
const { session, client, user } = useUserSession()
const toast = useToast()

const isSuperAdmin = computed(() => user.value?.role === 'super_admin')

// Fetch organizations the user belongs to
const { data: userOrganizations } = await useAsyncData('user-organizations', async () => {
  // Always attempt to fetch from our organizations API first.
  // The server-side API correctly handles Super Admin (returns all)
  // and regular users (returns only active or joined if implemented).
  try {
    const res = await $fetch<{ organizations: Organization[] }>('/api/organizations', {
      headers: useRequestHeaders(['cookie'])
    })
    if (res.organizations?.length > 0) {
      return res.organizations
    }
  } catch (e: unknown) {
    console.log(e instanceof Error ? e.message : 'Error fetching /api/organizations')
  }

  // Fallback: Fetch joined organizations via Better Auth client (Client-side only)
  if (import.meta.client && client) {
    const res = await client.organization.list()
    return (res.data as unknown as Organization[]) || []
  }

  return []
}, {
  watch: [user]
})

const organizations = computed(() => userOrganizations.value || [])

const route = useRoute()
const activeOrg = computed(() => {
  const activeId = session.value?.activeOrganizationId
  if (activeId) {
    const org = organizations.value.find(o => o.id === activeId)
    if (org) return org
  }

  // Fallback: Use URL slug for Super Admin "Browsing Mode"
  const slug = route.params.org as string
  if (isSuperAdmin.value && slug) {
    return organizations.value.find(o => o.slug === slug)
  }

  return null
})

interface Organization {
  id: string
  name: string
  slug: string | null
  logo?: string | null
}

async function switchOrganization(org: Organization) {
  const activeId = session.value?.activeOrganizationId
  if (org.id !== activeId) {
    try {
      // Super Admins skip setActive to avoid membership errors and rely on Browsing Mode
      if (isSuperAdmin.value) {
        navigateTo({
          name: route.name as string,
          params: { ...route.params, org: org.slug },
          query: route.query,
          hash: route.hash
        })
        return
      }

      if (!client) return
      await client.organization.setActive({ organizationId: org.id })

      toast.add({
        title: 'Organization switched',
        description: `Switched to ${org.name}`,
        color: 'success'
      })

      // Preserve current path by replacing the :org param
      navigateTo({
        name: route.name as string,
        params: { ...route.params, org: org.slug },
        query: route.query,
        hash: route.hash
      })
    } catch (err) {
      toast.add({
        title: 'Failed to switch organization',
        description: err instanceof Error ? err.message : 'Unknown error',
        color: 'error'
      })
    }
  }
}

const dropdownItems = computed(() => [
  organizations.value.map(org => ({
    label: org.name,
    icon: 'i-lucide-building-2',
    onSelect: () => switchOrganization(org)
  }))
])

const showSwitcher = computed(() => isSuperAdmin.value || organizations.value.length > 1)
</script>

<template>
  <div class="flex items-center gap-3">
    <UDropdownMenu
      v-if="showSwitcher"
      :items="dropdownItems"
      :content="{ align: 'end' }"
      :ui="{ content: 'min-w-(--reka-dropdown-menu-trigger-width)' }"
    >
      <UButton
        color="neutral"
        variant="subtle"
        icon="i-lucide-building"
        :label="activeOrg?.name || 'Switch Organization'"
        trailing-icon="i-lucide-chevrons-up-down"
        class="w-56 justify-between"
      />
    </UDropdownMenu>

    <div
      v-else-if="activeOrg"
      class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-muted text-xs font-medium"
    >
      <UIcon
        name="i-lucide-building"
        class="size-3.5 text-muted-foreground"
      />
      <span>{{ activeOrg.name }}</span>
    </div>
  </div>
</template>
