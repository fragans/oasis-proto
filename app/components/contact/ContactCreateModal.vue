<script setup lang="ts">
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  'update:open': [open: boolean]
  'created': []
}>()

const { createContact } = useContact()
const saving = ref(false)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: 'unknown' as const,
  birthday: '',
  city: '',
  province: '',
  country: 'ID',
  language: 'id',
  tags: ''
})

async function onSubmit() {
  saving.value = true
  try {
    await createContact({
      ...form,
      birthday: form.birthday || undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()) : []
    })
    Object.assign(form, { firstName: '', lastName: '', email: '', phone: '', gender: 'unknown', birthday: '', city: '', province: '', country: 'ID', language: 'id', tags: '' })
    emit('created')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <template #header>
      <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">
        Add Contact
      </h3>
    </template>

    <template #body>
      <form
        class="space-y-4"
        @submit.prevent="onSubmit"
      >
        <div class="grid grid-cols-2 gap-3">
          <UFormField label="First Name">
            <UInput
              v-model="form.firstName"
              placeholder="John"
            />
          </UFormField>
          <UFormField label="Last Name">
            <UInput
              v-model="form.lastName"
              placeholder="Doe"
            />
          </UFormField>
        </div>
        <UFormField label="Email">
          <UInput
            v-model="form.email"
            type="email"
            placeholder="john@example.com"
          />
        </UFormField>
        <UFormField label="Phone">
          <UInput
            v-model="form.phone"
            placeholder="+62..."
          />
        </UFormField>
        <div class="grid grid-cols-2 gap-3">
          <UFormField label="City">
            <UInput
              v-model="form.city"
              placeholder="Jakarta"
            />
          </UFormField>
          <UFormField label="Province">
            <UInput
              v-model="form.province"
              placeholder="DKI Jakarta"
            />
          </UFormField>
        </div>
        <UFormField label="Birthday">
          <UInput
            v-model="form.birthday"
            type="date"
          />
        </UFormField>
        <UFormField
          label="Tags"
          hint="Comma-separated"
        >
          <UInput
            v-model="form.tags"
            placeholder="vip, subscriber"
          />
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          label="Cancel"
          @click="emit('update:open', false)"
        />
        <UButton
          label="Create Contact"
          color="primary"
          :loading="saving"
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
