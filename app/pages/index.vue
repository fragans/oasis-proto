<script setup lang="ts">
// This page is a placeholder for the root path.
// While the organization.global.ts handles routing transitions,
// this script ensures the initial landing is handled after session hydration.
const { user, client } = useUserSession()

watch(user, async (val) => {
  if (val && client) {
    const isSuperAdmin = val.role === 'super_admin'
    const { data: orgs } = await client.organization.list()

    if (!orgs || orgs.length === 0) {
      return navigateTo(isSuperAdmin ? '/initiate-organization' : '/no-organization')
    }

    return navigateTo('/organizations/select')
  }
}, { immediate: true })
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <UIcon
      name="i-lucide-loader-2"
      class="w-8 h-8 animate-spin"
    />
  </div>
</template>
