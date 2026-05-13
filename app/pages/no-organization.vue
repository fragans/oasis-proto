<script setup lang="ts">
definePageMeta({
  layout: false
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 font-sans">
    <UCard class="max-w-md w-full text-center p-6 shadow-xl border-zinc-200 dark:border-zinc-800">
      <div class="flex justify-center mb-6">
        <div class="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full">
          <UIcon
            name="i-lucide-shield-alert"
            class="w-10 h-10 text-zinc-500"
          />
        </div>
      </div>

      <h1 class="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
        No Organization Found
      </h1>
      <p class="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
        You don't belong to any organization. Please contact your <span class="font-semibold text-zinc-900 dark:text-zinc-200">Super Admin</span> to request access or join a team.
      </p>

      <div class="flex flex-col gap-3">
        <UButton
          label="Back to Login"
          variant="outline"
          color="neutral"
          block
          to="/login"
        />
      </div>
    </UCard>
  </div>
</template>
