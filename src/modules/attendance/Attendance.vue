<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Navigation from '@/components/Navigation.vue'
import LocationMapModal from './components/LocationMapModal.vue'
import { useNotification } from '@/composables/useNotification'
import attendanceService from './service'
import type { AttendanceSettings, AttendanceLog } from './dto/attendance.dto'
import moment from 'moment'

const { notify } = useNotification()

const loading = ref(false)
const saving = ref(false)
const gettingGps = ref<'wfh' | 'wfo' | null>(null)

// Map modal state
const mapModalState = ref({
    isOpen: false,
    title: '',
    type: 'wfh' as 'wfh' | 'wfo',
    latitude: '',
    longitude: ''
})

const openMapModal = (target: 'wfh' | 'wfo') => {
    if (target === 'wfh') {
        mapModalState.value = {
            isOpen: true,
            title: 'Lokasi WFH (Rumah)',
            type: 'wfh',
            latitude: form.value.wfh_latitude,
            longitude: form.value.wfh_longitude
        }
    } else {
        mapModalState.value = {
            isOpen: true,
            title: 'Lokasi WFO (Kantor)',
            type: 'wfo',
            latitude: form.value.wfo_latitude,
            longitude: form.value.wfo_longitude
        }
    }
}

const onApplyMapCoords = (coords: { latitude: string, longitude: string }) => {
    if (mapModalState.value.type === 'wfh') {
        form.value.wfh_latitude = coords.latitude
        form.value.wfh_longitude = coords.longitude
    } else {
        form.value.wfo_latitude = coords.latitude
        form.value.wfo_longitude = coords.longitude
    }
}

const form = ref<AttendanceSettings>({
    wfh_latitude: '-6.2297907',
    wfh_longitude: '106.8184312',
    wfo_latitude: '-6.2297907',
    wfo_longitude: '106.8184312',
    wfh_days: 'Senin',
    attendance_mode: 'AUTO',
    start_description: 'siap',
    auto_retry: true,
    max_retries: 3
})

const daysList = [
    { label: 'Senin', value: 'Senin' },
    { label: 'Selasa', value: 'Selasa' },
    { label: 'Rabu', value: 'Rabu' },
    { label: 'Kamis', value: 'Kamis' },
    { label: 'Jumat', value: 'Jumat' },
    { label: 'Sabtu', value: 'Sabtu' },
    { label: 'Minggu', value: 'Minggu' }
]

const selectedDays = computed({
    get: () => {
        if (!form.value.wfh_days) return []
        return form.value.wfh_days.split(',').map(d => d.trim()).filter(Boolean)
    },
    set: (val: string[]) => {
        form.value.wfh_days = val.join(',')
    }
})

const toggleDay = (day: string) => {
    const current = [...selectedDays.value]
    const idx = current.indexOf(day)
    if (idx > -1) {
        current.splice(idx, 1)
    } else {
        current.push(day)
    }
    selectedDays.value = current
}

// Mode hari ini
const todayNameIndo = computed(() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    return days[new Date().getDay()]
})

const resolvedTodayMode = computed(() => {
    if (form.value.attendance_mode === 'WFH') return 'WFH'
    if (form.value.attendance_mode === 'WFO') return 'WFO'
    return selectedDays.value.includes(todayNameIndo.value) ? 'WFH' : 'WFO'
})

const activeCoordinates = computed(() => {
    if (resolvedTodayMode.value === 'WFH') {
        return {
            lat: form.value.wfh_latitude,
            long: form.value.wfh_longitude,
            flag: '1 (Flag::WFH)'
        }
    }
    return {
        lat: form.value.wfo_latitude,
        long: form.value.wfo_longitude,
        flag: '0 (Flag::WFO)'
    }
})

// ==========================================
// Log & Retry States
// ==========================================
const logs = ref<AttendanceLog[]>([])
const logsLoading = ref(false)
const logsPage = ref(1)
const logsLimit = ref(10)
const logsTotal = ref(0)
const logsTotalPages = ref(1)
const filterProvider = ref<'' | 'HRMIS' | 'JAHRA'>('')
const filterStatus = ref<'' | 'SUCCESS' | 'FAILED'>('')

const retryingId = ref<string | null>(null)
const retryingAll = ref(false)
const manualLoading = ref<string | null>(null)

// Detail modal message
const selectedLogDetail = ref<AttendanceLog | null>(null)
const isDetailModalOpen = ref(false)

const openDetailModal = (log: AttendanceLog) => {
    selectedLogDetail.value = log
    isDetailModalOpen.value = true
}

const hasFailedLogs = computed(() => {
    return logs.value.some(l => l.status === 'FAILED')
})

const loadSettings = async () => {
    loading.value = true
    try {
        const res = await attendanceService.getSettings()
        if (res && res.data) {
            form.value = {
                wfh_latitude: res.data.wfh_latitude || '-6.2297907',
                wfh_longitude: res.data.wfh_longitude || '106.8184312',
                wfo_latitude: res.data.wfo_latitude || '-6.2297907',
                wfo_longitude: res.data.wfo_longitude || '106.8184312',
                wfh_days: res.data.wfh_days || 'Senin',
                attendance_mode: res.data.attendance_mode || 'AUTO',
                start_description: res.data.start_description || 'siap',
                auto_retry: res.data.auto_retry !== undefined ? res.data.auto_retry : true,
                max_retries: res.data.max_retries || 3
            }
        }
    } catch (e: any) {
        notify(e?.response?.data?.message || 'Gagal memuat pengaturan attendance', 'error')
    } finally {
        loading.value = false
    }
}

const saveSettings = async () => {
    saving.value = true
    try {
        const res = await attendanceService.updateSettings(form.value)
        notify(res?.message || 'Pengaturan attendance berhasil disimpan!', 'success')
    } catch (e: any) {
        notify(e?.response?.data?.message || 'Gagal menyimpan pengaturan attendance', 'error')
    } finally {
        saving.value = false
    }
}

const loadLogs = async (page = 1) => {
    logsLoading.value = true
    logsPage.value = page
    try {
        const res = await attendanceService.getLogs({
            page: logsPage.value,
            limit: logsLimit.value,
            provider: filterProvider.value || undefined,
            status: filterStatus.value || undefined
        })
        if (res && res.data) {
            logs.value = res.data.rows || []
            logsTotal.value = res.data.total || 0
            logsTotalPages.value = res.data.total_pages || 1
        }
    } catch (e: any) {
        notify(e?.response?.data?.message || 'Gagal memuat log presensi', 'error')
    } finally {
        logsLoading.value = false
    }
}

const retryLog = async (log: AttendanceLog) => {
    retryingId.value = log.id
    try {
        const res = await attendanceService.retryLog(log.id)
        if (res && res.success) {
            notify(`Retry presensi ${log.provider} ${log.type} berhasil!`, 'success')
        } else {
            notify(res?.message || `Retry presensi gagal: ${log.provider}`, 'error')
        }
        await loadLogs(logsPage.value)
    } catch (e: any) {
        notify(e?.response?.data?.message || 'Gagal melakukan retry presensi', 'error')
        await loadLogs(logsPage.value)
    } finally {
        retryingId.value = null
    }
}

const retryAllFailed = async () => {
    retryingAll.value = true
    try {
        const res = await attendanceService.retryAllFailed()
        if (res && res.success) {
            notify(res.message || 'Seluruh presensi gagal berhasil di-retry!', 'success')
        } else {
            notify(res?.message || 'Beberapa presensi masih gagal saat retry.', 'warning')
        }
        await loadLogs(1)
    } catch (e: any) {
        notify(e?.response?.data?.message || 'Gagal melakukan retry semua presensi', 'error')
    } finally {
        retryingAll.value = false
    }
}

const triggerManual = async (action: 'hrmis_checkin' | 'hrmis_checkout' | 'jahra_checkin' | 'jahra_checkout') => {
    manualLoading.value = action
    try {
        let res: any
        if (action === 'hrmis_checkin') res = await attendanceService.manualCheckinHrmis()
        else if (action === 'hrmis_checkout') res = await attendanceService.manualCheckoutHrmis()
        else if (action === 'jahra_checkin') res = await attendanceService.manualCheckinJahra()
        else if (action === 'jahra_checkout') res = await attendanceService.manualCheckoutJahra()

        if (res && res.success) {
            notify(res.message || `Presensi ${action} berhasil dieksekusi!`, 'success')
        } else {
            notify(res?.message || `Presensi ${action} gagal`, 'error')
        }
        await loadLogs(1)
    } catch (e: any) {
        notify(e?.response?.data?.message || `Gagal menjalankan ${action}`, 'error')
        await loadLogs(1)
    } finally {
        manualLoading.value = null
    }
}

const getCurrentLocation = (target: 'wfh' | 'wfo') => {
    if (!navigator.geolocation) {
        notify('Browser tidak mendukung Geolocation GPS', 'warning')
        return
    }

    gettingGps.value = target
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude.toFixed(7)
            const lon = pos.coords.longitude.toFixed(7)
            if (target === 'wfh') {
                form.value.wfh_latitude = lat
                form.value.wfh_longitude = lon
            } else {
                form.value.wfo_latitude = lat
                form.value.wfo_longitude = lon
            }
            notify(`Koordinat GPS untuk ${target.toUpperCase()} berhasil diambil!`, 'success')
            gettingGps.value = null
        },
        (err) => {
            notify(`Gagal mengambil GPS: ${err.message}`, 'error')
            gettingGps.value = null
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
}

const resetDefaultWfo = () => {
    form.value.wfo_latitude = '-6.2297907'
    form.value.wfo_longitude = '106.8184312'
    notify('Koordinat WFO direset ke default kantor (-6.2297907, 106.8184312)', 'info')
}

const formatDate = (val: string) => {
    if (!val) return '-'
    return moment(val).format('DD MMM YYYY, HH:mm:ss')
}

onMounted(() => {
    loadSettings()
    loadLogs(1)
})
</script>

<template>
    <Navigation title="Attendance & Presensi">
        <div v-if="loading" class="flex justify-center items-center py-20">
            <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>

        <div v-else class="space-y-6 max-w-6xl mx-auto">
            <!-- Header Summary & Status Hari Ini -->
            <div class="card bg-gradient-to-r from-primary/10 via-base-100 to-secondary/10 border border-base-300 shadow">
                <div class="card-body p-5">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 class="card-title text-base font-bold flex items-center gap-2">
                                <i class="ph ph-calendar-check text-primary text-xl"></i>
                                Status Presensi Hari Ini ({{ todayNameIndo }})
                            </h2>
                            <p class="text-xs text-base-content/70 mt-1">
                                Koordinat dan parameter yang akan dikirim cron scheduler ke HRMIS saat absensi save dijalankan.
                            </p>
                        </div>
                        <div class="flex items-center gap-3 bg-base-100 p-3 rounded-xl border border-base-300 shadow-sm">
                            <div class="text-right">
                                <div class="text-xs text-base-content/60">Mode Aktif</div>
                                <div class="font-bold text-sm" :class="resolvedTodayMode === 'WFH' ? 'text-success' : 'text-info'">
                                    {{ resolvedTodayMode === 'WFH' ? 'Work From Home' : 'Work From Office' }}
                                </div>
                            </div>
                            <div class="badge text-xs font-semibold" :class="resolvedTodayMode === 'WFH' ? 'badge-success' : 'badge-info'">
                                {{ resolvedTodayMode }}
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-base-200 text-xs">
                        <div class="bg-base-200/50 p-2.5 rounded-lg flex items-center justify-between">
                            <div>
                                <span class="text-base-content/60 block">Latitude Payload:</span>
                                <span class="font-mono font-semibold">{{ activeCoordinates.lat }}</span>
                            </div>
                        </div>
                        <div class="bg-base-200/50 p-2.5 rounded-lg flex items-center justify-between">
                            <div>
                                <span class="text-base-content/60 block">Longitude Payload:</span>
                                <span class="font-mono font-semibold">{{ activeCoordinates.long }}</span>
                            </div>
                        </div>
                        <div class="bg-base-200/50 p-2.5 rounded-lg flex items-center justify-between">
                            <div>
                                <span class="text-base-content/60 block">Flag Location:</span>
                                <span class="font-mono font-semibold">{{ activeCoordinates.flag }}</span>
                            </div>
                            <button 
                                type="button"
                                class="btn btn-xs btn-outline btn-primary flex items-center gap-1 shadow-2xs"
                                @click="openMapModal(resolvedTodayMode === 'WFH' ? 'wfh' : 'wfo')"
                                title="Lihat dan cek titik lokasi hari ini di peta"
                            >
                                <i class="ph ph-map-pin"></i>
                                Cek di Map
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Bar: Manual Trigger Presensi -->
            <div class="card bg-base-100 border border-base-300 shadow">
                <div class="card-body p-5">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-200 pb-3">
                        <div>
                            <h3 class="font-bold text-sm flex items-center gap-2">
                                <i class="ph ph-paper-plane-tilt text-primary"></i>
                                Eksekusi Presensi Manual
                            </h3>
                            <p class="text-xs text-base-content/60 mt-0.5">
                                Jalankan presensi langsung secara instan untuk HRMIS atau Jahra.
                            </p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                        <button 
                            type="button" 
                            class="btn btn-sm btn-outline btn-info flex items-center gap-1.5 text-xs"
                            :disabled="manualLoading !== null"
                            @click="triggerManual('hrmis_checkin')"
                        >
                            <span v-if="manualLoading === 'hrmis_checkin'" class="loading loading-spinner loading-xs"></span>
                            <i v-else class="ph ph-sign-in"></i>
                            HRMIS Check-in
                        </button>

                        <button 
                            type="button" 
                            class="btn btn-sm btn-outline btn-warning flex items-center gap-1.5 text-xs"
                            :disabled="manualLoading !== null"
                            @click="triggerManual('hrmis_checkout')"
                        >
                            <span v-if="manualLoading === 'hrmis_checkout'" class="loading loading-spinner loading-xs"></span>
                            <i v-else class="ph ph-sign-out"></i>
                            HRMIS Check-out
                        </button>

                        <button 
                            type="button" 
                            class="btn btn-sm btn-outline btn-secondary flex items-center gap-1.5 text-xs"
                            :disabled="manualLoading !== null"
                            @click="triggerManual('jahra_checkin')"
                        >
                            <span v-if="manualLoading === 'jahra_checkin'" class="loading loading-spinner loading-xs"></span>
                            <i v-else class="ph ph-fingerprint"></i>
                            Jahra Check-in
                        </button>

                        <button 
                            type="button" 
                            class="btn btn-sm btn-outline btn-accent flex items-center gap-1.5 text-xs"
                            :disabled="manualLoading !== null"
                            @click="triggerManual('jahra_checkout')"
                        >
                            <span v-if="manualLoading === 'jahra_checkout'" class="loading loading-spinner loading-xs"></span>
                            <i v-else class="ph ph-door-open"></i>
                            Jahra Check-out
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tabel Riwayat & Log Presensi -->
            <div class="card bg-base-100 border border-base-300 shadow">
                <div class="card-body p-5 space-y-4">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-base-200 pb-3">
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="font-bold text-sm flex items-center gap-2">
                                    <i class="ph ph-clock-counter-clockwise text-primary"></i>
                                    Riwayat & Log Presensi (DB)
                                </h3>
                                <div class="badge badge-sm badge-ghost font-mono">{{ logsTotal }} logs</div>
                            </div>
                            <p class="text-xs text-base-content/60 mt-0.5">
                                Catatan riwayat presensi HRMIS & Jahra yang tersimpan di basis data beserta opsi retry.
                            </p>
                        </div>

                        <div class="flex items-center flex-wrap gap-2">
                            <!-- Filter Provider -->
                            <select v-model="filterProvider" class="select select-bordered select-xs text-xs" @change="loadLogs(1)">
                                <option value="">Semua Provider</option>
                                <option value="HRMIS">HRMIS</option>
                                <option value="JAHRA">Jahra</option>
                            </select>

                            <!-- Filter Status -->
                            <select v-model="filterStatus" class="select select-bordered select-xs text-xs" @change="loadLogs(1)">
                                <option value="">Semua Status</option>
                                <option value="SUCCESS">Berhasil</option>
                                <option value="FAILED">Gagal</option>
                            </select>

                            <!-- Tombol Refresh -->
                            <button 
                                type="button" 
                                class="btn btn-xs btn-outline" 
                                :disabled="logsLoading" 
                                @click="loadLogs(logsPage)"
                                title="Refresh data log"
                            >
                                <i class="ph ph-arrows-clockwise" :class="{ 'animate-spin': logsLoading }"></i>
                                Refresh
                            </button>

                            <!-- Tombol Retry Semua Gagal -->
                            <button 
                                v-if="hasFailedLogs"
                                type="button" 
                                class="btn btn-xs btn-error text-white flex items-center gap-1"
                                :disabled="retryingAll"
                                @click="retryAllFailed"
                                title="Coba ulang semua presensi yang gagal hari ini"
                            >
                                <span v-if="retryingAll" class="loading loading-spinner loading-xs"></span>
                                <i v-else class="ph ph-arrow-counter-clockwise"></i>
                                Retry Semua yang Gagal
                            </button>
                        </div>
                    </div>

                    <!-- Table Container -->
                    <div class="overflow-x-auto min-h-[160px]">
                        <div v-if="logsLoading" class="flex justify-center items-center py-12">
                            <span class="loading loading-spinner loading-md text-primary"></span>
                        </div>

                        <div v-else-if="logs.length === 0" class="text-center py-12 text-base-content/60 space-y-2">
                            <i class="ph ph-files text-3xl block text-base-content/40"></i>
                            <div class="text-xs font-semibold">Belum ada riwayat presensi yang tercatat di database</div>
                            <div class="text-[11px]">Riwayat akan otomatis muncul setiap kali cron scheduler atau presensi manual dijalankan.</div>
                        </div>

                        <table v-else class="table table-sm table-zebra w-full text-xs">
                            <thead>
                                <tr class="bg-base-200/60 text-base-content/70">
                                    <th>Waktu</th>
                                    <th>Provider</th>
                                    <th>Tipe</th>
                                    <th>Status</th>
                                    <th>Eksekusi</th>
                                    <th>Pesan / Respon Server</th>
                                    <th>Retry</th>
                                    <th class="text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in logs" :key="item.id" class="hover:bg-base-200/40 transition-colors">
                                    <td class="font-mono text-[11px] whitespace-nowrap text-base-content/80">
                                        {{ formatDate(item.created_at) }}
                                    </td>
                                    <td>
                                        <span 
                                            class="badge badge-xs font-semibold"
                                            :class="item.provider === 'HRMIS' ? 'badge-info text-info-content' : 'badge-secondary text-secondary-content'"
                                        >
                                            {{ item.provider }}
                                        </span>
                                    </td>
                                    <td>
                                        <span 
                                            class="badge badge-xs font-semibold"
                                            :class="item.type === 'CHECKIN' ? 'badge-success' : 'badge-warning'"
                                        >
                                            {{ item.type }}
                                        </span>
                                    </td>
                                    <td>
                                        <span 
                                            class="badge badge-xs font-semibold flex items-center gap-1 w-fit"
                                            :class="item.status === 'SUCCESS' ? 'badge-success' : 'badge-error text-white'"
                                        >
                                            <i :class="item.status === 'SUCCESS' ? 'ph ph-check' : 'ph ph-x'"></i>
                                            {{ item.status === 'SUCCESS' ? 'BERHASIL' : 'GAGAL' }}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge badge-xs badge-ghost text-[10px]">
                                            {{ item.execution_type }}
                                        </span>
                                    </td>
                                    <td class="max-w-[280px]">
                                        <div 
                                            class="truncate cursor-pointer hover:underline text-base-content/80" 
                                            :title="item.message || '(tidak ada pesan)'"
                                            @click="openDetailModal(item)"
                                        >
                                            {{ item.message || '-' }}
                                        </div>
                                    </td>
                                    <td>
                                        <span v-if="item.retry_count > 0" class="badge badge-xs badge-outline badge-primary font-mono">
                                            {{ item.retry_count }}x
                                        </span>
                                        <span v-else class="text-base-content/40 font-mono text-[11px]">0x</span>
                                    </td>
                                    <td class="text-center">
                                        <button 
                                            type="button" 
                                            class="btn btn-xs flex items-center gap-1 font-semibold"
                                            :class="item.status === 'FAILED' ? 'btn-error btn-outline' : 'btn-ghost'"
                                            :disabled="retryingId === item.id"
                                            @click="retryLog(item)"
                                            title="Coba ulang presensi ini"
                                        >
                                            <span v-if="retryingId === item.id" class="loading loading-spinner loading-xs"></span>
                                            <i v-else class="ph ph-arrows-clockwise text-xs"></i>
                                            Retry
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div v-if="logsTotalPages > 1" class="flex items-center justify-between pt-3 border-t border-base-200 text-xs">
                        <span class="text-base-content/60">
                            Menampilkan halaman {{ logsPage }} dari {{ logsTotalPages }} (Total {{ logsTotal }} catatan)
                        </span>
                        <div class="join">
                            <button 
                                type="button" 
                                class="join-item btn btn-xs" 
                                :disabled="logsPage <= 1"
                                @click="loadLogs(logsPage - 1)"
                            >
                                « Prev
                            </button>
                            <button class="join-item btn btn-xs btn-active">{{ logsPage }}</button>
                            <button 
                                type="button" 
                                class="join-item btn btn-xs" 
                                :disabled="logsPage >= logsTotalPages"
                                @click="loadLogs(logsPage + 1)"
                            >
                                Next »
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mode Selection & General Settings -->
            <div class="card bg-base-100 border border-base-300 shadow">
                <div class="card-body p-6 space-y-5">
                    <h3 class="font-bold text-sm flex items-center gap-2 border-b border-base-200 pb-2">
                        <i class="ph ph-sliders text-primary"></i>
                        Mode Kehadiran & Kebijakan Jadwal
                    </h3>

                    <div class="space-y-3">
                        <label class="text-xs font-semibold text-base-content/80">Pilih Kebijakan / Mode Presensi:</label>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <label class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all hover:border-primary"
                                   :class="form.attendance_mode === 'AUTO' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-base-300'">
                                <input type="radio" value="AUTO" v-model="form.attendance_mode" class="radio radio-primary radio-sm" />
                                <div>
                                    <div class="font-semibold text-xs">AUTO (Ikuti Hari)</div>
                                    <div class="text-[11px] text-base-content/60">WFH pada hari yang dicentang</div>
                                </div>
                            </label>

                            <label class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all hover:border-success"
                                   :class="form.attendance_mode === 'WFH' ? 'border-success bg-success/5 ring-1 ring-success' : 'border-base-300'">
                                <input type="radio" value="WFH" v-model="form.attendance_mode" class="radio radio-success radio-sm" />
                                <div>
                                    <div class="font-semibold text-xs text-success">Paksa Selalu WFH</div>
                                    <div class="text-[11px] text-base-content/60">Semua hari dianggap WFH</div>
                                </div>
                            </label>

                            <label class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all hover:border-info"
                                   :class="form.attendance_mode === 'WFO' ? 'border-info bg-info/5 ring-1 ring-info' : 'border-base-300'">
                                <input type="radio" value="WFO" v-model="form.attendance_mode" class="radio radio-info radio-sm" />
                                <div>
                                    <div class="font-semibold text-xs text-info">Paksa Selalu WFO</div>
                                    <div class="text-[11px] text-base-content/60">Semua hari dianggap WFO</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Pilihan Hari WFH (Muncul jika mode AUTO) -->
                    <div v-if="form.attendance_mode === 'AUTO'" class="space-y-2 pt-2 bg-base-200/40 p-4 rounded-xl border border-base-200">
                        <label class="text-xs font-semibold text-base-content/80 flex items-center justify-between">
                            <span>Pilih Hari Kerja yang Ditetapkan sebagai WFH:</span>
                            <span class="text-[11px] text-primary font-normal">
                                Hari yang tidak dipilih otomatis menjadi WFO
                            </span>
                        </label>
                        <div class="flex flex-wrap gap-2 pt-1">
                            <button 
                                v-for="d in daysList" 
                                :key="d.value"
                                type="button"
                                class="btn btn-sm text-xs transition-all"
                                :class="selectedDays.includes(d.value) ? 'btn-primary' : 'btn-outline border-base-300'"
                                @click="toggleDay(d.value)"
                            >
                                <i :class="selectedDays.includes(d.value) ? 'ph ph-check' : 'ph ph-plus'"></i>
                                {{ d.label }}
                            </button>
                        </div>
                    </div>

                    <!-- Keterangan Start Description -->
                    <div class="space-y-1">
                        <label class="text-xs font-semibold text-base-content/80">Keterangan Catatan Kehadiran (start_description):</label>
                        <input 
                            v-model="form.start_description" 
                            type="text" 
                            class="input input-bordered input-sm w-full text-xs font-mono" 
                            placeholder="siap" 
                        />
                    </div>

                    <!-- Auto-Retry Settings -->
                    <div class="pt-3 border-t border-base-200 space-y-3">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-semibold text-xs text-base-content/90 flex items-center gap-1.5">
                                    <i class="ph ph-arrows-clockwise text-primary"></i>
                                    Otomatis Retry (Auto Retry) Jika Presensi Gagal
                                </div>
                                <div class="text-[11px] text-base-content/60 mt-0.5">
                                    Jika aktif, background scheduler akan otomatis mencoba kembali presensi yang berstatus gagal pada rentang jam kerja.
                                </div>
                            </div>
                            <input 
                                type="checkbox" 
                                class="toggle toggle-primary toggle-sm" 
                                v-model="form.auto_retry" 
                            />
                        </div>

                        <div v-if="form.auto_retry" class="flex items-center gap-3 bg-base-200/40 p-3 rounded-xl border border-base-200 text-xs">
                            <span class="text-base-content/70">Batas Maksimal Percobaan Ulang (Max Retries):</span>
                            <div class="join">
                                <button 
                                    v-for="r in [1, 2, 3, 5]" 
                                    :key="r"
                                    type="button" 
                                    class="join-item btn btn-xs"
                                    :class="form.max_retries === r ? 'btn-primary' : 'btn-outline'"
                                    @click="form.max_retries = r"
                                >
                                    {{ r }}x
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Koordinat WFH vs WFO Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- WFH Coordinates Card -->
                <div class="card bg-base-100 border border-base-300 shadow">
                    <div class="card-body p-6 space-y-4">
                        <div class="flex items-center justify-between border-b border-base-200 pb-2">
                            <h3 class="font-bold text-sm flex items-center gap-2 text-success">
                                <i class="ph ph-house-line text-lg"></i>
                                Lokasi WFH (Rumah)
                            </h3>
                            <div class="flex items-center gap-1.5">
                                <button 
                                    type="button" 
                                    class="btn btn-xs btn-outline btn-success flex items-center gap-1"
                                    @click="openMapModal('wfh')"
                                    title="Cek & sesuaikan lokasi WFH pada peta"
                                >
                                    <i class="ph ph-map-pin"></i>
                                    Cek Map
                                </button>
                                <button 
                                    type="button"
                                    class="btn btn-xs btn-outline btn-success flex items-center gap-1"
                                    :disabled="gettingGps === 'wfh'"
                                    @click="getCurrentLocation('wfh')"
                                >
                                    <span v-if="gettingGps === 'wfh'" class="loading loading-spinner loading-xs"></span>
                                    <i v-else class="ph ph-crosshair"></i>
                                    Ambil GPS
                                </button>
                            </div>
                        </div>

                        <p class="text-[11px] text-base-content/60">
                            Koordinat yang dikirim ketika presensi WFH (flag_location = 1).
                        </p>

                        <div class="space-y-3">
                            <div>
                                <label class="text-[11px] font-semibold text-base-content/70 block mb-1">Latitude Rumah:</label>
                                <input 
                                    v-model="form.wfh_latitude" 
                                    type="text" 
                                    class="input input-bordered input-sm w-full text-xs font-mono"
                                    placeholder="-6.2297907" 
                                />
                            </div>
                            <div>
                                <label class="text-[11px] font-semibold text-base-content/70 block mb-1">Longitude Rumah:</label>
                                <input 
                                    v-model="form.wfh_longitude" 
                                    type="text" 
                                    class="input input-bordered input-sm w-full text-xs font-mono"
                                    placeholder="106.8184312" 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- WFO Coordinates Card -->
                <div class="card bg-base-100 border border-base-300 shadow">
                    <div class="card-body p-6 space-y-4">
                        <div class="flex items-center justify-between border-b border-base-200 pb-2">
                            <h3 class="font-bold text-sm flex items-center gap-2 text-info">
                                <i class="ph ph-buildings text-lg"></i>
                                Lokasi WFO (Kantor)
                            </h3>
                            <div class="flex items-center gap-1.5">
                                <button 
                                    type="button" 
                                    class="btn btn-xs btn-outline btn-info flex items-center gap-1"
                                    @click="openMapModal('wfo')"
                                    title="Cek & sesuaikan lokasi WFO pada peta"
                                >
                                    <i class="ph ph-map-pin"></i>
                                    Cek Map
                                </button>
                                <button 
                                    type="button"
                                    class="btn btn-xs btn-ghost text-base-content/60 hover:text-base-content"
                                    @click="resetDefaultWfo"
                                    title="Reset ke kantor default"
                                >
                                    Default
                                </button>
                                <button 
                                    type="button"
                                    class="btn btn-xs btn-outline btn-info flex items-center gap-1"
                                    :disabled="gettingGps === 'wfo'"
                                    @click="getCurrentLocation('wfo')"
                                >
                                    <span v-if="gettingGps === 'wfo'" class="loading loading-spinner loading-xs"></span>
                                    <i v-else class="ph ph-crosshair"></i>
                                    Ambil GPS
                                </button>
                            </div>
                        </div>

                        <p class="text-[11px] text-base-content/60">
                            Koordinat yang dikirim ketika presensi WFO (flag_location = 0).
                        </p>

                        <div class="space-y-3">
                            <div>
                                <label class="text-[11px] font-semibold text-base-content/70 block mb-1">Latitude Kantor:</label>
                                <input 
                                    v-model="form.wfo_latitude" 
                                    type="text" 
                                    class="input input-bordered input-sm w-full text-xs font-mono"
                                    placeholder="-6.2297907" 
                                />
                            </div>
                            <div>
                                <label class="text-[11px] font-semibold text-base-content/70 block mb-1">Longitude Kantor:</label>
                                <input 
                                    v-model="form.wfo_longitude" 
                                    type="text" 
                                    class="input input-bordered input-sm w-full text-xs font-mono"
                                    placeholder="106.8184312" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-end items-center gap-3 pt-4 border-t border-base-200">
                <button 
                    type="button" 
                    class="btn btn-sm btn-ghost text-xs" 
                    :disabled="saving"
                    @click="loadSettings"
                >
                    Batal / Reset
                </button>
                <button 
                    type="button" 
                    class="btn btn-sm btn-primary text-xs px-6 flex items-center gap-2"
                    :disabled="saving"
                    @click="saveSettings"
                >
                    <span v-if="saving" class="loading loading-spinner loading-xs"></span>
                    <i v-else class="ph ph-floppy-disk"></i>
                    Simpan Pengaturan
                </button>
            </div>
        </div>

        <!-- Modal Map Cek & Sesuaikan Koordinat -->
        <LocationMapModal
            v-model:is-open="mapModalState.isOpen"
            :title="mapModalState.title"
            :type="mapModalState.type"
            :latitude="mapModalState.latitude"
            :longitude="mapModalState.longitude"
            @apply="onApplyMapCoords"
        />

        <!-- Modal Detail Log -->
        <dialog class="modal" :class="{ 'modal-open': isDetailModalOpen }">
            <div class="modal-box max-w-lg text-xs space-y-3">
                <div class="flex items-center justify-between border-b border-base-200 pb-2">
                    <h3 class="font-bold text-sm flex items-center gap-2">
                        <i class="ph ph-info text-primary text-base"></i>
                        Detail Respon Presensi
                    </h3>
                    <button class="btn btn-xs btn-circle btn-ghost" @click="isDetailModalOpen = false">✕</button>
                </div>

                <div v-if="selectedLogDetail" class="space-y-3">
                    <div class="grid grid-cols-2 gap-2 bg-base-200/50 p-3 rounded-lg">
                        <div>
                            <span class="text-base-content/60 block">Provider:</span>
                            <span class="font-semibold">{{ selectedLogDetail.provider }}</span>
                        </div>
                        <div>
                            <span class="text-base-content/60 block">Tipe:</span>
                            <span class="font-semibold">{{ selectedLogDetail.type }}</span>
                        </div>
                        <div>
                            <span class="text-base-content/60 block">Status:</span>
                            <span 
                                class="font-semibold"
                                :class="selectedLogDetail.status === 'SUCCESS' ? 'text-success' : 'text-error'"
                            >
                                {{ selectedLogDetail.status }}
                            </span>
                        </div>
                        <div>
                            <span class="text-base-content/60 block">Eksekusi:</span>
                            <span class="font-semibold">{{ selectedLogDetail.execution_type }} (Retry: {{ selectedLogDetail.retry_count }}x)</span>
                        </div>
                        <div class="col-span-2">
                            <span class="text-base-content/60 block">Waktu:</span>
                            <span class="font-mono">{{ formatDate(selectedLogDetail.created_at) }}</span>
                        </div>
                    </div>

                    <div>
                        <span class="text-base-content/70 font-semibold block mb-1">Pesan Respon / Error:</span>
                        <div class="bg-base-200 p-3 rounded-lg font-mono text-[11px] whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                            {{ selectedLogDetail.message || '(tidak ada pesan)' }}
                        </div>
                    </div>

                    <div v-if="selectedLogDetail.payload">
                        <span class="text-base-content/70 font-semibold block mb-1">Payload:</span>
                        <div class="bg-base-200 p-3 rounded-lg font-mono text-[11px] whitespace-pre-wrap break-all max-h-36 overflow-y-auto">
                            {{ selectedLogDetail.payload }}
                        </div>
                    </div>
                </div>

                <div class="modal-action pt-2">
                    <button 
                        v-if="selectedLogDetail && selectedLogDetail.status === 'FAILED'"
                        type="button" 
                        class="btn btn-xs btn-error text-white flex items-center gap-1"
                        :disabled="retryingId === selectedLogDetail.id"
                        @click="retryLog(selectedLogDetail); isDetailModalOpen = false;"
                    >
                        <i class="ph ph-arrows-clockwise"></i>
                        Retry Presensi Ini
                    </button>
                    <button class="btn btn-xs" @click="isDetailModalOpen = false">Tutup</button>
                </div>
            </div>
        </dialog>
    </Navigation>
</template>
