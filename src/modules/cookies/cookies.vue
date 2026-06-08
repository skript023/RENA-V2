<script setup lang="ts">
import Navigation from "@/components/Navigation.vue"
import { ref, onMounted } from "vue"
import { useNotification } from "@/composables/useNotification"
import cookies from "./service"
import type { CookieFile } from "./cookies.dto"
import { useConfirm } from "@/composables/useConfirm"

const { confirm } = useConfirm()
const { notify } = useNotification()

const files = ref<CookieFile[]>([])
const selectedFile = ref<string | null>(null)
const content = ref("")

const showCreateModal = ref(false)

const newFilename = ref("")
const newContent = ref("")

const loadFiles = async () => {
    try {
        const res = await cookies.list()
        files.value = res.data
    } catch {
        notify("Failed to load files", "error")
    }
}

const selectFile = (file: CookieFile) => {
    selectedFile.value = file.filename
    content.value = file.content || ""
}

const saveFile = async () => {
    if (!selectedFile.value) return

    try {
        await cookies.update({
            filename: selectedFile.value,
            content: content.value
        })

        notify("File updated!", "success")
        loadFiles()
    } catch {
        notify("Failed to update file", "error")
    }
}

const createFile = async () => {
    if (!newFilename.value) {
        notify("Filename required", "warning")
        return
    }

    try {
        await cookies.create({
            filename: newFilename.value,
            content: newContent.value
        })

        notify("File created!", "success")

        selectedFile.value = newFilename.value
        content.value = newContent.value

        newFilename.value = ""
        newContent.value = ""

        showCreateModal.value = false

        loadFiles()
    } catch (e: any) {
        if (e?.response?.status === 409) {
            notify("File already exists", "error")
        } else {
            notify("Failed to create file", "error")
        }
    }
}

const deleteFile = async (filename: string) => {
    const ok = await confirm({
        title: "Delete File",
        message: `Delete ${filename}? This action cannot be undone.`,
        confirmText: "Delete",
        cancelText: "Cancel"
    })

    if (!ok) return

    try {
        await cookies.delete(filename)

        notify("File deleted!", "success")

        if (selectedFile.value === filename) {
            selectedFile.value = null
            content.value = ""
        }

        loadFiles()
    } catch {
        notify("Failed to delete file", "error")
    }
}

onMounted(loadFiles)
</script>

<template>
    <Navigation title="Cookie Manager">
        <div class="grid grid-cols-3 gap-4">

            <!-- LEFT -->
            <div class="card bg-base-100 shadow col-span-1">
                <div class="card-body">

                    <div class="flex items-center justify-between mb-3">
                        <div class="font-bold">Files</div>

                        <button
                            class="btn btn-sm btn-primary"
                            @click="showCreateModal = true"
                        >
                            +
                        </button>
                    </div>

                    <ul class="bg-base-100 rounded-box p-2 space-y-1">
                        <li
                            v-for="f in files"
                            :key="f.filename"
                            class="flex items-center justify-between px-2 py-1 rounded hover:bg-base-200"
                        >
                            <div
                                class="flex-1 cursor-pointer"
                                :class="{ 'font-bold': selectedFile === f.filename }"
                                @click="selectFile(f)"
                            >
                                {{ f.filename }}
                            </div>

                            <button
                                class="btn btn-xs btn-error"
                                @click.stop="deleteFile(f.filename)"
                            >
                                delete
                            </button>
                        </li>
                    </ul>

                </div>
            </div>

            <!-- RIGHT -->
            <div class="card bg-base-100 shadow col-span-2">
                <div class="card-body">

                    <div class="font-bold mb-2">
                        {{ selectedFile || "No file selected" }}
                    </div>

                    <textarea
                        v-model="content"
                        class="textarea textarea-bordered w-full h-96 font-mono text-sm"
                        :disabled="!selectedFile"
                    />

                    <div class="mt-4">
                        <button
                            class="btn btn-success"
                            :disabled="!selectedFile"
                            @click="saveFile"
                        >
                            Save
                        </button>
                    </div>

                </div>
            </div>

        </div>

        <!-- CREATE MODAL -->
        <dialog class="modal" :class="{ 'modal-open': showCreateModal }">
            <div class="modal-box">
                <h3 class="font-bold text-lg mb-4">
                    Create Cookie File
                </h3>

                <div class="space-y-3">

                    <input
                        v-model="newFilename"
                        placeholder="cookie.txt"
                        class="input input-bordered w-full"
                    />

                    <textarea
                        v-model="newContent"
                        placeholder="Paste cookie content..."
                        class="textarea textarea-bordered w-full h-52 font-mono text-sm"
                    />

                </div>

                <div class="modal-action">
                    <button
                        class="btn"
                        @click="showCreateModal = false"
                    >
                        Cancel
                    </button>

                    <button
                        class="btn btn-primary"
                        @click="createFile"
                    >
                        Create
                    </button>
                </div>
            </div>
        </dialog>

    </Navigation>
</template>