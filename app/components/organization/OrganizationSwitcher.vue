<script setup lang="ts">
const { allOrganizations, currentOrganization, switchOrganization, isSuperAdmin } = useOrganization()

const items = computed(() => allOrganizations.value.map(org => ({
  label: org.id,
  description: org.hostname,
  value: org.id,
  icon: 'i-lucide-building-2'
})))

const selected = computed({
  get: () => items.value.find(i => i.value === currentOrganization.value?.id),
  set: (val) => {
    if (val?.value && val.value !== currentOrganization.value?.id) {
      switchOrganization(val.value)
    }
  }
})

const showSwitcher = computed(() => isSuperAdmin.value || allOrganizations.value.length > 1)
</script>

<template>
  <div class="flex items-center gap-3">
    <USelectMenu
      v-if="showSwitcher"
      v-model="selected"
      :items="items"
      placeholder="Switch Organization"
      class="w-56"
      color="neutral"
      variant="subtle"
      :ui="{
        trailingIcon: 'i-lucide-chevrons-up-down',
        itemLeadingIcon: 'text-primary'
      }"
    >
      <template #leading>
        <UIcon
          name="i-lucide-building"
          class="size-4 text-muted-foreground"
        />
      </template>

      <template #item-label="{ item }">
        <div class="flex flex-col gap-0.5">
          <span class="font-medium text-sm">{{ item.label }}</span>
          <span class="text-xs text-muted-foreground">{{ item.description }}</span>
        </div>
      </template>
    </USelectMenu>

    <div
      v-else-if="currentOrganization"
      class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-muted text-xs font-medium"
    >
      <UIcon
        name="i-lucide-building"
        class="size-3.5 text-muted-foreground"
      />
      <span>{{ currentOrganization.id }}</span>
    </div>
  </div>
</template>
