<template>
    <Navigation title="System Status">
		<!-- Page Header -->
		<!-- <div class="mb-6">
			<h1 class="text-2xl font-bold">System Status</h1>
			<p class="text-gray-500">Monitor system health and performance</p>
		</div> -->
	
		<!-- Alert Box -->
		<div class="alert bg-yellow-100 text-yellow-800 mb-6 border border-yellow-300 shadow-sm">
			<i class="ph ph-warning text-xl"></i>
			<div>
			<h3 class="font-semibold">Some Systems Degraded</h3>
			<p class="text-sm">Some services are experiencing issues</p>
			</div>
		</div>

		<!-- Resource Usage Cards -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

			<!-- LOADING -->
			<template v-if="server.loading.value">
				<div v-for="i in 4" :key="'sk-server-' + i"
					class="rounded-xl p-4 bg-base-100 border shadow-sm">
					
					<div class="skeleton h-3 w-20 mb-3"></div>
					<div class="flex items-center gap-2 mb-3">
						<div class="skeleton h-4 w-4 rounded"></div>
						<div class="skeleton h-3 w-24"></div>
					</div>
					<div class="skeleton h-6 w-16 mb-3"></div>
					<div class="skeleton h-2 w-full"></div>
				</div>
			</template>

			<!-- DATA -->
			<template v-else>
				<div
					v-for="item in server.data.value"
					:key="item.name"
					class="rounded-xl p-4 bg-base-100 border shadow-sm relative"
				>
					<div
						class="absolute top-2 right-2 text-xs px-2 py-0.5 rounded"
						:class="{
							'text-green-600 bg-green-100': item.status === 'Operational',
							'text-yellow-600 bg-yellow-100': item.status === 'Degraded',
							'text-red-600 bg-red-100': item.status === 'Critical'
						}"
					>
						{{ item.status }}
					</div>

					<div class="flex items-center gap-2 mb-2">
						<i :class="item.icon + ' text-lg text-gray-500'"></i>
						<span class="font-medium text-sm">{{ item.name }}</span>
					</div>

					<div class="text-2xl font-bold mb-1">
						{{ item.value.toFixed(1) }}%
					</div>

					<progress class="progress w-full"
						:class="{
							'progress-success': (item.status === 'Normal' || item.status === 'Operational'),
							'progress-warning': item.status === 'Degraded',
							'progress-error': (item.status === 'Critical' || item.status === 'Down')
						}"
						:value="item.value"
						max="100"
					></progress>
				</div>
			</template>

		</div>

      	<!-- Service Table -->
      	<div class="card bg-base-100 shadow-sm border mb-6">
			<div class="card-body">
				<h2 class="card-title text-base mb-4">Services</h2>
					<div class="divide-y">
						<!-- LOADING -->
						<template v-if="services.loading.value">
							<div v-for="i in 4" :key="'sk-service-' + i"
								class="py-4 flex justify-between items-center">

								<div class="flex items-start gap-4">
									<div class="skeleton h-5 w-5 rounded"></div>
									<div>
										<div class="skeleton h-3 w-32 mb-2"></div>
										<div class="skeleton h-2 w-48"></div>
									</div>
								</div>

								<div class="flex gap-6 items-end">
									<div class="flex flex-col items-end">
										<div class="skeleton h-3 w-16 mb-1"></div>
										<div class="skeleton h-2 w-20"></div>
									</div>

									<div class="flex flex-col items-end">
										<div class="skeleton h-3 w-16 mb-1"></div>
										<div class="skeleton h-2 w-20"></div>
									</div>

									<div class="skeleton h-5 w-16 rounded-full"></div>
								</div>

							</div>
						</template>

						<!-- DATA -->
						<template v-else>
							<div v-for="service in services.data.value?.services" :key="service.name" class="py-4 flex justify-between items-center">
								<div class="flex items-start gap-4">
									<i :class="service.icon + ' text-xl text-gray-600'"></i>
									<div>
										<h3 class="font-semibold text-sm">{{ service.name }}</h3>
										<p class="text-xs text-gray-500">{{ service.description }}</p>
									</div>
									</div>
									<div class="text-right">
										<div class="flex items-start gap-6 justify-end">
											<!-- Kolom 1: Uptime -->
											<div class="flex flex-col items-end">
											<p class="text-xs text-gray-500 font-medium">{{ service.uptime }} uptime</p>
											<p class="text-[10px] text-gray-400">Last 30 days</p>
											</div>

											<!-- Kolom 2: Response time -->
											<div class="flex flex-col items-end">
											<p class="text-xs text-gray-500 font-medium">Response time</p>
											<p class="text-[10px] text-gray-400">{{ service.response }}</p>
											</div>

											<!-- Kolom 3: Status -->
											<span
											class="badge text-xs px-3 py-0.5"
											:class="{
												'badge-success': (service.status === 'Operational' || service.status === 'Normal'),
												'badge-warning': service.status === 'Degraded',
												'badge-error': (service.status === 'Down' || service.status === 'Critical')
											}"
											>
											{{ service.status }}
											</span>
										</div>
									</div>
								</div>
						</template>
					</div>
				</div>
			</div>
    
			<!-- Recent Incidents -->
			<div class="card bg-base-100 shadow mb-6">
				<div class="card-body">
					<div class="flex justify-between items-center mb-4">
						<h2 class="card-title">Recent Incidents</h2>
						<a href="#" class="text-sm text-blue-600 hover:underline">View All Incidents</a>
					</div>

					<div v-for="incident in incidents" :key="incident.id" class="border-b last:border-b-0 py-4">
						<!-- Judul Incident -->
						<div class="flex flex-wrap items-center gap-2 mb-1">
						<h3 class="font-medium">{{ incident.title }}</h3>
						<span
							class="badge text-xs"
							:class="{
							'badge-error': incident.priority === 'URGENT',
							'badge-warning': incident.priority === 'MEDIUM',
							'badge-info': incident.priority === 'LOW'
							}"
						>
							{{ incident.priority }}
						</span>
						</div>

						<!-- Deskripsi -->
						<p class="text-sm text-gray-500 mb-2">{{ incident.description }}</p>

						<!-- Status & Waktu -->
						<div class="flex items-center gap-3 mb-2 text-xs text-gray-400">
						<i class="ph ph-calendar"></i>
						{{ incident.date }}
						<span
							class="badge badge-sm"
							:class="{
							'badge-success': incident.status === 'Resolved',
							'badge-info': incident.status === 'Monitoring',
							'badge-warning': incident.status === 'Investigating'
							}"
						>
							{{ incident.status }}
						</span>
						</div>

						<!-- Timeline -->
						<ul class="border-l border-gray-300 ml-4 space-y-1">
						<li v-for="log in incident.logs" :key="log.time" class="pl-4 relative">
							<span class="absolute w-2 h-2 bg-blue-500 rounded-full -left-1 top-2"></span>
							<p class="text-xs text-gray-400">{{ log.time }}</p>
							<p class="text-sm">{{ log.message }}</p>
						</li>
						</ul>
					</div>
				</div>
			</div>

			<!-- 90-Day Uptime History -->
			<div class="card bg-base-100 shadow">
				<div class="card-body">
				<h2 class="card-title mb-4">90-Day Uptime History</h2>
				<div class="space-y-3">
					<div v-for="service in uptimeHistory" :key="service.name" class="flex items-center gap-4">
					<!-- Nama Service -->
					<div class="w-40 text-sm font-medium">{{ service.name }}</div>
					<!-- Grid Uptime -->
					<div class="grid grid-cols-30 gap-1 flex-1">
						<div
						v-for="(day, index) in service.days"
						:key="index"
						class="w-3 h-3 rounded"
						:class="{
							'bg-green-500': day === 'Operational',
							'bg-yellow-400': day === 'Degraded',
							'bg-red-500': day === 'Outage'
						}"
						></div>
					</div>
					<!-- Persentase -->
					<div class="w-12 text-sm text-right">{{ service.uptime }}</div>
					</div>
				</div>

				<!-- Legend -->
				<div class="flex items-center gap-4 text-xs mt-4">
					<div class="flex items-center gap-1"><span class="w-3 h-3 bg-green-500 rounded"></span> Operational</div>
					<div class="flex items-center gap-1"><span class="w-3 h-3 bg-yellow-400 rounded"></span> Degraded</div>
					<div class="flex items-center gap-1"><span class="w-3 h-3 bg-red-500 rounded"></span> Outage</div>
				</div>
			</div>
		</div>
    </Navigation>
</template>
  
<script setup lang="ts">
import Navigation from "@/components/Navigation.vue"
import { onMounted } from "vue"
import system from "./service"
import { useData } from "@/composables/useData";
import type { ServiceResponse, SystemResponse } from "./dto/system.dto";

const server = useData<SystemResponse[]>(system.getStatus)
const services = useData<ServiceResponse>(system.getServiceStatus)

onMounted(() => {
	Promise.all([
        server.fetch(),
        services.fetch()
    ]);
})

const incidents = [
	{
		id: 1,
		title: 'File Storage Performance Degradation',
		priority: 'MEDIUM',
		description: 'Users may experience slower file upload and download speeds.',
		date: '1/15/2024, 9:30 PM',
		status: 'Monitoring',
		logs: [
			{ time: '1/15/2024, 10:45 PM', message: 'We have identified the cause and are implementing a fix.' },
			{ time: '1/15/2024, 9:30 PM', message: 'We are investigating reports of slow file storage performance.' }
		]
	},
	{
		id: 2,
		title: 'Scheduled Maintenance - Database Optimization',
		priority: 'LOW',
		description: 'Routine database maintenance completed successfully.',
		date: '1/14/2024, 9:00 AM',
		status: 'Resolved',
		logs: [
			{ time: '1/14/2024, 11:30 AM', message: 'Maintenance completed successfully. All services are operational.' },
			{ time: '1/14/2024, 9:00 AM', message: 'Starting scheduled database maintenance window.' }
		]
	}
]

const uptimeHistory = [
	{
		name: 'Web Application',
		uptime: '99.9%',
		days: Array.from({ length: 90 }, (_, i) => (i % 20 === 0 ? 'Degraded' : 'Operational'))
	},
	{
		name: 'API Gateway',
		uptime: '99.8%',
		days: Array.from({ length: 90 }, (_, i) => (i % 30 === 0 ? 'Outage' : 'Operational'))
	},
	{
		name: 'Database',
		uptime: '99.8%',
		days: Array.from({ length: 90 }, (_, i) => (i % 15 === 0 ? 'Degraded' : 'Operational'))
	}
]
</script>