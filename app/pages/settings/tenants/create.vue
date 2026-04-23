<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const onCreated = async () => {
  await navigateTo('/settings')
}
</script>

<template>
  <div class="max-w-2xl">
    <div class="mb-8">
      <UButton
        to="/settings"
        variant="ghost"
        color="neutral"
        icon="i-lucide-arrow-left"
        label="Back to Settings"
        class="-ml-2 mb-4"
      />
      <h1 class="text-2xl font-bold">
        Add New Property
      </h1>
      <p class="text-sm text-zinc-500 mt-1">
        Configure a new tenant for your Oasis environment.
      </p>
    </div>

    <UCard :ui="{ body: 'p-8' }">
      <TenantCreateForm @success="onCreated">
        <template #actions="{ loading }">
          <UButton
            to="/settings"
            variant="ghost"
            label="Cancel"
          />
          <UButton
            type="submit"
            label="Create Tenant"
            color="primary"
            :loading="loading"
          />
        </template>
      </TenantCreateForm>
    </UCard>
  </div>
</template>
