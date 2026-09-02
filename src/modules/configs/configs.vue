<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Navigation from '@/components/Navigation.vue'
import { useNotification } from '@/composables/useNotification'
import configs from './service'

const { notify } = useNotification()
const serviceUrl = ref('')
const savedUrl = ref('')
const loading = ref(false)
const saving = ref(false)

const hasChanges = computed(() => serviceUrl.value !== savedUrl.value)
const isValidUrl = computed(() => {
  if (!serviceUrl.value.trim()) return false
  try {
    const url = new URL(serviceUrl.value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
})

async function loadConfig() {
  loading.value = true
  try {
    const response = await configs.get_system_config('HACA_SERVICE_URL')
    const data = response.data
    serviceUrl.value = typeof data === 'object'
      ? (data as { value?: string }).value ?? ''
      : data
    savedUrl.value = serviceUrl.value
  } catch {
    notify('Failed to load HACA configuration', 'error')
  } finally {
    loading.value = false
  }
}

async function saveConfig() {
  saving.value = true
  try {
    const url = serviceUrl.value.trim()
    await configs.update_system_config('HACA_SERVICE_URL', url)
    serviceUrl.value = url
    savedUrl.value = url
    notify('HACA Service URL updated successfully!', 'success')
  } catch {
    notify('Failed to update HACA Service URL', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>

<template>
  <Navigation title="HACA Configuration">
    <div class="mx-auto max-w-4xl">
      <section class="mb-6 overflow-hidden rounded-2xl border border-base-300 bg-base-200/50">
        <div class="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <div class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-content shadow-sm">
              <i class="ph ph-plugs-connected text-2xl"></i>
            </div>
            <div>
              <h1 class="text-xl font-bold tracking-tight">HACA Service</h1>
              <p class="mt-1 text-sm text-base-content/60">Manage the endpoint used to connect with the HACA service.</p>
            </div>
          </div>
          <div class="flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs">
            <span class="relative flex h-2.5 w-2.5">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-50"></span>
              <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-success"></span>
            </span>
            <span class="font-medium">System configuration</span>
          </div>
        </div>
      </section>

      <section class="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
        <header class="flex flex-col gap-4 border-b border-base-300 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex min-w-0 items-center gap-3">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <i class="ph ph-link text-xl"></i>
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="font-bold">Service Endpoint</h2>
                <span class="badge badge-sm" :class="hasChanges ? 'badge-warning' : 'badge-ghost'">{{ hasChanges ? 'Unsaved' : 'Saved' }}</span>
              </div>
              <p class="mt-0.5 text-xs text-base-content/50">HACA_SERVICE_URL</p>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" :disabled="loading || saving" @click="loadConfig">
            <i class="ph ph-arrows-clockwise" :class="{ 'animate-spin': loading }"></i>
            Reload
          </button>
        </header>

        <div class="p-6">
          <label class="form-control w-full">
            <div class="label px-0 pt-0">
              <span class="label-text font-semibold">HACA Service URL</span>
            </div>
            <div class="relative">
              <i class="ph ph-globe absolute left-4 top-1/2 z-[1] -translate-y-1/2 text-lg text-base-content/40"></i>
              <input
                v-model="serviceUrl"
                type="url"
                class="input input-bordered h-13 w-full pl-12 pr-4 font-mono text-sm focus:input-primary"
                :class="{ 'input-error': serviceUrl && !isValidUrl }"
                placeholder="https://haca.example.com"
                autocomplete="url"
                spellcheck="false"
                :disabled="loading"
                @keyup.enter="isValidUrl && hasChanges && saveConfig()"
              />
              <span v-if="loading" class="loading loading-spinner loading-sm absolute right-4 top-1/2 -translate-y-1/2"></span>
            </div>
            <div class="label px-0 pb-0">
              <span class="label-text-alt flex items-center gap-1.5" :class="isValidUrl ? 'text-success' : 'text-base-content/50'">
                <i :class="isValidUrl ? 'ph ph-check-circle' : 'ph ph-info'"></i>
                {{ isValidUrl ? 'Valid service URL' : 'Enter a complete URL using http:// or https://' }}
              </span>
            </div>
          </label>

          <div class="mt-6 flex flex-col gap-3 rounded-xl border border-info/20 bg-info/5 p-4 sm:flex-row sm:items-start">
            <i class="ph ph-info mt-0.5 text-lg text-info"></i>
            <div>
              <p class="text-sm font-semibold">Before updating the endpoint</p>
              <p class="mt-1 text-xs leading-relaxed text-base-content/60">Make sure the target service is reachable. The new endpoint will be used by subsequent HACA requests.</p>
            </div>
          </div>
        </div>

        <footer class="flex justify-end border-t border-base-300 bg-base-200/30 px-6 py-4">
          <button class="btn btn-primary min-w-32" :disabled="loading || saving || !hasChanges || !isValidUrl" @click="saveConfig">
            <span v-if="saving" class="loading loading-spinner loading-xs"></span>
            <i v-else class="ph ph-floppy-disk"></i>
            {{ saving ? 'Saving' : 'Save changes' }}
          </button>
        </footer>
      </section>
    </div>
  </Navigation>
</template>
