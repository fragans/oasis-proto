<script setup lang="ts">
interface Organization {
  id: string
  name: string
  slug: string
  logo?: string
}

const { client } = useUserSession()
const loading = ref(true)
const organizations = ref<Organization[]>([])

definePageMeta({
  layout: false
})

onMounted(async () => {
  if (!client) return
  try {
    const { data } = await client.organization.list()
    organizations.value = (data as Organization[]) || []
  } catch (err) {
    console.error('Failed to fetch organizations:', err)
  } finally {
    loading.value = false
  }
})

async function selectOrganization(org: Organization) {
  if (!client) return
  try {
    await client.organization.setActive({ organizationId: org.id })
    navigateTo(`/${org.slug}/campaigns/on-site-messages`)
  } catch (err) {
    console.error('Failed to set active organization:', err)
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 font-sans">
    <div class="max-w-xl w-full">
      <div class="text-center mb-10">
        <h1 class="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
          Welcome to Oasis
        </h1>
        <p class="text-zinc-500">
          Select an organization to continue to your dashboard
        </p>
      </div>

      <div
        v-if="loading"
        class="flex justify-center p-12"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="w-10 h-10 animate-spin text-zinc-400"
        />
      </div>

      <div
        v-else-if="organizations.length > 0"
        class="grid gap-4"
      >
        <UCard
          v-for="org in organizations"
          :key="org.id"
          class="cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-all group"
          @click="selectOrganization(org)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <UAvatar
                :src="org.logo"
                :alt="org.name"
                size="lg"
                class="bg-zinc-100 dark:bg-zinc-800"
              />
              <div>
                <h3 class="font-semibold text-zinc-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {{ org.name }}
                </h3>
                <p class="text-sm text-zinc-500">
                  {{ org.slug }}
                </p>
              </div>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="w-5 h-5 text-zinc-300 group-hover:text-zinc-500 transition-colors"
            />
          </div>
        </UCard>
      </div>

      <div
        v-else
        class="text-center p-12 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800"
      >
        <p class="text-zinc-500">
          No organizations found.
        </p>
      </div>

      <div class="mt-8 text-center">
        <UButton
          to="/login"
          variant="ghost"
          color="neutral"
          size="sm"
          icon="i-lucide-arrow-left"
          label="Back to Login"
        />
      </div>
    </div>
  </div>
</template>
