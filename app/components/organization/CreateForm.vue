<script setup lang="ts">
const props = defineProps<{
  redirectOnSuccess?: string
}>()

const emit = defineEmits<{
  success: [organizationId: string]
}>()

const toast = useToast()
const creating = ref(false)
const newOrganization = ref({
  id: '',
  hostname: '',
  apiUrl: '',
  cookieName: 'oasis_guid'
})

async function createOrganization() {
  creating.value = true
  try {
    const response = await $fetch<{ success: boolean, message?: string }>('/api/organizations', {
      method: 'POST',
      body: newOrganization.value
    })

    if (response.success) {
      toast.add({
        title: 'Success',
        description: `Organization ${newOrganization.value.id} created successfully`,
        color: 'success'
      })

      const createdId = newOrganization.value.id
      emit('success', createdId)

      if (props.redirectOnSuccess) {
        await navigateTo(props.redirectOnSuccess)
      }
    }
  } catch (err: unknown) {
    toast.add({
      title: 'Error',
      description: err instanceof Error ? err.message : 'Failed to create organization',
      color: 'error'
    })
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <form
    class="space-y-4"
    @submit.prevent="createOrganization"
  >
    <UFormField
      label="Unique ID"
      help="Internal slug, e.g. 'kompasid-staging'"
    >
      <UInput
        v-model="newOrganization.id"
        placeholder="organization-id"
        required
      />
    </UFormField>

    <UFormField
      label="Public Hostname"
      help="The domain bound to the Cloudflare Worker"
    >
      <UInput
        v-model="newOrganization.hostname"
        placeholder="oasis-edge.example.com"
        required
      />
    </UFormField>

    <UFormField
      label="Origin URL (Host Target)"
      help="Where the worker fetches content from"
    >
      <UInput
        v-model="newOrganization.apiUrl"
        placeholder="https://www.example.com"
        required
      />
    </UFormField>

    <UFormField
      label="Storage Cookie"
      help="Name of the cookie to store the GUID"
    >
      <UInput
        v-model="newOrganization.cookieName"
        placeholder="oasis_guid"
        required
      />
    </UFormField>

    <div class="flex justify-end gap-3 mt-6">
      <slot
        name="actions"
        :loading="creating"
      >
        <UButton
          type="submit"
          label="Create Organization"
          color="primary"
          :loading="creating"
          block
        />
      </slot>
    </div>
  </form>
</template>
