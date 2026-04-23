<script setup lang="ts">
definePageMeta({
  layout: false
})

const onCreated = async () => {
  // After the first tenant is created, redirect to the dashboard
  await navigateTo('/campaigns')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold tracking-tight">
          Welcome to Oasis
        </h1>
        <p class="mt-2 text-sm text-muted">
          To get started, please initialize your first tenant.
        </p>
      </div>

      <UCard variant="soft">
        <TenantCreateForm @success="onCreated" />
      </UCard>
      <p class="text-center text-xs text-muted">
        You can manage more tenants later in the settings.
      </p>
    </div>
  </div>
</template>
