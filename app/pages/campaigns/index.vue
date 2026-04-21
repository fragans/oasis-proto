<script setup lang="ts">
definePageMeta({
  middleware: [
    function (to, from) {
      if (to.path === '/campaigns') {
        return navigateTo('/campaigns/on-site-messages')
      }
    }
  ]
})
</script>

<template>
  <div />
</template>
