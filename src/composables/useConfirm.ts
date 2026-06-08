import { ref } from "vue"

type ConfirmOptions = {
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
}

const isOpen = ref(false)
const options = ref<ConfirmOptions | null>(null)
let resolver: ((value: boolean) => void) | null = null

export const useConfirm = () => {
    const confirm = (opts: ConfirmOptions): Promise<boolean> => {
        options.value = {
            title: opts.title ?? "Confirm",
            message: opts.message,
            confirmText: opts.confirmText ?? "Delete",
            cancelText: opts.cancelText ?? "Cancel",
        }

        isOpen.value = true

        return new Promise((resolve) => {
            resolver = resolve
        })
    }

    const accept = () => {
        isOpen.value = false
        resolver?.(true)
        resolver = null
    }

    const reject = () => {
        isOpen.value = false
        resolver?.(false)
        resolver = null
    }

    return {
        isOpen,
        options,
        confirm,
        accept,
        reject,
    }
}