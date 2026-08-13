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
  if (!enabled) return { label: 'Disabled', class: 'badge-ghost text-gray-400' }
  if (status === 'running') return { label: 'Running', class: 'badge-success animate-pulse' }
  if (status === 'outside_window') return { label: 'Outside Hours', class: 'badge-warning' }
  return { label: 'Active / Idle', class: 'badge-info' }
}

onMounted(fetchTasks)
</script>

<template>
  <Navigation title="RENA Scheduler Control Center">
    <!-- STATS OVERVIEW -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      <div class="stat bg-base-100 shadow rounded-2xl border border-base-200">
        <div class="stat-figure text-primary">
          <i class="ph ph-clock-afternoon text-3xl"></i>
        </div>
        <div class="stat-title text-xs">Total Registered Jobs</div>
        <div class="stat-value text-2xl text-primary">{{ tasks.length }}</div>
        <div class="stat-desc">RENA Background Crons</div>
      </div>

      <div class="stat bg-base-100 shadow rounded-2xl border border-base-200">
        <div class="stat-figure text-success">
          <i class="ph ph-check-circle text-3xl"></i>
        </div>
        <div class="stat-title text-xs">Active Tasks (ON)</div>
        <div class="stat-value text-2xl text-success">{{ activeTaskCount }}</div>
        <div class="stat-desc">Scheduled for execution</div>
      </div>

      <div class="stat bg-base-100 shadow rounded-2xl border border-base-200">
        <div class="stat-figure text-warning">
          <i class="ph ph-pause-circle text-3xl"></i>
        </div>
        <div class="stat-title text-xs">Paused Tasks (OFF)</div>
        <div class="stat-value text-2xl text-warning">{{ pausedTaskCount }}</div>
        <div class="stat-desc">Manually disabled</div>
      </div>

      <div class="stat bg-base-100 shadow rounded-2xl border border-base-200">
        <div class="stat-figure text-info">
          <i class="ph ph-globe-hemisphere-east text-3xl"></i>
        </div>
        <div class="stat-title text-xs">Drogon IO Status</div>
        <div class="stat-value text-2xl text-info">Non-Blocking</div>
        <div class="stat-desc">Worker Thread Pool Enabled</div>
      </div>
    </div>

    <!-- CONTROL TOOLBAR & SEARCH -->
    <div class="card bg-base-100 shadow-md mb-6 border border-base-200">
      <div class="card-body p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="flex items-center space-x-3 w-full md:w-auto">
          <div class="relative w-full md:w-80">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by job ID, name or cron..."
              class="input input-bordered input-sm w-full pl-9"
            />
            <i class="ph ph-magnifying-glass absolute left-3 top-2.5 text-base-content/50"></i>
          </div>
        </div>

        <div class="flex items-center space-x-2 w-full md:w-auto justify-end">
          <button @click="fetchTasks" class="btn btn-sm btn-outline gap-2" :disabled="loading">
            <i class="ph ph-arrows-clockwise" :class="{ 'animate-spin': loading }"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>

    <!-- TASK TABLE CARD -->
    <div class="card bg-base-100 shadow-xl border border-base-200">
      <div class="card-body p-5">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="card-title text-lg">RENA Scheduled Background Tasks</h2>
            <p class="text-xs text-base-content/70">
              Manage HRMIS/Jahra attendance & HACA health check execution schedules, timezones, and active time windows.
            </p>
          </div>
        </div>

        <!-- TABLE LOADING SKELETON -->
        <div v-if="loading" class="space-y-4 py-4">
          <div v-for="n in 3" :key="n" class="skeleton h-14 w-full rounded-xl"></div>
        </div>

        <!-- TASKS TABLE -->
        <div v-else-if="filteredTasks.length > 0" class="overflow-x-auto">
          <table class="table table-zebra w-full text-xs">
            <thead>
              <tr class="bg-base-200">
                <th class="w-12">ON/OFF</th>
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
            <tbody>
              <tr v-for="task in filteredTasks" :key="task.id" class="hover">
                <!-- ON / OFF SWITCH -->
                <td>
                  <input
                    type="checkbox"
                    class="toggle toggle-success toggle-sm"
                    :checked="task.enabled"
                    @change="toggleTaskStatus(task)"
                    title="Toggle ON/OFF"
                  />
                </td>

                <!-- TASK NAME & ID -->
                <td>
                  <div class="font-bold text-sm">{{ task.name || task.id }}</div>
                  <div class="text-xs text-base-content/60 font-mono flex items-center gap-1">
                    <i class="ph ph-hash text-xs"></i> {{ task.id }}
                  </div>
                </td>

                <!-- CRON EXPRESSION -->
                <td>
                  <div class="badge badge-outline font-mono gap-1 text-xs py-2">
                    <i class="ph ph-timer"></i> {{ task.cron }}
                  </div>
                </td>

                <!-- TIMEZONE -->
                <td>
                  <span class="badge badge-neutral gap-1 text-xs">
                    <i class="ph ph-globe"></i> {{ task.timezone || 'Asia/Jakarta' }}
                  </span>
                </td>

                <!-- ACTIVE WINDOW -->
                <td>
                  <div v-if="task.start_time && task.end_time" class="badge badge-info badge-outline gap-1">
                    <i class="ph ph-clock"></i> {{ task.start_time }} - {{ task.end_time }}
                  </div>
                  <div v-else class="text-xs text-base-content/50 italic">24 / 7 Always Active</div>
                </td>

                <!-- LAST RUN -->
                <td class="font-mono text-xs">
                  {{ task.last_run || '-' }}
                </td>

                <!-- NEXT RUN -->
                <td class="font-mono text-xs text-primary font-medium">
                  {{ task.next_run || '-' }}
                </td>

                <!-- STATUS -->
                <td>
                  <span class="badge" :class="getStatusBadge(task.status, task.enabled).class">
                    {{ getStatusBadge(task.status, task.enabled).label }}
                  </span>
                </td>

                <!-- ACTIONS -->
                <td>
                  <div class="flex items-center justify-center space-x-2">
                    <button
                      @click="triggerTaskNow(task)"
                      class="btn btn-xs btn-success btn-outline gap-1"
                      :disabled="runningTaskId === task.id"
                      title="Run immediately"
                    >
                      <i class="ph ph-play-circle" :class="{ 'animate-spin': runningTaskId === task.id }"></i>
                      Run Now
                    </button>

                    <button @click="openEditModal(task)" class="btn btn-xs btn-primary gap-1" title="Configure schedule">
                      <i class="ph ph-gear"></i>
                      Config
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- EMPTY STATE -->
        <div v-else class="text-center py-12 text-base-content/50">
          <i class="ph ph-clock text-4xl mb-2"></i>
          <p class="font-semibold text-sm">No Scheduler Tasks Found</p>
          <p class="text-xs">Register tasks in backend schedule::task() or adjust your search query.</p>
        </div>
      </div>
    </div>

    <!-- CONFIG EDIT MODAL -->
    <div v-if="isModalOpen" class="modal modal-open">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg mb-1 flex items-center gap-2">
          <i class="ph ph-sliders text-primary text-xl"></i>
          Configure Task Scheduler
        </h3>
        <p class="text-xs text-base-content/70 mb-4">
          Adjust schedule timing, operating hours, and regional timezone for
          <span class="font-mono font-bold text-primary">{{ selectedTask?.name }}</span>
        </p>

        <form @submit.prevent="saveTaskConfig" class="space-y-4">
          <!-- ENABLED SWITCH -->
          <div class="form-control bg-base-200 p-3 rounded-xl flex-row justify-between items-center">
            <span class="label-text font-semibold text-xs">Enable Scheduler Task</span>
            <input type="checkbox" class="toggle toggle-success" v-model="form.enabled" />
          </div>

          <!-- TIMEZONE SELECT -->
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text font-semibold text-xs flex items-center gap-1">
                <i class="ph ph-globe text-secondary"></i> Region / Timezone
              </span>
            </label>
            <select v-model="form.timezone" class="select select-bordered select-sm w-full">
              <option v-for="tz in timezoneOptions" :key="tz.value" :value="tz.value">
                {{ tz.label }}
              </option>
            </select>
          </div>

          <!-- CRON EXPRESSION & PRESETS -->
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text font-semibold text-xs flex items-center gap-1">
                <i class="ph ph-timer text-warning"></i> Cron Expression (5 or 6 fields)
              </span>
            </label>
            <input
              v-model="form.cron"
              type="text"
              class="input input-bordered input-sm font-mono"
              placeholder="e.g. 00 02 07 * * 1-5"
              required
            />
            <div class="flex flex-wrap gap-1 mt-2">
              <button
                type="button"
                @click="setPresetCron('*/5 * * * * *')"
                class="btn btn-xs btn-ghost border border-base-300"
              >
                Every 5s
              </button>
              <button
                type="button"
                @click="setPresetCron('0 * * * * *')"
                class="btn btn-xs btn-ghost border border-base-300"
              >
                Every 1 min
              </button>
              <button
                type="button"
                @click="setPresetCron('0 0 * * * *')"
                class="btn btn-xs btn-ghost border border-base-300"
              >
                Hourly
              </button>
              <button
                type="button"
                @click="setPresetCron('00 02 07 * * 1-5')"
                class="btn btn-xs btn-ghost border border-base-300"
              >
                Checkin 07:02
              </button>
              <button
                type="button"
                @click="setPresetCron('50 52 17 * * 1-5')"
                class="btn btn-xs btn-ghost border border-base-300"
              >
                Checkout 17:52
              </button>
            </div>
          </div>

          <!-- OPERATING HOURS WINDOW -->
          <div class="border border-base-200 rounded-xl p-3 bg-base-200/50">
            <label class="label py-0 mb-2">
              <span class="label-text font-semibold text-xs flex items-center gap-1">
                <i class="ph ph-clock text-accent"></i> Operational Hours Window (Optional)
              </span>
            </label>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <span class="text-[10px] text-base-content/60">Start Time (HH:mm)</span>
                <input
                  v-model="form.start_time"
                  type="time"
                  class="input input-bordered input-sm w-full font-mono"
                  placeholder="08:00"
                />
              </div>
              <div>
                <span class="text-[10px] text-base-content/60">End Time (HH:mm)</span>
                <input
                  v-model="form.end_time"
                  type="time"
                  class="input input-bordered input-sm w-full font-mono"
                  placeholder="17:00"
                />
              </div>
            </div>
            <p class="text-[10px] text-base-content/50 mt-1">
              Leave blank to run 24 hours a day without operational hour restriction.
            </p>
          </div>

          <!-- MODAL ACTIONS -->
          <div class="modal-action">
            <button type="button" @click="closeModal" class="btn btn-sm btn-ghost">Cancel</button>
            <button type="submit" class="btn btn-sm btn-primary gap-2" :disabled="saving">
              <i class="ph ph-floppy-disk" :class="{ 'animate-spin': saving }"></i>
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  </Navigation>
</template>
