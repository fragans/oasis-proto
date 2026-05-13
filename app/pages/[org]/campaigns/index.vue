<script setup lang="ts">
definePageMeta({
  middleware: [
    function (to) {
      const org = to.params.org
      return navigateTo(`/${org}/campaigns/on-site-messages`)
    }
  ]
})
</script>

<template>
  <div />
</template>
