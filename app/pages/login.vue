<script setup lang="ts">
import { z } from 'zod'

definePageMeta({
  layout: false
})
const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters')
})

const state = reactive({ email: '', password: '' })
const { signIn } = useUserSession()
const toast = useToast()
const loading = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    await signIn.email({
      email: state.email,
      password: state.password
    }, {
      onSuccess: () => {
        toast.add({ title: 'Welcome back!', color: 'success', icon: 'i-lucide-check-circle' })
        navigateTo('/')
      },
      onError: (context) => {
        toast.add({ title: 'Login failed', description: context.error.message, color: 'error', icon: 'i-lucide-x-circle' })
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong'
    toast.add({ title: 'An error occurred', description: message, color: 'error', icon: 'i-lucide-alert-triangle' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
    <UCard class="w-full max-w-md shadow-xl border-muted">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-default">
            Oasis
          </h1>
          <p class="text-sm text-muted">
            Sign in to your account
          </p>
        </div>
      </template>

      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          name="email"
          label="Email"
          required
        >
          <UInput
            v-model="state.email"
            type="email"
            placeholder="name@company.com"
            icon="i-lucide-mail"
            class="w-full"
          />
        </UFormField>

        <UFormField
          name="password"
          label="Password"
          required
        >
          <UInput
            v-model="state.password"
            type="password"
            placeholder="••••••••"
            icon="i-lucide-lock"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          block
          :loading="loading"
          label="Sign In"
        />
      </UForm>
    </UCard>
  </div>
</template>
