<script setup lang="ts">
// This page redirects the organization root to the primary dashboard (campaigns)
definePageMeta({
  middleware: [
    function (to) {
      const org = to.params.org
      return navigateTo(`/${org}/campaigns`)
    }
  ]
})
</script>

<template>
  <div />
</template>
