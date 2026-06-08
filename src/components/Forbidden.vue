<script setup lang="ts">
import { useRouter } from "vue-router"

const router = useRouter()

const goHome = () => router.push("/")
const goBack = () => router.back()
</script>

<template>
    <div class="relative min-h-[75vh] flex items-center justify-center overflow-hidden px-6">

        <!-- Background -->
        <div class="absolute inset-0 -z-10 bg-gradient-to-b from-base-100 via-base-200 to-base-100"></div>

        <!-- Blobs -->
        <div class="absolute -top-20 left-1/4 w-72 h-72 bg-warning/10 blur-3xl rounded-full"></div>
        <div class="absolute bottom-0 right-1/4 w-72 h-72 bg-primary/10 blur-3xl rounded-full"></div>

        <!-- Content -->
        <div class="text-center max-w-2xl">

            <!-- Big number -->
            <h1 class="text-[140px] leading-none font-black tracking-tight text-base-content/10 select-none">
                403
            </h1>

            <!-- Title -->
            <h2 class="text-3xl md:text-4xl font-bold -mt-10 mb-3">
                Access Forbidden
            </h2>

            <!-- Description -->
            <p class="text-base-content/60 text-lg mb-8">
                You don’t have permission to access this page or resource.
            </p>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row gap-3 justify-center">

                <button class="btn btn-primary btn-wide" @click="goHome">
                <i class="ph ph-house mr-2"></i>
                Go Home
                </button>

                <button class="btn btn-ghost" @click="goBack">
                <i class="ph ph-arrow-left mr-2"></i>
                Go Back
                </button>

            </div>

            <!-- Hint -->
            <p class="text-xs text-base-content/40 mt-6">
                If you believe this is a mistake, contact your administrator.
            </p>

        </div>
    </div>
</template>