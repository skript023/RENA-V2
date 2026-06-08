import { getCurrentInstance } from 'vue'

export function useNotification() {
    const vm = getCurrentInstance()
    if (!vm) throw new Error('useNotification must be called inside setup')

    const notificationComponent = vm.root?.refs.notification as any

    if (!notificationComponent) {
        console.warn('Notification component not found, please add <Notification ref="notification" /> in App.vue')
    }

    const notify = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        notificationComponent?.addNotification(message, type)
    }

    return { notify }
}