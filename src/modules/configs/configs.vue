<script setup lang="ts">
import { useNotification } from '@/composables/useNotification'
import Navigation from '@/components/Navigation.vue'
import { ref, onMounted } from 'vue'
import configs from './service'
import type { MusicCommand, SaveJsonCommand, VideoCommand } from './dto/configs.dto'

const { notify } = useNotification()

const categories = ref<("music" | "video" | "dump_json")[]>([
    "music",
    "video",
    "dump_json"
])

const selectedCategory = ref<"music" | "video" | "dump_json">("music")

const configText = ref("")
const loading = ref(false)

const loadConfig = async () => {
    loading.value = true

    try 
    {
        let res

        switch (selectedCategory.value)
        {
            case "music":
                res = await configs.get_config<MusicCommand>("download", "music")
                break

            case "video":
                res = await configs.get_config<VideoCommand>("download", "video")
                break

            case "dump_json":
                res = await configs.get_config<SaveJsonCommand>("dump_json")
                break
        }

        configText.value = JSON.stringify(res.data, null, 2)
    }
    catch (e: any)
    {
        notify("Failed to load config", "error")
    }

    loading.value = false
}

const saveConfig = async () => {
    try 
    {
        const parsed = JSON.parse(configText.value)

        if (selectedCategory.value === "dump_json")
        {
            await configs.update_config({
                name: "dump_json",
                type: "",
                payload: parsed
            })

            notify("Save JSON config updated!", "success")
            return
        }

        const payload: any = {
            name: "download",
            type: selectedCategory.value,
            payload: {}
        }

        if (selectedCategory.value === "music")
        {
            payload.payload = parsed.music ?? parsed
        }
        else if (selectedCategory.value === "video")
        {
            payload.payload = parsed.video ?? parsed
        }

        await configs.update_config(payload)

        notify("Config saved successfully!", "success")
    }
    catch (e)
    {
        notify("Invalid JSON or save failed", "error")
    }
}

onMounted(loadConfig)
</script>

<template>
    <Navigation title="Job Config">
        <div class="card bg-base-100 shadow">
            <div class="card-body">

                <!-- SELECTOR -->
                <div class="flex gap-4 mb-4">
                    <select v-model="selectedCategory" class="select select-bordered">
                        <option v-for="c in categories" :key="c">
                            {{ c }}
                        </option>
                    </select>

                    <button class="btn btn-primary" @click="loadConfig">
                        Load
                    </button>
                </div>

                <!-- LOADING -->
                <div v-if="loading" class="text-sm opacity-70 mb-2">
                    Loading...
                </div>

                <!-- EDITOR -->
                <textarea
                    v-model="configText"
                    class="textarea textarea-bordered w-full h-96 font-mono text-sm"
                />

                <!-- ACTION -->
                <div class="mt-4 flex gap-2">
                    <button class="btn btn-success" @click="saveConfig">
                        Save
                    </button>
                </div>

            </div>
        </div>
    </Navigation>
</template>