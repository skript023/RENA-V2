<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Navigation from '@/components/Navigation.vue'
import { useNotification } from '@/composables/useNotification'
import configs from './service'
import type { MusicCommand, SaveJsonCommand, VideoCommand } from './dto/configs.dto'

type Category = 'music' | 'video' | 'dump_json' | 'haca'

const { notify } = useNotification()
const categories: Array<{ id: Category; label: string; description: string; icon: string; tone: string }> = [
  { id: 'music', label: 'Music Download', description: 'Audio download command settings', icon: 'ph ph-music-notes', tone: 'text-violet-600 bg-violet-500/10' },
  { id: 'video', label: 'Video Download', description: 'Video download command settings', icon: 'ph ph-video-camera', tone: 'text-blue-600 bg-blue-500/10' },
  { id: 'dump_json', label: 'JSON Export', description: 'JSON dump and export behavior', icon: 'ph ph-brackets-curly', tone: 'text-amber-600 bg-amber-500/10' },
  { id: 'haca', label: 'HACA Service', description: 'External service endpoint URL', icon: 'ph ph-plugs-connected', tone: 'text-emerald-600 bg-emerald-500/10' }
]

const selectedCategory = ref<Category>('music')
const configText = ref('')
const savedText = ref('')
const loading = ref(false)
const saving = ref(false)
const activeCategory = computed(() => categories.find(item => item.id === selectedCategory.value)!)
const hasChanges = computed(() => configText.value !== savedText.value)
const lineCount = computed(() => configText.value ? configText.value.split('\n').length : 0)
const isJson = computed(() => selectedCategory.value !== 'haca')
const validJson = computed(() => {
  if (!isJson.value || !configText.value.trim()) return true
  try { JSON.parse(configText.value); return true } catch { return false }
})

async function loadConfig() {
  loading.value = true
  try {
    let response
    switch (selectedCategory.value) {
      case 'music': response = await configs.get_config<MusicCommand>('download', 'music'); break
      case 'video': response = await configs.get_config<VideoCommand>('download', 'video'); break
      case 'dump_json': response = await configs.get_config<SaveJsonCommand>('dump_json'); break
      case 'haca': response = await configs.get_system_config('HACA_SERVICE_URL'); break
    }
    const data = response.data
    configText.value = selectedCategory.value === 'haca'
      ? (typeof data === 'object' ? (data as { value?: string }).value ?? JSON.stringify(data, null, 2) : data)
      : JSON.stringify(data, null, 2)
    savedText.value = configText.value
  } catch { notify('Failed to load config', 'error') }
  finally { loading.value = false }
}

function formatJson() {
  try { configText.value = JSON.stringify(JSON.parse(configText.value), null, 2); notify('JSON formatted', 'success') }
  catch { notify('JSON is not valid', 'error') }
}

async function saveConfig() {
  saving.value = true
  try {
    if (selectedCategory.value === 'haca') {
      let url = configText.value.trim()
      try { url = JSON.parse(configText.value)?.value ?? url } catch { /* Raw URL is valid here. */ }
      await configs.update_system_config('HACA_SERVICE_URL', url)
      notify('HACA Service URL updated successfully!', 'success')
    } else {
      const parsed = JSON.parse(configText.value)
      if (selectedCategory.value === 'dump_json') {
        await configs.update_config({ name: 'dump_json', type: '', payload: parsed })
      } else {
        await configs.update_config({
          name: 'download', type: selectedCategory.value,
          payload: selectedCategory.value === 'music' ? parsed.music ?? parsed : parsed.video ?? parsed
        })
      }
      notify('Config saved successfully!', 'success')
    }
    savedText.value = configText.value
  } catch { notify('Invalid JSON or save failed', 'error') }
  finally { saving.value = false }
}

watch(selectedCategory, loadConfig)
onMounted(loadConfig)
</script>

<template>
  <Navigation title="Configuration">
    <div class="mx-auto max-w-[1500px]">
      <section class="mb-6 overflow-hidden rounded-2xl border border-base-300 bg-base-200/50">
        <div class="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <div class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-content shadow-sm">
              <i class="ph ph-sliders-horizontal text-2xl"></i>
            </div>
            <div><h1 class="text-xl font-bold tracking-tight">Configuration Center</h1><p class="mt-1 text-sm text-base-content/60">Manage worker commands and external service settings.</p></div>
          </div>
          <div class="flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs">
            <span class="relative flex h-2.5 w-2.5"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-50"></span><span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-success"></span></span>
            <span class="font-medium">Configuration service online</span>
          </div>
        </div>
      </section>

      <div class="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside class="h-fit rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm">
          <div class="px-3 pb-3 pt-2"><p class="text-xs font-bold uppercase tracking-[0.14em] text-base-content/40">Configuration</p><p class="mt-1 text-sm text-base-content/60">Select a module to edit</p></div>
          <div class="space-y-1.5">
            <button v-for="category in categories" :key="category.id" type="button" class="group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all" :class="selectedCategory === category.id ? 'border-primary/30 bg-primary/10 shadow-sm' : 'border-transparent hover:border-base-300 hover:bg-base-200/60'" @click="selectedCategory = category.id">
              <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl" :class="category.tone"><i :class="`${category.icon} text-xl`"></i></span>
              <span class="min-w-0 flex-1"><span class="block truncate text-sm font-semibold">{{ category.label }}</span><span class="mt-0.5 block truncate text-xs text-base-content/50">{{ category.description }}</span></span>
              <i class="ph ph-caret-right text-sm transition-all" :class="selectedCategory === category.id ? 'text-primary' : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-50'"></i>
            </button>
          </div>
          <div class="mx-2 mt-4 rounded-xl bg-info/10 p-3 text-xs leading-relaxed text-base-content/60"><div class="mb-1 flex items-center gap-1.5 font-semibold text-info"><i class="ph ph-info"></i>Quick tip</div>Review the configuration before saving. Changes take effect on the next job run.</div>
        </aside>

        <section class="min-w-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
          <header class="flex flex-col gap-4 border-b border-base-300 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex min-w-0 items-center gap-3">
              <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl" :class="activeCategory.tone"><i :class="`${activeCategory.icon} text-xl`"></i></span>
              <div class="min-w-0"><div class="flex items-center gap-2"><h2 class="truncate font-bold">{{ activeCategory.label }}</h2><span class="badge badge-sm" :class="hasChanges ? 'badge-warning' : 'badge-ghost'">{{ hasChanges ? 'Unsaved' : 'Saved' }}</span></div><p class="mt-0.5 truncate text-xs text-base-content/50">{{ activeCategory.description }}</p></div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button class="btn btn-ghost btn-sm" :disabled="loading || saving" @click="loadConfig"><i class="ph ph-arrows-clockwise" :class="{ 'animate-spin': loading }"></i>Reload</button>
              <button v-if="isJson" class="btn btn-outline btn-sm" :disabled="loading || saving" @click="formatJson"><i class="ph ph-magic-wand"></i>Format JSON</button>
              <button class="btn btn-primary btn-sm min-w-28" :disabled="loading || saving || !hasChanges || !validJson" @click="saveConfig"><span v-if="saving" class="loading loading-spinner loading-xs"></span><i v-else class="ph ph-floppy-disk"></i>{{ saving ? 'Saving' : 'Save changes' }}</button>
            </div>
          </header>

          <div class="relative bg-neutral text-neutral-content">
            <div v-if="loading" class="absolute inset-0 z-10 grid place-items-center bg-neutral/80 backdrop-blur-[1px]"><div class="flex items-center gap-3 rounded-xl bg-neutral-content/10 px-4 py-3 text-sm"><span class="loading loading-spinner loading-sm"></span>Loading configuration...</div></div>
            <div class="flex items-center justify-between border-b border-neutral-content/10 px-5 py-2.5 text-xs text-neutral-content/50">
              <div class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full bg-error/80"></span><span class="h-2.5 w-2.5 rounded-full bg-warning/80"></span><span class="h-2.5 w-2.5 rounded-full bg-success/80"></span><span class="ml-2 font-mono">{{ selectedCategory === 'haca' ? 'service.env' : `${selectedCategory}.json` }}</span></div><span>{{ lineCount }} lines</span>
            </div>
            <textarea v-model="configText" class="config-editor block h-[520px] w-full resize-y border-0 bg-transparent px-5 py-4 font-mono text-[13px] leading-6 text-neutral-content outline-none placeholder:text-neutral-content/30" :placeholder="selectedCategory === 'haca' ? 'https://service.example.com' : '{\n  &quot;key&quot;: &quot;value&quot;\n}'" spellcheck="false" :disabled="loading"></textarea>
          </div>
          <footer class="flex flex-col gap-2 border-t border-base-300 px-5 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-2" :class="validJson ? 'text-success' : 'text-error'"><i :class="validJson ? 'ph ph-check-circle' : 'ph ph-warning-circle'"></i><span v-if="isJson">{{ validJson ? 'Valid JSON syntax' : 'Invalid JSON syntax — fix it before saving' }}</span><span v-else>Plain text service URL</span></div>
            <span class="text-base-content/40">UTF-8 · {{ configText.length.toLocaleString() }} characters</span>
          </footer>
        </section>
      </div>
    </div>
  </Navigation>
</template>

<style scoped>
.config-editor { scrollbar-color: color-mix(in oklab, currentColor 25%, transparent) transparent; tab-size: 2; }
.config-editor:disabled { cursor: wait; }
</style>
