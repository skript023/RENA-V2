<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Navigation from '@/components/Navigation.vue'
import { useNotification } from '@/composables/useNotification'
import attendanceService from './service'
import type { AttendanceSettings } from './dto/attendance.dto'

const { notify } = useNotification()

const loading = ref(false)
const saving = ref(false)
const gettingGps = ref<'wfh' | 'wfo' | null>(null)

const form = ref<AttendanceSettings>({
    wfh_latitude: '-6.2297907',
    wfh_longitude: '106.8184312',
    wfo_latitude: '-6.2297907',
    wfo_longitude: '106.8184312',
    wfh_days: 'Senin',
    attendance_mode: 'AUTO',
    start_description: 'siap'
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

// Simulasi mode hari ini
const todayNameIndo = computed(() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    return days[new Date().getDay()]
})

const resolvedTodayMode = computed(() => {
    if (form.value.attendance_mode === 'WFH') return 'WFH'
    if (form.value.attendance_mode === 'WFO') return 'WFO'
    // AUTO
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
                start_description: res.data.start_description || 'siap'
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

onMounted(loadSettings)
</script>

<template>
    <Navigation title="Attendance Settings">
        <div v-if="loading" class="flex justify-center items-center py-20">
            <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>

        <div v-else class="space-y-6 max-w-5xl mx-auto">
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
                                Preview parameter yang akan dikirim cron scheduler ke HRMIS saat absensi save dijalankan.
                            </p>
                        </div>
                        <div class="flex items-center gap-3 bg-base-100 p-3 rounded-xl border border-base-300 shadow-sm">
                            <div class="text-right">
                                <div class="text-xs text-base-content/60">Mode Aktif</div>
                                <div class="font-bold text-sm" :class="resolvedTodayMode === 'WFH' ? 'text-success' : 'text-info'">
                                    {{ resolvedTodayMode === 'WFH' ? 'Work From Home' : 'Work From Office' }}
                                </div>
                            </div>
                            <div class="badge text-xs" :class="resolvedTodayMode === 'WFH' ? 'badge-success' : 'badge-info'">
                                {{ resolvedTodayMode }}
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-base-200 text-xs">
                        <div class="bg-base-200/50 p-2.5 rounded-lg">
                            <span class="text-base-content/60 block">Latitude Payload:</span>
                            <span class="font-mono font-semibold">{{ activeCoordinates.lat }}</span>
                        </div>
                        <div class="bg-base-200/50 p-2.5 rounded-lg">
                            <span class="text-base-content/60 block">Longitude Payload:</span>
                            <span class="font-mono font-semibold">{{ activeCoordinates.long }}</span>
                        </div>
                        <div class="bg-base-200/50 p-2.5 rounded-lg">
                            <span class="text-base-content/60 block">Flag Location:</span>
                            <span class="font-mono font-semibold">{{ activeCoordinates.flag }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mode Selection & General Settings -->
            <div class="card bg-base-100 border border-base-300 shadow">
                <div class="card-body p-6 space-y-4">
                    <h3 class="font-bold text-sm flex items-center gap-2 border-b border-base-200 pb-2">
                        <i class="ph ph-sliders text-primary"></i>
                        Mode Kehadiran & Jadwal
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
                            <button 
                                type="button"
                                class="btn btn-xs btn-outline btn-success flex items-center gap-1"
                                :disabled="gettingGps === 'wfh'"
                                @click="getCurrentLocation('wfh')"
                            >
                                <span v-if="gettingGps === 'wfh'" class="loading loading-spinner loading-xs"></span>
                                <i v-else class="ph ph-crosshair"></i>
                                Ambil GPS Saya
                            </button>
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
                            <div class="flex gap-1.5">
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
    </Navigation>
</template>

