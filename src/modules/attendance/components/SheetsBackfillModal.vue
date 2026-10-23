<script setup lang="ts">
import { ref, computed } from 'vue'
import { useNotification } from '@/composables/useNotification'
import attendanceService from '../service'
import type { BackfillSheetsPayload, BackfillSheetsResult } from '../dto/attendance.dto'
import moment from 'moment'

defineProps<{
    isOpen: boolean
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'success'): void
}>()

const { notify } = useNotification()

// Today's date default
const todayStr = moment().format('YYYY-MM-DD')

// Form state
const includeAttendance = ref(true)
const attendanceStart = ref('2026-09-01')
const attendanceEnd = ref(todayStr)

const includeWeekly = ref(true)
const weeklyStart = ref('2026-08-01')
const weeklyEnd = ref(todayStr)

const skipHolidays = ref(true)
const skipExisting = ref(true)
const customExcludeInput = ref('')

const isSubmitting = ref(false)
const lastResult = ref<BackfillSheetsResult | null>(null)

const canSubmit = computed(() => {
    return (includeAttendance.value || includeWeekly.value) && !isSubmitting.value
})

const resetResult = () => {
    lastResult.value = null
}

const handleClose = () => {
    if (isSubmitting.value) return
    resetResult()
    emit('close')
}

const executeBackfill = async () => {
    if (!canSubmit.value) return

    let type: 'all' | 'attendance' | 'weekly_report' = 'all'
    if (includeAttendance.value && !includeWeekly.value) {
        type = 'attendance'
    } else if (!includeAttendance.value && includeWeekly.value) {
        type = 'weekly_report'
    }

    const excludeDates = customExcludeInput.value
        .split(',')
        .map(d => d.trim())
        .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))

    const payload: BackfillSheetsPayload = {
        type,
        attendance_start: includeAttendance.value ? attendanceStart.value : undefined,
        attendance_end: includeAttendance.value ? attendanceEnd.value : undefined,
        weekly_start: includeWeekly.value ? weeklyStart.value : undefined,
        weekly_end: includeWeekly.value ? weeklyEnd.value : undefined,
        skip_holidays: skipHolidays.value,
        skip_existing: skipExisting.value,
        exclude_dates: excludeDates.length > 0 ? excludeDates : undefined
    }

    isSubmitting.value = true
    lastResult.value = null

    try {
        const res = await attendanceService.backfillSheets(payload)
        if (res && res.success) {
            notify(res.message || 'Sinkronisasi ke Google Sheets berhasil diselesaikan!', 'success')
            lastResult.value = res.data || null
            emit('success')
        } else {
            notify(res?.message || 'Proses sinkronisasi Google Sheets gagal', 'error')
        }
    } catch (e: any) {
        const errorMsg = e?.response?.data?.message || e.message || 'Terjadi kesalahan saat backfill Google Sheets'
        notify(errorMsg, 'error')
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <div v-if="isOpen" class="modal modal-open z-50">
        <div class="modal-box max-w-2xl bg-base-100 border border-base-300 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <!-- Header -->
            <div class="flex items-start justify-between border-b border-base-200 pb-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold border border-emerald-500/20">
                        <i class="ph ph-file-csv"></i>
                    </div>
                    <div>
                        <h3 class="text-base font-bold text-base-content flex items-center gap-2">
                            Lengkapi Data Google Sheets
                            <span class="badge badge-sm badge-success text-[10px] font-semibold text-white">Backfill</span>
                        </h3>
                        <p class="text-xs text-base-content/60 mt-0.5">
                            Lengkapi presensi harian dan weekly report ke lembar Google Sheets yang terhubung.
                        </p>
                    </div>
                </div>
                <button 
                    type="button" 
                    class="btn btn-sm btn-ghost btn-circle text-base-content/70 hover:bg-base-200" 
                    :disabled="isSubmitting"
                    @click="handleClose"
                >
                    <i class="ph ph-x text-lg"></i>
                </button>
            </div>

            <!-- Banner Hasil Sebelumnya -->
            <div v-if="lastResult" class="alert alert-success bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200 p-4 rounded-xl space-y-2">
                <div class="flex items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-400">
                    <i class="ph ph-check-circle text-lg"></i>
                    <span>Sinkronisasi Google Sheets Berhasil!</span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    <div v-if="lastResult.attendance" class="bg-base-100/60 p-2.5 rounded-lg border border-emerald-500/20">
                        <div class="text-base-content/60 text-[11px]">Absen Hadir</div>
                        <div class="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            +{{ lastResult.attendance.added_days }} hari
                        </div>
                        <div class="text-[10px] text-base-content/50 mt-0.5">
                            Dilewati: {{ lastResult.attendance.skipped_existing }} ada, {{ lastResult.attendance.skipped_holidays }} libur
                        </div>
                    </div>
                    <div v-if="lastResult.weekly_report" class="bg-base-100/60 p-2.5 rounded-lg border border-emerald-500/20">
                        <div class="text-base-content/60 text-[11px]">Weekly Report</div>
                        <div class="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            +{{ lastResult.weekly_report.added_weeks }} minggu
                        </div>
                        <div class="text-[10px] text-base-content/50 mt-0.5">
                            Dilewati: {{ lastResult.weekly_report.skipped_existing }} sudah ada
                        </div>
                    </div>
                    <div class="col-span-2 bg-base-100/60 p-2.5 rounded-lg border border-emerald-500/20 flex flex-col justify-center">
                        <div class="text-base-content/60 text-[11px]">Bulan Terisi</div>
                        <div class="flex flex-wrap gap-1 mt-1">
                            <template v-for="m in Array.from(new Set([...(lastResult.attendance?.months_affected || []), ...(lastResult.weekly_report?.months_affected || [])]))" :key="m">
                                <span class="badge badge-xs badge-outline badge-success text-[10px]">{{ m }}</span>
                            </template>
                            <span v-if="!lastResult.attendance?.months_affected?.length && !lastResult.weekly_report?.months_affected?.length" class="text-xs text-base-content/50">
                                Tidak ada penambahan baru
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Form Content -->
            <div class="space-y-4">
                <!-- Card 1: Presensi Harian -->
                <div class="card bg-base-200/50 border border-base-300 rounded-xl p-4 space-y-3 transition-all" :class="{ 'opacity-60': !includeAttendance }">
                    <div class="flex items-center justify-between">
                        <label class="flex items-center gap-2.5 cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                v-model="includeAttendance" 
                                class="checkbox checkbox-sm checkbox-success rounded"
                                :disabled="isSubmitting"
                            />
                            <span class="font-bold text-sm text-base-content flex items-center gap-2">
                                <i class="ph ph-calendar-check text-emerald-500"></i>
                                Presensi Harian (Absen Kerja)
                            </span>
                        </label>
                        <span class="badge badge-sm badge-ghost text-[10px]">September – Oktober</span>
                    </div>

                    <div v-if="includeAttendance" class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                            <label class="text-[11px] font-semibold text-base-content/70 block mb-1">
                                Dari Tanggal (Start Date)
                            </label>
                            <input 
                                type="date" 
                                v-model="attendanceStart" 
                                class="input input-sm input-bordered w-full text-xs font-mono bg-base-100"
                                :disabled="isSubmitting"
                            />
                        </div>
                        <div>
                            <label class="text-[11px] font-semibold text-base-content/70 block mb-1">
                                Sampai Tanggal (End Date)
                            </label>
                            <input 
                                type="date" 
                                v-model="attendanceEnd" 
                                class="input input-sm input-bordered w-full text-xs font-mono bg-base-100"
                                :disabled="isSubmitting"
                            />
                        </div>
                    </div>
                    <p class="text-[11px] text-base-content/50 leading-relaxed">
                        * Otomatis memfilter hari kerja <strong>Senin s/d Jumat</strong> dan memperbarui checklist di sheet <code>CEKLIS KEHADIRAN</code>.
                    </p>
                </div>

                <!-- Card 2: Weekly Report -->
                <div class="card bg-base-200/50 border border-base-300 rounded-xl p-4 space-y-3 transition-all" :class="{ 'opacity-60': !includeWeekly }">
                    <div class="flex items-center justify-between">
                        <label class="flex items-center gap-2.5 cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                v-model="includeWeekly" 
                                class="checkbox checkbox-sm checkbox-success rounded"
                                :disabled="isSubmitting"
                            />
                            <span class="font-bold text-sm text-base-content flex items-center gap-2">
                                <i class="ph ph-notebook text-emerald-500"></i>
                                Weekly Report
                            </span>
                        </label>
                        <span class="badge badge-sm badge-ghost text-[10px]">Agustus – Oktober</span>
                    </div>

                    <div v-if="includeWeekly" class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                            <label class="text-[11px] font-semibold text-base-content/70 block mb-1">
                                Dari Tanggal (Start Date)
                            </label>
                            <input 
                                type="date" 
                                v-model="weeklyStart" 
                                class="input input-sm input-bordered w-full text-xs font-mono bg-base-100"
                                :disabled="isSubmitting"
                            />
                        </div>
                        <div>
                            <label class="text-[11px] font-semibold text-base-content/70 block mb-1">
                                Sampai Tanggal (End Date)
                            </label>
                            <input 
                                type="date" 
                                v-model="weeklyEnd" 
                                class="input input-sm input-bordered w-full text-xs font-mono bg-base-100"
                                :disabled="isSubmitting"
                            />
                        </div>
                    </div>
                    <p class="text-[11px] text-base-content/50 leading-relaxed">
                        * Otomatis mengelompokkan aktivitas dari database per rentang minggu (Senin–Jumat) dan menambahkan laporan mingguan ke sheet bulan terkait.
                    </p>
                </div>

                <!-- Card 3: Pengaturan Proteksi & Filter -->
                <div class="bg-base-100 border border-base-200 rounded-xl p-4 space-y-3">
                    <h4 class="text-xs font-bold text-base-content/80 flex items-center gap-2">
                        <i class="ph ph-sliders text-sm text-base-content/60"></i>
                        Opsi Filter & Proteksi
                    </h4>

                    <div class="space-y-2.5 text-xs">
                        <label class="flex items-start gap-3 cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                v-model="skipHolidays" 
                                class="checkbox checkbox-xs checkbox-success rounded mt-0.5"
                                :disabled="isSubmitting"
                            />
                            <div>
                                <span class="font-medium text-base-content">Cek & Lewati Hari Libur Nasional Otomatis (SKB 3 Menteri)</span>
                                <p class="text-[11px] text-base-content/50 mt-0.5">
                                    Mencegah absen terisi pada tanggal merah nasional yang jatuh pada hari kerja (misal 17 Agustus).
                                </p>
                            </div>
                        </label>

                        <label class="flex items-start gap-3 cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                v-model="skipExisting" 
                                class="checkbox checkbox-xs checkbox-success rounded mt-0.5"
                                :disabled="isSubmitting"
                            />
                            <div>
                                <span class="font-medium text-base-content">Lewati Data yang Sudah Terisi (Deduplikasi Cerdas)</span>
                                <p class="text-[11px] text-base-content/50 mt-0.5">
                                    Mencegah duplikasi baris di Google Sheets jika tanggal atau weekly report tersebut sudah ada sebelumnya.
                                </p>
                            </div>
                        </label>
                    </div>

                    <div class="pt-2 border-t border-base-200/60">
                        <label class="text-[11px] font-semibold text-base-content/70 block mb-1">
                            Tanggal Tambahan yang Mau Dilewati (Opsional)
                        </label>
                        <input 
                            type="text" 
                            v-model="customExcludeInput" 
                            placeholder="Contoh: 2026-08-17, 2026-09-10 (pisahkan dengan koma)"
                            class="input input-sm input-bordered w-full text-xs font-mono bg-base-100"
                            :disabled="isSubmitting"
                        />
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="modal-action border-t border-base-200 pt-3 flex items-center justify-between">
                <span class="text-[11px] text-base-content/50 flex items-center gap-1.5">
                    <i class="ph ph-shield-check text-emerald-500"></i>
                    Aman dijalankan berulang kali (idempoten)
                </span>
                <div class="flex items-center gap-2">
                    <button 
                        type="button" 
                        class="btn btn-sm btn-ghost text-xs" 
                        :disabled="isSubmitting"
                        @click="handleClose"
                    >
                        Tutup
                    </button>
                    <button 
                        type="button" 
                        class="btn btn-sm btn-success text-white text-xs gap-2 font-semibold shadow"
                        :disabled="!canSubmit"
                        @click="executeBackfill"
                    >
                        <span v-if="isSubmitting" class="loading loading-spinner loading-xs"></span>
                        <i v-else class="ph ph-cloud-arrow-up text-sm"></i>
                        <span>{{ isSubmitting ? 'Menyinkronkan...' : 'Mulai Lengkapi ke Sheets' }}</span>
                    </button>
                </div>
            </div>
        </div>
        <div class="modal-backdrop bg-black/40" @click="handleClose"></div>
    </div>
</template>
