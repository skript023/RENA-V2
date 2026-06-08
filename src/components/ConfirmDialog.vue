<script setup lang="ts">
import { useConfirm } from "@/composables/useConfirm"

const { isOpen, options, accept, reject } = useConfirm()
</script>

<template>
    <div v-if="isOpen" class="modal modal-open">
        <div class="modal-box">
            <h3 class="font-bold text-lg">
                {{ options?.title }}
            </h3>

            <p class="py-4">
                {{ options?.message }}
            </p>

            <div class="modal-action">
                <button class="btn" @click="reject">
                    {{ options?.cancelText }}
                </button>

                <button class="btn btn-error" @click="accept">
                    {{ options?.confirmText }}
                </button>
            </div>
        </div>
    </div>
</template>