<script setup lang="ts">
import { reactive } from 'vue'

interface NotificationItem {
    id: number
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
}

const notifications = reactive<NotificationItem[]>([])

const addNotification = (
    message: string,
    type: NotificationItem['type'] = 'info',
    duration = 3000
) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    notifications.push({ id, message, type })

    setTimeout(() => {
        const index = notifications.findIndex(n => n.id === id)
        if (index !== -1) notifications.splice(index, 1)
    }, duration)
}

// helper untuk pilih icon class
const getIconClass = (type: NotificationItem['type']) => {
    switch(type) {
        case 'success': return 'ph ph-check-circle'
        case 'error': return 'ph ph-x-circle'
        case 'info': return 'ph ph-info'
        case 'warning': return 'ph ph-warning-circle'
    }
}

defineExpose({ addNotification })
</script>

<template>
    <div class="toast toast-end flex flex-col gap-2 z-50">
        <div v-for="n in notifications" :key="n.id">
            <div
                class="alert flex items-center gap-2"
                :class="{
                    'alert-success': n.type === 'success',
                    'alert-error': n.type === 'error',
                    'alert-info': n.type === 'info',
                    'alert-warning': n.type === 'warning'
                }"
            >
                <i :class="getIconClass(n.type)"></i>
                <span>{{ n.message }}</span>
            </div>
        </div>
    </div>
</template>