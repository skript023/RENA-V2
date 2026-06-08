<script setup lang="ts">
import Navigation from '@/components/Navigation.vue';
import type { WorkerStatus, JobStatus, WorkerStats } from './dto/worker';
import { onMounted, ref } from 'vue';
import worker from './service';
import { usePagination } from '@/composables/usePagination';
import { useData } from '@/composables/useData';

const workersPaginated = usePagination<WorkerStatus[]>(worker.get, 5);
const jobsPaginated = usePagination<JobStatus[]>(worker.get_job, 5);
const workerStats = useData<WorkerStats>(worker.get_status);

const queues = ref([
    { name: "youtube", jobs: 20, active: 3 },
    { name: "tiktok", jobs: 10, active: 1 },
    { name: "playlist", jobs: 5, active: 0 }
]);

const statItems = [
    { label: 'Active Jobs', key: 'processing', border: 'border-green-300' },
    { label: 'Waiting', key: 'waiting', border: 'border-yellow-300' },
    { label: 'Failed', key: 'failed', border: 'border-red-300' },
    { label: 'Total Jobs', key: 'total', border: 'border-blue-300' }
]

const selectedJob = ref<JobStatus | null>(null);

const statusClass = (status: string) => {
    if (status === 'processing' || status === 'downloading') return 'text-blue-400 animate-pulse'
    if (status === 'waiting' || status === 'preparing download') return 'text-yellow-400 animate-pulse'
    if (status === 'done' || status === 'finalizing') return 'text-green-400'
    if (status === 'failed') return 'text-red-400'
    return ''
}

const parseArgs = (args: string) => {
    try {
        return JSON.parse(decodeURIComponent(args))
    } catch {
        return {}
    }
}

onMounted(async () => {
    await Promise.all([
        workersPaginated.fetch(),
        jobsPaginated.fetch(),
        workerStats.fetch()
    ]);
});

</script>

<template>
    <Navigation title="Worker Monitor">
        <div class="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div v-for="item in statItems" :key="item.key"
                class="p-4 rounded-xl shadow-sm bg-base border"
                :class="item.border">

                <template v-if="workerStats.loading.value">
                    <div class="skeleton h-3 w-24 mb-3"></div>
                    <div class="skeleton h-6 w-16"></div>
                </template>

                <template v-else>
                    <p class="text-sm text-base-content/70">
                        {{ item.label }}
                    </p>

                    <h3 class="text-xl font-semibold mt-2">
                        {{
                            item.key === 'processing' ? workerStats.data.value?.processing :
                            item.key === 'waiting' ? workerStats.data.value?.waiting :
                            item.key === 'failed' ? workerStats.data.value?.failed :
                            workerStats.data.value?.total ?? 0
                        }}
                    </h3>
                </template>

            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <!-- QUEUES -->
            <div class="card bg-base-100 shadow">
                <div class="card-body">
                    <h2 class="card-title">Queues</h2>

                    <div v-for="q in queues" :key="q.name" class="flex justify-between items-center p-3 rounded-lg hover:bg-base-200 cursor-pointer">
                        <div>
                            <p class="font-medium">{{ q.name }}</p>
                            <p class="text-xs opacity-60">{{ q.jobs }} jobs</p>
                        </div>

                        <span class="badge badge-info">
                        {{ q.active }} active
                        </span>
                    </div>
                </div>
            </div>

            <!-- WORKERS -->
            <div class="card bg-base-100 shadow">
                <div class="card-body">
                    <h2 class="card-title">Workers</h2>

                    <div v-if="workersPaginated.loading.value" class="flex flex-col">
                        <div v-for="i in 5" :key="i" class="flex justify-between items-center p-3 rounded-lg">
                            <div class="flex flex-col gap-2 w-full">
                                <div class="skeleton h-4 w-32"></div>
                                <div class="skeleton h-3 w-24"></div>
                            </div>
                            <div class="skeleton h-5 w-16 rounded-full"></div>
                        </div>
                    </div>
                    <div v-else> 
                        <div v-for="w in workersPaginated.data.value" :key="w?.pid" class="flex justify-between items-center p-3 rounded-lg hover:bg-base-200 cursor-pointer">
                            <div>
                                <p class="font-medium">{{ w?.name }}</p>
                                <p class="text-xs opacity-60">{{ w?.last_queued }}</p>
                            </div>

                            <span class="badge"
                                :class="w?.state === 'idle' ? 'badge-success' : 'badge-warning'">
                            {{ w?.state }}
                            </span>
                        </div>
                    </div>
                    <div class="flex justify-between items-center mt-4">
                        <button class="btn btn-sm"
                            @click="workersPaginated.prev"
                            :disabled="workersPaginated.page.value === 1">
                            Prev
                        </button>

                        <span class="text-sm">
                            {{ workersPaginated.page.value }} / {{ workersPaginated.lastPage.value }}
                        </span>

                        <button class="btn btn-sm"
                            @click="workersPaginated.next"
                            :disabled="workersPaginated.page.value >= workersPaginated.lastPage.value">
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- TASK LIST + CALENDAR -->
        <div class="card bg-base-100 shadow mt-6">
            <div class="card-body">
                 <h2 class="card-title">Jobs</h2>

                <input
                    v-model="jobsPaginated.search.value"
                    type="text"
                    placeholder="Search jobs..."
                    class="input input-bordered input-sm w-full md:max-w-xs"
                />

                <div class="overflow-x-auto">
                <table class="table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Status</th>
                        <th>Target</th>
                        <th>Args</th>
                        <th>Message</th>
                        <th>Created</th>
                    </tr>
                    </thead>

                    <tbody>
                        <tr v-if="jobsPaginated.loading.value" v-for="n in 5" :key="'sk-' + n" class="animate-pulse">
                            <td>
                                <div class="h-4 w-24 bg-base-300 rounded"></div>
                            </td>

                            <td>
                                <div class="h-5 w-16 bg-base-300 rounded"></div>
                            </td>

                            <td>
                                <div class="h-4 w-32 bg-base-300 rounded mb-2"></div>
                                <div class="h-3 w-24 bg-base-300 rounded"></div>
                            </td>

                            <td>
                                <div class="h-3 w-20 bg-base-300 rounded mb-2"></div>
                                <div class="h-3 w-16 bg-base-300 rounded"></div>
                            </td>

                            <td>
                                <div class="h-4 w-28 bg-base-300 rounded"></div>
                            </td>

                        </tr>
                        <tr v-else v-for="job in jobsPaginated.data.value" :key="job?.uuid" class="cursor-pointer hover" @click="selectedJob = job">

                            <td>{{ job?.uuid }}</td>

                            <td>
                                <span class="badge" :class="statusClass(job?.status)">
                                    {{ job?.status }}
                                </span>
                            </td>
                            
                            <td class="text-sm">
                                {{ job?.function_name }}
                                <div class="text-xs opacity-60">
                                Worker hint: {{ job?.worker ?? '-' }}
                                </div>
                            </td>
                            <div v-if="job?.args">
                                <div>
                                    🎥 {{ parseArgs(job?.args)?.video_id }}
                                </div>
                                <div>
                                    <div v-if="job?.function_name === 'music:download'">⚙️ {{ parseArgs(job?.args)?.quality }}kbps</div>
                                    <div v-if="job?.function_name === 'video:download'">⚙️ {{ parseArgs(job?.args)?.quality }}p</div>
                                </div>
                            </div>
                            <td>
                                {{ job?.message }}
                            </td>
                            <td class="text-xs opacity-70">
                                {{ job?.created_at }}
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div class="flex justify-between items-center mt-4">
                    <button class="btn btn-sm"
                        @click="jobsPaginated.prev"
                        :disabled="jobsPaginated.page.value === 1">
                        Prev
                    </button>

                    <span class="text-sm">
                        {{ jobsPaginated.page.value }} / {{ jobsPaginated.lastPage.value }}
                    </span>

                    <button class="btn btn-sm"
                        @click="jobsPaginated.next"
                        :disabled="jobsPaginated.page.value >= jobsPaginated.lastPage.value">
                        Next
                    </button>
                </div>
                </div>
            </div>
        </div>
        <div v-if="selectedJob" class="card bg-base-100 shadow mt-6">
            <div class="card-body">
                <h2 class="card-title">Job Detail</h2>

                <p><b>ID:</b> {{ selectedJob.uuid }}</p>
                <p><b>Status:</b> {{ selectedJob.status }}</p>
                <p><b>Queue:</b> {{ selectedJob.function_name }}</p>
                <p><b>Message:</b> {{ selectedJob.message }}</p>
                <p><b>Video ID:</b> {{ parseArgs(selectedJob.args).video_id }}</p>
                <p v-if="selectedJob.function_name === 'music:download'"><b>Quality:</b> {{ parseArgs(selectedJob.args).quality }}kbps</p>
                <p v-if="selectedJob.function_name === 'video:download'"><b>Quality:</b> {{ parseArgs(selectedJob.args).quality }}p</p>

                <div class="mt-3">
                <button class="btn btn-sm btn-warning mr-2">Retry</button>
                <button class="btn btn-sm btn-error">Cancel</button>
                </div>

                <details class="mt-4">
                    <summary class="cursor-pointer">Logs</summary>
                    <div class="mockup-code w-full">
                        <pre data-prefix="$"><code> [{{ selectedJob.created_at }}] job created</code></pre>
                        <pre data-prefix=">" class="text-warning"><code>status → processing</code></pre>
                        <pre data-prefix=">" class="text-info"><code>assigned → worker-{{ selectedJob.worker }}</code></pre>
                        <pre data-prefix=">" class="text-info"><code>function → {{ selectedJob.function_name }}</code></pre>
                        <pre data-prefix=">" class="text-info"><code>download → {{ JSON.parse(selectedJob.data).mb.trim().length == 0 ? "0.0MiB" : JSON.parse(selectedJob.data).mb.trim() }}</code></pre>
                        <pre data-prefix=">" class="text-info"><code>percent → {{ JSON.parse(selectedJob.data).percent }}%</code></pre>
                        <pre v-if="selectedJob.status === 'done'" data-prefix=">" class="text-success"><code>status → done</code></pre>
                        <pre v-if="selectedJob.status === 'failed' || selectedJob.status.includes('failed')" data-prefix=">" class="text-success"><code>status → {{ selectedJob.status }}</code></pre>
                        <pre data-prefix=">" class="text-success"><code>message → {{ selectedJob.message }}</code></pre>
                    </div>
                </details>
            </div>
        </div>
    </Navigation>
</template>