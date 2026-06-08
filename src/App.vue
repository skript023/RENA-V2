<script setup lang="ts">
  import { RouterView } from 'vue-router';
  import Notification from '@/components/Notification.vue';
  import ConfirmDialog from './components/ConfirmDialog.vue';
</script>

<template>
  <router-view/>
  <Notification ref="notification" />
  <ConfirmDialog />
</template>