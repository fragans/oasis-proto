<script setup lang="ts">
const { client } = useUserSession()
const toast = useToast()
const loading = ref(false)

definePageMeta({
  layout: false
})

const state = reactive({
  name: '',
  slug: ''
})

async function onSubmit() {
  if (!client) return
  loading.value = true

  try {
    const { data, error } = await client.organization.create({
      name: state.name,
      slug: state.slug
    })

    if (error) {
      toast.add({ title: 'Error', description: error.message, color: 'error' })
      return
    }

    if (data) {
      toast.add({ title: 'Success', description: 'Organization created successfully', color: 'success' })
      // Redirect to the newly created org's dashboard
      navigateTo(`/${data.slug}/campaigns/on-site-messages`)
    }
  } catch (err) {
    console.error(err)
    toast.add({ title: 'Error', description: 'An unexpected error occurred', color: 'error' })
  } finally {
    loading.value = false
  }
}

// Auto-generate slug from name
watch(() => state.name, (newName) => {
  state.slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 font-sans">
    <UCard class="max-w-md w-full shadow-xl border-zinc-200 dark:border-zinc-800">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">
            Create First Organization
          </h1>
          <p class="text-sm text-zinc-500 mt-1">
            Welcome Super Admin. Please set up the first organization.
          </p>
        </div>
      </template>

      <UForm
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Organization Name"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            placeholder="e.g. Kompas.com"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Organization Slug"
          name="slug"
          required
          help="Used in the URL: oasis.com/my-slug"
        >
          <UInput
            v-model="state.slug"
            placeholder="e.g. kompas-com"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          block
          :loading="loading"
          label="Create Organization"
        />
      </UForm>
    </UCard>
  </div>
</template>
