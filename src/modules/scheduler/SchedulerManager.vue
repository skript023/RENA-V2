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
          id: 'hrmis_checkin',
          name: 'HRMIS Attendance Check-in',
          enabled: true,
          cron: '00 02 07 * * 1-5',
          timezone: 'Asia/Jakarta',
          start_time: '06:30',
          end_time: '08:00',
          next_run: '2026-08-14 07:02:00',
          last_run: '2026-08-13 07:02:00',
          status: 'idle'
        },
        {
          id: 'hrmis_checkout',
          name: 'HRMIS Attendance Check-out',
          enabled: true,
          cron: '50 52 17 * * 1-5',
          timezone: 'Asia/Jakarta',
          start_time: '17:00',
          end_time: '18:30',
          next_run: '2026-08-13 17:52:50',
          last_run: '2026-08-12 17:52:50',
          status: 'idle'
        },
        {
          id: 'jahra_checkin',
          name: 'Jahra Attendance Check-in',
          enabled: true,
          cron: '00 02 07 * * 1-5',
          timezone: 'Asia/Jakarta',
          start_time: '06:30',
          end_time: '08:00',
          next_run: '2026-08-14 07:02:00',
          last_run: '2026-08-13 07:02:00',
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
          next_run: '2026-08-14 09:02:00',
          last_run: '2026-08-13 09:02:00',
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
  if (!enabled) return { label: 'Disabled', class: 'bg-base-200 text-base-content/50 border-base-300', dot: 'bg-gray-400' }
  if (status === 'running') return { label: 'Running', class: 'bg-success/10 text-success border-success/20 animate-pulse', dot: 'bg-success' }
  if (status === 'outside_window') return { label: 'Outside Hours', class: 'bg-warning/10 text-warning border-warning/20', dot: 'bg-warning' }
  return { label: 'Active / Idle', class: 'bg-info/10 text-info border-info/20', dot: 'bg-info' }
}

onMounted(fetchTasks)
</script>

<template>
  <Navigation title="RENA Scheduler Control Center">
    <div class="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <!-- STATS OVERVIEW -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="stat bg-base-100 shadow-sm rounded-2xl border border-base-200 p-5 transition-all hover:shadow-md">
          <div class="stat-figure text-primary">
            <div class="p-3 bg-primary/10 rounded-xl">
              <i class="ph ph-clock-afternoon text-2xl"></i>
            </div>
          </div>
          <div class="stat-title text-xs font-medium text-base-content/70">Total Registered Jobs</div>
          <div class="stat-value text-2xl font-bold text-primary mt-1">{{ tasks.length }}</div>
          <div class="stat-desc text-[11px] mt-1">RENA Background Crons</div>
        </div>

        <div class="stat bg-base-100 shadow-sm rounded-2xl border border-base-200 p-5 transition-all hover:shadow-md">
          <div class="stat-figure text-success">
            <div class="p-3 bg-success/10 rounded-xl">
              <i class="ph ph-check-circle text-2xl"></i>
            </div>
          </div>
          <div class="stat-title text-xs font-medium text-base-content/70">Active Tasks (ON)</div>
          <div class="stat-value text-2xl font-bold text-success mt-1">{{ activeTaskCount }}</div>
          <div class="stat-desc text-[11px] mt-1">Scheduled for execution</div>
        </div>

        <div class="stat bg-base-100 shadow-sm rounded-2xl border border-base-200 p-5 transition-all hover:shadow-md">
          <div class="stat-figure text-warning">
            <div class="p-3 bg-warning/10 rounded-xl">
              <i class="ph ph-pause-circle text-2xl"></i>
            </div>
          </div>
          <div class="stat-title text-xs font-medium text-base-content/70">Paused Tasks (OFF)</div>
          <div class="stat-value text-2xl font-bold text-warning mt-1">{{ pausedTaskCount }}</div>
          <div class="stat-desc text-[11px] mt-1">Manually disabled</div>
        </div>

        <div class="stat bg-base-100 shadow-sm rounded-2xl border border-base-200 p-5 transition-all hover:shadow-md">
          <div class="stat-figure text-info">
            <div class="p-3 bg-info/10 rounded-xl">
              <i class="ph ph-globe-hemisphere-east text-2xl"></i>
            </div>
          </div>
          <div class="stat-title text-xs font-medium text-base-content/70">Drogon IO Status</div>
          <div class="stat-value text-xl font-bold text-info mt-1">Non-Blocking</div>
          <div class="stat-desc text-[11px] mt-1">Worker Thread Pool Enabled</div>
        </div>
      </div>

      <!-- CONTROL TOOLBAR & SEARCH -->
      <div class="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
        <div class="card-body p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div class="relative w-full sm:w-80">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by job ID, name or cron..."
              class="input input-bordered input-sm sm:input-md w-full pl-10 rounded-xl focus:input-primary text-xs sm:text-sm"
            />
            <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 text-lg"></i>
          </div>

          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button @click="fetchTasks" class="btn btn-sm sm:btn-md btn-outline rounded-xl gap-2 hover:btn-primary" :disabled="loading">
              <i class="ph ph-arrows-clockwise text-base" :class="{ 'animate-spin': loading }"></i>
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <!-- TASK TABLE CARD -->
      <div class="card bg-base-100 shadow-sm border border-base-200 rounded-2xl overflow-hidden">
        <div class="card-body p-5 sm:p-6 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-200 pb-4">
            <div>
              <h2 class="card-title text-base sm:text-lg font-bold flex items-center gap-2">
                <i class="ph ph-list-checks text-primary text-xl"></i>
                RENA Scheduled Background Tasks
              </h2>
              <p class="text-xs text-base-content/70 mt-0.5">
                Manage HRMIS/Jahra attendance & HACA health check execution schedules, timezones, and active time windows.
              </p>
            </div>
          </div>

          <!-- TABLE LOADING SKELETON -->
          <div v-if="loading" class="space-y-3 py-4">
            <div v-for="n in 4" :key="n" class="skeleton h-14 w-full rounded-xl"></div>
          </div>

          <!-- TASKS TABLE -->
          <div v-else-if="filteredTasks.length > 0" class="overflow-x-auto rounded-xl border border-base-200">
            <table class="table w-full text-xs sm:text-sm min-w-[1050px]">
              <thead>
                <tr class="bg-base-200/80 text-base-content/70 text-[11px] uppercase tracking-wider font-semibold border-b border-base-200">
                  <th class="w-16 text-center py-3">ON/OFF</th>
                  <th class="min-w-[220px] py-3">Task ID & Name</th>
                  <th class="min-w-[160px] py-3">Cron Expression</th>
                  <th class="min-w-[160px] py-3">Region / Timezone</th>
                  <th class="min-w-[150px] py-3">Active Window</th>
                  <th class="min-w-[150px] py-3">Last Run</th>
                  <th class="min-w-[150px] py-3">Next Run</th>
                  <th class="min-w-[130px] text-center py-3">Status</th>
                  <th class="min-w-[170px] text-center py-3">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-base-200/60">
                <tr v-for="task in filteredTasks" :key="task.id" class="hover:bg-base-200/30 transition-colors">
                  <!-- ON / OFF SWITCH -->
                  <td class="text-center py-3.5 px-3">
                    <div class="flex items-center justify-center">
                      <input
                        type="checkbox"
                        class="toggle toggle-success toggle-sm cursor-pointer hover:scale-105 transition-transform"
                        :checked="task.enabled"
                        @change="toggleTaskStatus(task)"
                        title="Toggle ON/OFF"
                      />
                    </div>
                  </td>

                  <!-- TASK NAME & ID -->
                  <td class="py-3.5 px-3">
                    <div class="font-semibold text-xs sm:text-sm text-base-content leading-snug">{{ task.name || task.id }}</div>
                    <div class="text-[11px] text-base-content/60 font-mono inline-flex items-center gap-1 bg-base-200/70 px-2 py-0.5 rounded-md mt-1 border border-base-300/40">
                      <i class="ph ph-hash text-primary text-xs"></i> {{ task.id }}
                    </div>
                  </td>

                  <!-- CRON EXPRESSION -->
                  <td class="py-3.5 px-3">
                    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 font-mono text-xs font-semibold whitespace-nowrap">
                      <i class="ph ph-timer text-xs"></i> {{ task.cron }}
                    </div>
                  </td>

                  <!-- TIMEZONE -->
                  <td class="py-3.5 px-3">
                    <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-base-200 text-base-content text-xs font-medium border border-base-300/50 whitespace-nowrap">
                      <i class="ph ph-globe text-secondary text-xs"></i> {{ task.timezone || 'Asia/Jakarta' }}
                    </div>
                  </td>

                  <!-- ACTIVE WINDOW -->
                  <td class="py-3.5 px-3">
                    <div v-if="task.start_time && task.end_time" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-info/10 text-info border border-info/20 text-xs font-medium whitespace-nowrap">
                      <i class="ph ph-clock text-xs"></i> {{ task.start_time }} - {{ task.end_time }}
                    </div>
                    <div v-else class="inline-flex items-center gap-1 text-xs text-base-content/50 italic bg-base-200/40 px-2.5 py-1 rounded-lg border border-base-200/60 whitespace-nowrap">
                      <i class="ph ph-infinity text-xs"></i> 24/7 Always Active
                    </div>
                  </td>

                  <!-- LAST RUN -->
                  <td class="py-3.5 px-3 whitespace-nowrap font-mono text-xs text-base-content/70">
                    {{ task.last_run || '-' }}
                  </td>

                  <!-- NEXT RUN -->
                  <td class="py-3.5 px-3 whitespace-nowrap font-mono text-xs text-primary font-semibold">
                    <div class="inline-flex items-center gap-1">
                      <i class="ph ph-calendar-blank text-xs"></i> {{ task.next_run || '-' }}
                    </div>
                  </td>

                  <!-- STATUS -->
                  <td class="text-center py-3.5 px-3">
                    <div
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
                      :class="getStatusBadge(task.status, task.enabled).class"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" :class="getStatusBadge(task.status, task.enabled).dot"></span>
                      {{ getStatusBadge(task.status, task.enabled).label }}
                    </div>
                  </td>

                  <!-- ACTIONS -->
                  <td class="text-center py-3.5 px-3">
                    <div class="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                      <button
                        @click="triggerTaskNow(task)"
                        class="btn btn-xs sm:btn-sm btn-outline btn-success rounded-lg gap-1.5 hover:shadow-sm"
                        :disabled="runningTaskId === task.id"
                        title="Run immediately"
                      >
                        <i class="ph ph-play-circle text-sm" :class="{ 'animate-spin': runningTaskId === task.id }"></i>
                        <span>Run Now</span>
                      </button>

                      <button
                        @click="openEditModal(task)"
                        class="btn btn-xs sm:btn-sm btn-primary rounded-lg gap-1.5 hover:shadow-sm"
                        title="Configure schedule"
                      >
                        <i class="ph ph-gear text-sm"></i>
                        <span>Config</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- EMPTY STATE -->
          <div v-else class="text-center py-12 text-base-content/50 bg-base-200/20 rounded-xl border border-dashed border-base-300">
            <i class="ph ph-clock text-4xl mb-2 text-base-content/30"></i>
            <p class="font-semibold text-sm">No Scheduler Tasks Found</p>
            <p class="text-xs text-base-content/60 mt-0.5">Register tasks in backend schedule::task() or adjust your search query.</p>
          </div>
        </div>
      </div>

      <!-- CONFIG EDIT MODAL -->
      <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div class="bg-base-100 max-w-lg w-full p-6 rounded-2xl shadow-2xl border border-base-200 relative max-h-[90vh] overflow-y-auto space-y-5">
          <!-- MODAL HEADER -->
          <div class="flex items-start justify-between border-b border-base-200 pb-4">
            <div class="flex items-center gap-3">
              <div class="p-2.5 bg-primary/10 text-primary rounded-xl">
                <i class="ph ph-sliders text-xl"></i>
              </div>
              <div>
                <h3 class="font-bold text-base sm:text-lg text-base-content">Configure Task Scheduler</h3>
                <p class="text-xs text-base-content/60 mt-0.5">
                  Task: <span class="font-mono font-semibold text-primary">{{ selectedTask?.name || selectedTask?.id }}</span>
                </p>
              </div>
            </div>
            <button @click="closeModal" class="btn btn-sm btn-circle btn-ghost text-base-content/60 hover:text-base-content">
              <i class="ph ph-x text-lg"></i>
            </button>
          </div>

          <form @submit.prevent="saveTaskConfig" class="space-y-4">
            <!-- ENABLED SWITCH (SPACIOUS & RESPONSIVE) -->
            <label class="flex items-center justify-between p-4 bg-base-200/60 hover:bg-base-200/90 rounded-xl border border-base-300/60 cursor-pointer transition-colors select-none">
              <div class="flex flex-col gap-0.5">
                <span class="font-semibold text-sm text-base-content">Enable Scheduler Task</span>
                <span class="text-xs text-base-content/60">Toggle automated execution for this cron job</span>
              </div>
              <input type="checkbox" class="toggle toggle-success toggle-md shrink-0 ml-4 cursor-pointer" v-model="form.enabled" />
            </label>

            <!-- TIMEZONE SELECT -->
            <div class="form-control space-y-1.5">
              <label class="label p-0">
                <span class="label-text font-semibold text-xs text-base-content/80 flex items-center gap-1.5">
                  <i class="ph ph-globe text-secondary text-sm"></i> Region / Timezone
                </span>
              </label>
              <select v-model="form.timezone" class="select select-bordered select-sm sm:select-md w-full rounded-xl focus:select-primary text-xs sm:text-sm">
                <option v-for="tz in timezoneOptions" :key="tz.value" :value="tz.value">
                  {{ tz.label }}
                </option>
              </select>
            </div>

            <!-- CRON EXPRESSION & PRESETS -->
            <div class="form-control space-y-1.5">
              <label class="label p-0">
                <span class="label-text font-semibold text-xs text-base-content/80 flex items-center gap-1.5">
                  <i class="ph ph-timer text-warning text-sm"></i> Cron Expression (5 or 6 fields)
                </span>
              </label>
              <input
                v-model="form.cron"
                type="text"
                class="input input-bordered input-sm sm:input-md font-mono w-full rounded-xl focus:input-primary text-xs sm:text-sm"
                placeholder="e.g. 00 02 07 * * 1-5"
                required
              />
              <div class="pt-1">
                <span class="text-[11px] font-medium text-base-content/60 mb-1.5 block">Quick Presets:</span>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    @click="setPresetCron('*/5 * * * * *')"
                    class="btn btn-xs btn-outline rounded-lg font-mono text-[11px] hover:btn-primary"
                  >
                    Every 5s
                  </button>
                  <button
                    type="button"
                    @click="setPresetCron('0 * * * * *')"
                    class="btn btn-xs btn-outline rounded-lg font-mono text-[11px] hover:btn-primary"
                  >
                    Every 1m
                  </button>
                  <button
                    type="button"
                    @click="setPresetCron('0 0 * * * *')"
                    class="btn btn-xs btn-outline rounded-lg font-mono text-[11px] hover:btn-primary"
                  >
                    Hourly
                  </button>
                  <button
                    type="button"
                    @click="setPresetCron('00 02 07 * * 1-5')"
                    class="btn btn-xs btn-outline rounded-lg font-mono text-[11px] hover:btn-primary"
                  >
                    Checkin 07:02
                  </button>
                  <button
                    type="button"
                    @click="setPresetCron('50 52 17 * * 1-5')"
                    class="btn btn-xs btn-outline rounded-lg font-mono text-[11px] hover:btn-primary"
                  >
                    Checkout 17:52
                  </button>
                </div>
              </div>
            </div>

            <!-- OPERATING HOURS WINDOW -->
            <div class="border border-base-200 rounded-xl p-4 bg-base-200/40 space-y-3">
              <label class="label p-0">
                <span class="label-text font-semibold text-xs text-base-content/80 flex items-center gap-1.5">
                  <i class="ph ph-clock text-accent text-sm"></i> Operational Hours Window (Optional)
                </span>
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="space-y-1">
                  <span class="text-[11px] font-medium text-base-content/60">Start Time (HH:mm)</span>
                  <input
                    v-model="form.start_time"
                    type="time"
                    class="input input-bordered input-sm w-full font-mono rounded-lg text-xs"
                    placeholder="08:00"
                  />
                </div>
                <div class="space-y-1">
                  <span class="text-[11px] font-medium text-base-content/60">End Time (HH:mm)</span>
                  <input
                    v-model="form.end_time"
                    type="time"
                    class="input input-bordered input-sm w-full font-mono rounded-lg text-xs"
                    placeholder="17:00"
                  />
                </div>
              </div>
              <p class="text-[11px] text-base-content/50 italic">
                Leave blank to run 24 hours a day without operational hour restriction.
              </p>
            </div>

            <!-- MODAL ACTIONS -->
            <div class="pt-3 border-t border-base-200 flex justify-end gap-2">
              <button type="button" @click="closeModal" class="btn btn-sm sm:btn-md btn-ghost rounded-xl">
                Cancel
              </button>
              <button type="submit" class="btn btn-sm sm:btn-md btn-primary rounded-xl gap-2" :disabled="saving">
                <i class="ph ph-floppy-disk text-base" :class="{ 'animate-spin': saving }"></i>
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Navigation>
</template>
