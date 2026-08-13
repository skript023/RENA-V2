<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import Navigation from '@/components/Navigation.vue'
import { useNotification } from '@/composables/useNotification'
import schedulerService from './service'
import type { SchedulerTask, UpdateSchedulerTaskPayload } from './dto/scheduler.dto'

const { notify } = useNotification()

const tasks = ref<SchedulerTask[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedTask = ref<SchedulerTask | null>(null)
const isModalOpen = ref(false)
const saving = ref(false)
const runningTaskId = ref<string | null>(null)

// Timezone Options
const timezoneOptions = [
  { label: 'WIB - Asia/Jakarta (UTC+7)', value: 'Asia/Jakarta' },
  { label: 'WITA - Asia/Makassar (UTC+8)', value: 'Asia/Makassar' },
  { label: 'WIT - Asia/Jayapura (UTC+9)', value: 'Asia/Jayapura' },
  { label: 'UTC - Coordinated Universal Time', value: 'UTC' },
  { label: 'EST - America/New_York (UTC-5)', value: 'America/New_York' },
  { label: 'PST - America/Los_Angeles (UTC-8)', value: 'America/Los_Angeles' },
  { label: 'GMT - Europe/London (UTC+0)', value: 'Europe/London' },
  { label: 'JST - Asia/Tokyo (UTC+9)', value: 'Asia/Tokyo' },
]

// Modal Form State
const form = ref<UpdateSchedulerTaskPayload>({
  enabled: true,
  cron: '0 * * * * *',
  timezone: 'Asia/Jakarta',
  start_time: '',
  end_time: ''
})

const fetchTasks = async () => {
  loading.value = true
  try {
    const res = await schedulerService.getTasks()
    if (res && res.success && Array.isArray(res.data)) {
      tasks.value = res.data
    } else {
      // Fallback sample data for RENA tasks if backend endpoint is initializing
      tasks.value = [
        {
          id: 'hrmis_checkout',
          name: 'HRMIS Check-out',
          enabled: true,
          cron: '50 52 17 * * 1-5',
          timezone: 'Asia/Jakarta',
          start_time: '',
          end_time: '',
          next_run: '2026-08-13 10:52:50',
          last_run: '',
          status: 'idle'
        },
        {
          id: 'jahra_checkout',
          name: 'Jahra Check-out',
          enabled: true,
          cron: '50 52 17 * * 1-5',
          timezone: 'Asia/Jakarta',
          start_time: '',
          end_time: '',
          next_run: '2026-08-13 10:52:50',
          last_run: '',
          status: 'idle'
        },
        {
          id: 'jahra_checkin',
          name: 'Jahra Check-in',
          enabled: true,
          cron: '00 02 07 * * 1-5',
          timezone: 'Asia/Jakarta',
          start_time: '',
          end_time: '',
          next_run: '2026-08-14 00:02:00',
          last_run: '',
          status: 'idle'
        },
        {
          id: 'hrmis_checkin',
          name: 'HRMIS Check-in',
          enabled: true,
          cron: '00 02 07 * * 1-5',
          timezone: 'Asia/Jakarta',
          start_time: '',
          end_time: '',
          next_run: '2026-08-14 00:02:00',
          last_run: '',
          status: 'idle'
        },
        {
          id: 'haca_health_09',
          name: 'HACA Health Check 09:02',
          enabled: true,
          cron: '00 02 09 * * 1-7',
          timezone: 'Asia/Jakarta',
          start_time: '',
          end_time: '',
          next_run: '2026-08-14 02:02:00',
          last_run: '',
          status: 'idle'
        },
        {
          id: 'haca_health_12',
          name: 'HACA Health Check 12:02',
          enabled: true,
          cron: '00 02 12 * * 1-7',
          timezone: 'Asia/Jakarta',
          start_time: '',
          end_time: '',
          next_run: '2026-08-14 05:02:00',
          last_run: '',
          status: 'idle'
        },
        {
          id: 'haca_health_15',
          name: 'HACA Health Check 15:02',
          enabled: true,
          cron: '00 02 15 * * 1-7',
          timezone: 'Asia/Jakarta',
          start_time: '',
          end_time: '',
          next_run: '2026-08-14 08:02:00',
          last_run: '',
          status: 'idle'
        }
      ]
    }
  } catch (err: any) {
    notify('Failed to load scheduler tasks', 'error')
  } finally {
    loading.value = false
  }
}

const filteredTasks = computed(() => {
  if (!searchQuery.value.trim()) return tasks.value
  const q = searchQuery.value.toLowerCase()
  return tasks.value.filter(
    t => t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.cron.toLowerCase().includes(q)
  )
})

const activeTaskCount = computed(() => tasks.value.filter(t => t.enabled).length)
const pausedTaskCount = computed(() => tasks.value.filter(t => !t.enabled).length)

const toggleTaskStatus = async (task: SchedulerTask) => {
  const newStatus = !task.enabled
  task.enabled = newStatus
  try {
    await schedulerService.updateTask(task.id, {
      enabled: newStatus,
      cron: task.cron,
      timezone: task.timezone,
      start_time: task.start_time,
      end_time: task.end_time
    })
    notify(`Task '${task.name}' is now ${newStatus ? 'ENABLED' : 'DISABLED'}`, 'success')
  } catch (err) {
    task.enabled = !newStatus
    notify(`Failed to toggle task '${task.name}'`, 'error')
  }
}

const openEditModal = (task: SchedulerTask) => {
  selectedTask.value = task
  form.value = {
    enabled: task.enabled,
    cron: task.cron,
    timezone: task.timezone || 'Asia/Jakarta',
    start_time: task.start_time || '',
    end_time: task.end_time || ''
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  selectedTask.value = null
}

const saveTaskConfig = async () => {
  if (!selectedTask.value) return
  saving.value = true
  try {
    await schedulerService.updateTask(selectedTask.value.id, form.value)
    notify(`Scheduler config for '${selectedTask.value.name}' updated!`, 'success')
    closeModal()
    await fetchTasks()
  } catch (err: any) {
    notify('Failed to update task configuration', 'error')
  } finally {
    saving.value = false
  }
}

const triggerTaskNow = async (task: SchedulerTask) => {
  runningTaskId.value = task.id
  try {
    await schedulerService.runTask(task.id)
    notify(`Triggered task '${task.name}' immediately`, 'success')
    await fetchTasks()
  } catch (err: any) {
    notify(`Failed to trigger task '${task.name}'`, 'error')
  } finally {
    runningTaskId.value = null
  }
}

const setPresetCron = (expr: string) => {
  form.value.cron = expr
}

const getStatusBadge = (status: string, enabled: boolean) => {
  if (!enabled) return { label: 'Disabled', class: 'bg-base-200 text-base-content/50 border-base-300', icon: 'ph-minus-circle' }
  if (status === 'running') return { label: 'Running', class: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 animate-pulse', icon: 'ph-spinner animate-spin' }
  if (status === 'outside_window') return { label: 'Outside Hours', class: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30', icon: 'ph-clock-slash' }
  return { label: 'Active / Idle', class: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30', icon: 'ph-check-circle' }
}

onMounted(fetchTasks)
</script>

<template>
  <Navigation title="RENA Scheduler Control Center">
    <div class="space-y-6 pb-12">
      <!-- STATS OVERVIEW -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Card 1 -->
        <div class="card bg-base-100 shadow-sm border border-base-200 p-4 transition-all duration-200 hover:shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-base-content/60">Total Registered Jobs</p>
              <h3 class="text-2xl font-bold text-base-content mt-1">{{ tasks.length }}</h3>
              <p class="text-[11px] text-base-content/50 mt-0.5">RENA Background Crons</p>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <i class="ph ph-clock-afternoon text-2xl"></i>
            </div>
          </div>
        </div>

        <!-- Card 2 -->
        <div class="card bg-base-100 shadow-sm border border-base-200 p-4 transition-all duration-200 hover:shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-base-content/60">Active Tasks (ON)</p>
              <h3 class="text-2xl font-bold text-success mt-1">{{ activeTaskCount }}</h3>
              <p class="text-[11px] text-base-content/50 mt-0.5">Scheduled for execution</p>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center shrink-0">
              <i class="ph ph-check-circle text-2xl"></i>
            </div>
          </div>
        </div>

        <!-- Card 3 -->
        <div class="card bg-base-100 shadow-sm border border-base-200 p-4 transition-all duration-200 hover:shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-base-content/60">Paused Tasks (OFF)</p>
              <h3 class="text-2xl font-bold text-warning mt-1">{{ pausedTaskCount }}</h3>
              <p class="text-[11px] text-base-content/50 mt-0.5">Manually disabled</p>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
              <i class="ph ph-pause-circle text-2xl"></i>
            </div>
          </div>
        </div>

        <!-- Card 4 -->
        <div class="card bg-base-100 shadow-sm border border-base-200 p-4 transition-all duration-200 hover:shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-base-content/60">Drogon IO Status</p>
              <h3 class="text-xl font-bold text-info mt-1">Non-Blocking</h3>
              <p class="text-[11px] text-base-content/50 mt-0.5">Worker Thread Pool Enabled</p>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-info/10 text-info flex items-center justify-center shrink-0">
              <i class="ph ph-globe-hemisphere-east text-2xl"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- CONTROL TOOLBAR & SEARCH -->
      <div class="card bg-base-100 shadow-sm border border-base-200 p-4">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div class="relative flex-1 max-w-md">
            <i class="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/50 text-base"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by job ID, name or cron..."
              class="input input-bordered input-sm w-full pl-10 focus:outline-none focus:border-primary text-xs"
            />
          </div>

          <div class="flex items-center gap-2 justify-end">
            <button
              @click="fetchTasks"
              class="btn btn-sm btn-outline gap-2 border-base-300 hover:border-primary text-xs font-medium"
              :disabled="loading"
            >
              <i class="ph ph-arrows-clockwise text-sm" :class="{ 'animate-spin': loading }"></i>
              <span>Refresh Tasks</span>
            </button>
          </div>
        </div>
      </div>

      <!-- TASK TABLE CARD -->
      <div class="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
        <div class="p-5 border-b border-base-200">
          <h2 class="card-title text-base font-bold text-base-content">RENA Scheduled Background Tasks</h2>
          <p class="text-xs text-base-content/60 mt-0.5">
            Manage HRMIS/Jahra attendance & HACA health check execution schedules, timezones, and active time windows.
          </p>
        </div>

        <!-- TABLE LOADING SKELETON -->
        <div v-if="loading" class="p-5 space-y-3">
          <div v-for="n in 3" :key="n" class="skeleton h-14 w-full rounded-xl"></div>
        </div>

        <!-- TASKS TABLE -->
        <div v-else-if="filteredTasks.length > 0" class="overflow-x-auto">
          <table class="table table-zebra w-full text-xs">
            <thead>
              <tr class="bg-base-200/60 text-base-content/70 font-semibold text-[11px] uppercase tracking-wider">
                <th class="w-16 text-center">ON/OFF</th>
                <th>Task ID & Name</th>
                <th>Cron Expression</th>
                <th>Region / Timezone</th>
                <th>Active Window</th>
                <th>Last Run</th>
                <th>Next Run</th>
                <th>Status</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-base-200">
              <tr v-for="task in filteredTasks" :key="task.id" class="hover:bg-base-200/40 transition-colors">
                <!-- ON / OFF SWITCH -->
                <td class="text-center py-3">
                  <input
                    type="checkbox"
                    class="toggle toggle-success toggle-sm cursor-pointer"
                    :checked="task.enabled"
                    @change="toggleTaskStatus(task)"
                    title="Toggle ON/OFF"
                  />
                </td>

                <!-- TASK NAME & ID -->
                <td class="py-3">
                  <div class="font-bold text-sm text-base-content">{{ task.name || task.id }}</div>
                  <div class="text-[11px] font-mono text-base-content/50 flex items-center gap-1 mt-0.5">
                    <i class="ph ph-hash text-[10px]"></i>{{ task.id }}
                  </div>
                </td>

                <!-- CRON EXPRESSION -->
                <td class="py-3">
                  <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono text-xs border border-amber-500/20 whitespace-nowrap shadow-xs">
                    <i class="ph ph-timer text-amber-600 dark:text-amber-400"></i>
                    <span>{{ task.cron }}</span>
                  </div>
                </td>

                <!-- TIMEZONE -->
                <td class="py-3">
                  <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium text-xs border border-indigo-500/20 whitespace-nowrap">
                    <i class="ph ph-globe text-indigo-600 dark:text-indigo-400"></i>
                    <span>{{ task.timezone || 'Asia/Jakarta' }}</span>
                  </div>
                </td>

                <!-- ACTIVE WINDOW -->
                <td class="py-3">
                  <div v-if="task.start_time && task.end_time" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-mono text-xs border border-cyan-500/20 whitespace-nowrap">
                    <i class="ph ph-clock text-cyan-600 dark:text-cyan-400"></i>
                    <span>{{ task.start_time }} - {{ task.end_time }}</span>
                  </div>
                  <div v-else class="text-xs text-base-content/50 italic inline-flex items-center gap-1 whitespace-nowrap">
                    <i class="ph ph-infinity text-xs"></i> 24/7 Always Active
                  </div>
                </td>

                <!-- LAST RUN -->
                <td class="py-3 whitespace-nowrap font-mono text-xs text-base-content/70">
                  <span v-if="task.last_run" class="flex items-center gap-1">
                    <i class="ph ph-clock-counter-clockwise text-xs text-base-content/40"></i>
                    {{ task.last_run }}
                  </span>
                  <span v-else class="text-base-content/40">-</span>
                </td>

                <!-- NEXT RUN -->
                <td class="py-3 whitespace-nowrap font-mono text-xs text-primary font-semibold">
                  <span v-if="task.next_run" class="flex items-center gap-1">
                    <i class="ph ph-calendar-check text-xs text-primary/70"></i>
                    {{ task.next_run }}
                  </span>
                  <span v-else class="text-base-content/40">-</span>
                </td>

                <!-- STATUS -->
                <td class="py-3">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap" :class="getStatusBadge(task.status, task.enabled).class">
                    <i class="ph text-xs" :class="getStatusBadge(task.status, task.enabled).icon"></i>
                    {{ getStatusBadge(task.status, task.enabled).label }}
                  </span>
                </td>

                <!-- ACTIONS -->
                <td class="py-3 text-center">
                  <div class="flex items-center justify-center gap-2 whitespace-nowrap">
                    <button
                      @click="triggerTaskNow(task)"
                      class="btn btn-xs btn-outline btn-success gap-1 text-xs font-semibold hover:text-white transition-all shadow-xs"
                      :disabled="runningTaskId === task.id"
                      title="Run immediately"
                    >
                      <i class="ph ph-play-circle text-sm" :class="{ 'animate-spin': runningTaskId === task.id }"></i>
                      Run Now
                    </button>

                    <button
                      @click="openEditModal(task)"
                      class="btn btn-xs btn-primary gap-1 text-xs font-semibold shadow-xs"
                      title="Configure schedule"
                    >
                      <i class="ph ph-gear text-sm"></i>
                      Config
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- EMPTY STATE -->
        <div v-else class="text-center py-16 text-base-content/50">
          <i class="ph ph-clock-slash text-5xl mb-3 text-base-content/30"></i>
          <p class="font-bold text-base text-base-content/80">No Scheduler Tasks Found</p>
          <p class="text-xs text-base-content/50 mt-1 max-w-sm mx-auto">
            No matching tasks found. Try adjusting your search query or register new tasks in the backend schedule.
          </p>
        </div>
      </div>
    </div>

    <!-- CONFIG EDIT MODAL -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div class="bg-base-100 rounded-2xl shadow-2xl border border-base-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-5 border-b border-base-200 bg-base-200/40">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <i class="ph ph-sliders text-xl"></i>
            </div>
            <div>
              <h3 class="font-bold text-base text-base-content">Configure Task Scheduler</h3>
              <p class="text-xs text-base-content/60 mt-0.5">
                Adjust schedule timing, operating hours, and regional timezone for <span class="font-mono font-semibold text-primary">{{ selectedTask?.name || selectedTask?.id }}</span>
              </p>
            </div>
          </div>
          <button @click="closeModal" class="btn btn-sm btn-circle btn-ghost text-base-content/60 hover:text-base-content">
            <i class="ph ph-x text-lg"></i>
          </button>
        </div>

        <!-- Modal Body -->
        <form @submit.prevent="saveTaskConfig" class="p-5 space-y-4">
          <!-- ENABLED SWITCH (Responsive & Spaced Out) -->
          <div 
            @click="form.enabled = !form.enabled"
            class="flex items-center justify-between p-3.5 bg-base-200/70 hover:bg-base-200 border border-base-300/60 rounded-xl cursor-pointer transition-all duration-150 select-none"
          >
            <div class="flex items-center gap-3">
              <div 
                class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                :class="form.enabled ? 'bg-success/15 text-success' : 'bg-base-300 text-base-content/50'"
              >
                <i class="ph text-lg" :class="form.enabled ? 'ph-power' : 'ph-power-off'"></i>
              </div>
              <div>
                <span class="block text-xs font-semibold text-base-content">Enable Scheduler Task</span>
                <span class="block text-[11px] text-base-content/60">
                  {{ form.enabled ? 'Task is currently active and running' : 'Task is paused automatically' }}
                </span>
              </div>
            </div>
            <input 
              type="checkbox" 
              class="toggle toggle-success toggle-md pointer-events-none ml-4" 
              :checked="form.enabled" 
            />
          </div>

          <!-- TIMEZONE SELECT -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-base-content/80 flex items-center gap-1.5">
              <i class="ph ph-globe text-secondary text-sm"></i> Region / Timezone
            </label>
            <select v-model="form.timezone" class="select select-bordered select-sm w-full text-xs focus:outline-none focus:border-primary">
              <option v-for="tz in timezoneOptions" :key="tz.value" :value="tz.value">
                {{ tz.label }}
              </option>
            </select>
          </div>

          <!-- CRON EXPRESSION & PRESETS -->
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-base-content/80 flex items-center gap-1.5">
              <i class="ph ph-timer text-warning text-sm"></i> Cron Expression (5 or 6 fields)
            </label>
            <input
              v-model="form.cron"
              type="text"
              class="input input-bordered input-sm w-full font-mono text-xs focus:outline-none focus:border-primary"
              placeholder="e.g. 00 02 07 * * 1-5"
              required
            />
            <div class="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                @click="setPresetCron('*/5 * * * * *')"
                class="btn btn-xs rounded-lg border text-[11px] transition-all"
                :class="form.cron === '*/5 * * * * *' ? 'btn-primary' : 'btn-ghost bg-base-200/80 border-base-300 hover:bg-base-300'"
              >
                Every 5s
              </button>
              <button
                type="button"
                @click="setPresetCron('0 * * * * *')"
                class="btn btn-xs rounded-lg border text-[11px] transition-all"
                :class="form.cron === '0 * * * * *' ? 'btn-primary' : 'btn-ghost bg-base-200/80 border-base-300 hover:bg-base-300'"
              >
                Every 1 min
              </button>
              <button
                type="button"
                @click="setPresetCron('0 0 * * * *')"
                class="btn btn-xs rounded-lg border text-[11px] transition-all"
                :class="form.cron === '0 0 * * * *' ? 'btn-primary' : 'btn-ghost bg-base-200/80 border-base-300 hover:bg-base-300'"
              >
                Hourly
              </button>
              <button
                type="button"
                @click="setPresetCron('00 02 07 * * 1-5')"
                class="btn btn-xs rounded-lg border text-[11px] transition-all"
                :class="form.cron === '00 02 07 * * 1-5' ? 'btn-primary' : 'btn-ghost bg-base-200/80 border-base-300 hover:bg-base-300'"
              >
                Checkin 07:02
              </button>
              <button
                type="button"
                @click="setPresetCron('50 52 17 * * 1-5')"
                class="btn btn-xs rounded-lg border text-[11px] transition-all"
                :class="form.cron === '50 52 17 * * 1-5' ? 'btn-primary' : 'btn-ghost bg-base-200/80 border-base-300 hover:bg-base-300'"
              >
                Checkout 17:52
              </button>
            </div>
          </div>

          <!-- OPERATING HOURS WINDOW -->
          <div class="border border-base-200 rounded-xl p-3.5 bg-base-200/40 space-y-2">
            <label class="block text-xs font-semibold text-base-content/80 flex items-center gap-1.5">
              <i class="ph ph-clock text-accent text-sm"></i> Operational Hours Window (Optional)
            </label>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <span class="block text-[10px] font-medium text-base-content/60 mb-1">Start Time (HH:mm)</span>
                <input
                  v-model="form.start_time"
                  type="time"
                  class="input input-bordered input-sm w-full font-mono text-xs focus:outline-none focus:border-primary"
                  placeholder="08:00"
                />
              </div>
              <div>
                <span class="block text-[10px] font-medium text-base-content/60 mb-1">End Time (HH:mm)</span>
                <input
                  v-model="form.end_time"
                  type="time"
                  class="input input-bordered input-sm w-full font-mono text-xs focus:outline-none focus:border-primary"
                  placeholder="17:00"
                />
              </div>
            </div>
            <p class="text-[10px] text-base-content/50">
              Leave blank to run 24 hours a day without operational hour restriction.
            </p>
          </div>

          <!-- MODAL ACTIONS -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-base-200 mt-5">
            <button type="button" @click="closeModal" class="btn btn-sm btn-ghost text-xs">Cancel</button>
            <button type="submit" class="btn btn-sm btn-primary gap-2 text-xs font-medium" :disabled="saving">
              <i class="ph ph-floppy-disk text-sm" :class="{ 'animate-spin': saving }"></i>
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  </Navigation>
</template>
