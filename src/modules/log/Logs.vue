<script setup lang="ts">
import Navigation from "@/components/Navigation.vue"
import { ref, onMounted } from "vue"
import { useNotification } from "@/composables/useNotification"
import logService from "./service"

const { notify } = useNotification()

const level = ref<string>("INFO")
const loading = ref(false)
const initialLoading = ref(true)

const levels: string[] = [
    "DEBUG",
    "INFO",
    "WARNING",
    "CRITICAL",
    "FATAL"
]

const loadConfig = async () => {
    initialLoading.value = true

    try {
        const res = await logService.getConfig()
        level.value = res.data
    } catch {
        notify("Failed to load log config", "error")
    } finally {
        initialLoading.value = false
    }
}

const setLevel = async (newLevel: string) => {
    loading.value = true

    try {
        await logService.setLevel(newLevel)

        level.value = newLevel
        notify(`Log level set to ${newLevel}`, "success")

    } catch {
        notify("Failed to update log level", "error")
    } finally {
        loading.value = false
    }
}

onMounted(loadConfig)
</script>

<template>
    <Navigation title="Log Control Center">

        <div class="max-w-5xl mx-auto space-y-6">

            <template v-if="initialLoading">

                <!-- HEADER SKELETON -->
                <div class="card bg-base-100 shadow">
                    <div class="card-body flex flex-row items-center justify-between">

                        <div class="space-y-3">
                            <div class="skeleton h-4 w-32"></div>
                            <div class="skeleton h-10 w-40"></div>
                        </div>

                        <div class="skeleton h-8 w-24 rounded-full"></div>

                    </div>
                </div>

                <!-- CONTROL PANEL SKELETON -->
                <div class="card bg-base-100 shadow">
                    <div class="card-body">

                        <div class="flex items-center justify-between mb-4">
                            <div class="skeleton h-5 w-40"></div>
                            <div class="skeleton h-4 w-32"></div>
                        </div>

                        <div class="grid grid-cols-5 gap-3">

                            <div
                                v-for="i in 5"
                                :key="i"
                                class="skeleton h-12 w-full rounded-xl"
                            ></div>

                        </div>

                    </div>
                </div>

                <!-- ALERT SKELETON -->
                <div class="card bg-base-100 shadow">
                    <div class="card-body">
                        <div class="flex items-center gap-3">
                            <div class="skeleton h-6 w-6 rounded-full"></div>
                            <div class="skeleton h-4 w-full"></div>
                        </div>
                    </div>
                </div>

            </template>

            <template v-else>

                <!-- HEADER CARD -->
                <div class="card bg-base-100 shadow">
                    <div class="card-body flex flex-row items-center justify-between">

                        <div>
                            <div class="text-sm opacity-60">Current Log Level</div>
                            <div class="text-3xl font-bold tracking-wide">
                                {{ level.toUpperCase() }}
                            </div>
                        </div>

                        <div class="badge badge-lg" :class="{
                            'badge-success': level === 'INFO',
                            'badge-warning': level === 'WARNING',
                            'badge-error': level === 'CRITICAL',
                            'badge-neutral': level === 'DEBUG',
                            'badge-ghost': level === 'FATAL'
                        }">
                            ACTIVE
                        </div>

                    </div>
                </div>

                <!-- CONTROL PANEL -->
                <div class="card bg-base-100 shadow">
                    <div class="card-body">

                        <div class="flex items-center justify-between mb-4">
                            <div class="font-semibold">Log Level Control</div>
                            <div class="text-xs opacity-60">
                                Select severity level
                            </div>
                        </div>

                        <div class="grid grid-cols-5 gap-3">

                            <button
                                v-for="l in levels"
                                :key="l"
                                class="btn transition-all duration-200"
                                :class="[
                                    level === l ? 'btn-primary scale-105 shadow-md' : 'btn-outline'
                                ]"
                                :disabled="loading"
                                @click="setLevel(l)"
                            >
                                <span
                                    v-if="loading && level !== l"
                                    class="loading loading-spinner loading-xs"
                                ></span>

                                {{ l.toUpperCase() }}
                            </button>

                        </div>

                    </div>
                </div>

                <!-- INFO CARD -->
                <div class="alert bg-yellow-100 text-yellow-800 mb-6 border border-yellow-300 shadow-sm flex items-center gap-2">
                    <i class="ph ph-warning"></i>
                    <span>
                        Higher log levels reduce noise. Debug shows everything, Fatal shows only critical crashes.
                    </span>
                </div>

            </template>

        </div>

    </Navigation>
</template>