<template>
    <dialog class="modal" :class="{ 'modal-open': isOpen }">
        <div class="modal-box max-w-4xl p-0 overflow-hidden bg-base-100 border border-base-300 shadow-2xl rounded-2xl">
            <!-- Modal Header -->
            <div class="flex items-center justify-between px-5 py-3.5 border-b border-base-200 bg-base-200/50">
                <div class="flex items-center gap-2.5">
                    <div 
                        class="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm"
                        :class="type === 'wfh' ? 'bg-success/15 text-success' : 'bg-info/15 text-info'"
                    >
                        <i :class="type === 'wfh' ? 'ph ph-house' : 'ph ph-buildings'"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="font-bold text-sm text-base-content">{{ title }}</h3>
                            <span 
                                class="badge badge-xs font-semibold uppercase"
                                :class="type === 'wfh' ? 'badge-success' : 'badge-info'"
                            >
                                {{ type }}
                            </span>
                        </div>
                        <p class="text-[11px] text-base-content/60">
                            Cek lokasi dan verifikasi keakuratan koordinat latitude & longitude
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <a 
                        v-if="currentLat && currentLon"
                        :href="`https://www.google.com/maps?q=${currentLat},${currentLon}`" 
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn btn-xs btn-ghost text-primary flex items-center gap-1"
                        title="Buka lokasi di Google Maps tab baru"
                    >
                        <i class="ph ph-arrow-square-out"></i>
                        Google Maps
                    </a>
                    <button 
                        type="button" 
                        class="btn btn-sm btn-circle btn-ghost text-base-content/70 hover:text-base-content" 
                        @click="closeModal"
                    >
                        ✕
                    </button>
                </div>
            </div>

            <!-- Toolbar / Coordinates & Style Switcher -->
            <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-base-200/30 border-b border-base-200 text-xs">
                <!-- Coordinates Badge Display -->
                <div class="flex items-center gap-2">
                    <span class="text-base-content/60 font-semibold">Koordinat Terpilih:</span>
                    <div class="flex items-center gap-1.5 bg-base-100 px-2.5 py-1 rounded-lg border border-base-300 font-mono text-[11px]">
                        <span class="text-primary font-bold">LAT:</span>
                        <span>{{ currentLat }}</span>
                        <span class="text-base-content/30">|</span>
                        <span class="text-primary font-bold">LON:</span>
                        <span>{{ currentLon }}</span>
                    </div>
                    <button 
                        type="button" 
                        class="btn btn-xs btn-ghost btn-square"
                        @click="copyCoords"
                        title="Salin Koordinat"
                    >
                        <i :class="copied ? 'ph ph-check text-success' : 'ph ph-copy'"></i>
                    </button>
                </div>

                <!-- Layer Style Buttons & GPS Reset -->
                <div class="flex items-center gap-2">
                    <button 
                        type="button"
                        class="btn btn-xs btn-outline gap-1"
                        :class="type === 'wfh' ? 'btn-success' : 'btn-info'"
                        :disabled="fetchingGps"
                        @click="getLiveGps"
                        title="Perbarui koordinat dengan GPS browser saat ini"
                    >
                        <span v-if="fetchingGps" class="loading loading-spinner loading-xs"></span>
                        <i v-else class="ph ph-crosshair"></i>
                        <span>GPS Sekarang</span>
                    </button>

                    <!-- Map Layer Selectors -->
                    <div class="join bg-base-100 border border-base-300 rounded-lg p-0.5 shadow-xs">
                        <button 
                            type="button"
                            class="btn btn-xs join-item transition-all"
                            :class="activeLayer === 'osm' ? 'btn-primary' : 'btn-ghost text-base-content/70'"
                            @click="switchLayer('osm')"
                        >
                            OSM
                        </button>
                        <button 
                            type="button"
                            class="btn btn-xs join-item transition-all"
                            :class="activeLayer === 'dark' ? 'btn-primary' : 'btn-ghost text-base-content/70'"
                            @click="switchLayer('dark')"
                        >
                            Dark Cyber
                        </button>
                        <button 
                            type="button"
                            class="btn btn-xs join-item transition-all"
                            :class="activeLayer === 'satellite' ? 'btn-primary' : 'btn-ghost text-base-content/70'"
                            @click="switchLayer('satellite')"
                        >
                            Satellite
                        </button>
                    </div>
                </div>
            </div>

            <!-- Map Container -->
            <div class="relative w-full h-[450px] bg-base-300">
                <div id="attendance-map-container" class="w-full h-full"></div>

                <!-- Map Overlay Instruction Pill -->
                <div class="absolute bottom-3 left-3 z-[1000] bg-base-100/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-base-300/80 shadow-md text-[11px] flex items-center gap-2 pointer-events-none">
                    <i class="ph ph-hand-tap text-primary text-sm"></i>
                    <span>Klik pada peta atau geser pin merah untuk mengubah titik koordinat</span>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex items-center justify-between px-5 py-3 border-t border-base-200 bg-base-200/50">
                <div class="text-[11px] text-base-content/60">
                    <span v-if="isModified" class="text-warning flex items-center gap-1 font-semibold">
                        <i class="ph ph-warning-circle"></i>
                        Titik koordinat telah diubah. Klik 'Terapkan Koordinat' untuk memperbarui form.
                    </span>
                    <span v-else class="text-base-content/50">
                        Posisi koordinat sesuai dengan pengaturan saat ini.
                    </span>
                </div>

                <div class="flex items-center gap-2">
                    <button 
                        type="button" 
                        class="btn btn-sm btn-ghost text-xs" 
                        @click="closeModal"
                    >
                        Tutup
                    </button>
                    <button 
                        type="button" 
                        class="btn btn-sm btn-primary text-xs px-5 flex items-center gap-1.5"
                        :disabled="!isValidCoord"
                        @click="applyCoords"
                    >
                        <i class="ph ph-check"></i>
                        Terapkan Koordinat Ini
                    </button>
                </div>
            </div>
        </div>
        <form method="dialog" class="modal-backdrop">
            <button @click="closeModal">close</button>
        </form>
    </dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useNotification } from '@/composables/useNotification'

const props = defineProps<{
    isOpen: boolean
    title: string
    type: 'wfh' | 'wfo'
    latitude: string
    longitude: string
}>()

const emit = defineEmits<{
    (e: 'update:isOpen', value: boolean): void
    (e: 'apply', payload: { latitude: string, longitude: string }): void
}>()

const { notify } = useNotification()

const currentLat = ref(props.latitude || '-6.2297907')
const currentLon = ref(props.longitude || '106.8184312')
const copied = ref(false)
const fetchingGps = ref(false)
const activeLayer = ref<'osm' | 'dark' | 'satellite'>('osm')

let mapInstance: L.Map | null = null
let markerInstance: L.Marker | null = null
let currentTileLayer: L.TileLayer | null = null

const TILE_STYLES = {
    osm: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        } as L.TileLayerOptions
    },
    dark: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
            maxZoom: 19,
            className: 'map-tiles-dark',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        } as L.TileLayerOptions
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        options: {
            maxZoom: 18,
            attribution: '&copy; Esri &mdash; Earthstar Geographics'
        } as L.TileLayerOptions
    }
}

const isValidCoord = computed(() => {
    const lat = parseFloat(currentLat.value)
    const lon = parseFloat(currentLon.value)
    return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
})

const isModified = computed(() => {
    return currentLat.value !== props.latitude || currentLon.value !== props.longitude
})

const createPinIcon = (type: 'wfh' | 'wfo') => {
    const isWfh = type === 'wfh'
    const colorClass = isWfh ? 'marker-success' : 'marker-info'
    const iconClass = isWfh ? 'ph-house' : 'ph-buildings'

    return L.divIcon({
        className: 'leaflet-custom-marker-wrapper',
        html: `
            <div class="custom-attendance-pin ${colorClass}">
                <div class="pin-pulse"></div>
                <div class="pin-avatar">
                    <i class="ph ${iconClass}"></i>
                </div>
                <div class="pin-point"></div>
            </div>
        `,
        iconSize: [36, 46],
        iconAnchor: [18, 46],
        popupAnchor: [0, -44]
    })
}

const initOrUpdateMap = () => {
    const container = document.getElementById('attendance-map-container')
    if (!container) return

    const lat = parseFloat(currentLat.value) || -6.2297907
    const lon = parseFloat(currentLon.value) || 106.8184312

    if (!mapInstance) {
        mapInstance = L.map('attendance-map-container', {
            center: [lat, lon],
            zoom: 16,
            zoomControl: false,
            attributionControl: true
        })

        L.control.zoom({ position: 'topright' }).addTo(mapInstance)

        // Click on map to reposition marker
        mapInstance.on('click', (e: L.LeafletMouseEvent) => {
            updateMarkerPosition(e.latlng.lat, e.latlng.lng)
        })
    }

    // Apply tile layer
    switchLayer(activeLayer.value)

    // Setup or update marker
    const pinIcon = createPinIcon(props.type)

    if (!markerInstance) {
        markerInstance = L.marker([lat, lon], {
            icon: pinIcon,
            draggable: true
        }).addTo(mapInstance)

        markerInstance.on('dragend', () => {
            if (!markerInstance) return
            const pos = markerInstance.getLatLng()
            updateMarkerPosition(pos.lat, pos.lng)
        })
    } else {
        markerInstance.setIcon(pinIcon)
        markerInstance.setLatLng([lat, lon])
    }

    markerInstance.bindPopup(`
        <div class="text-xs p-1">
            <strong class="block text-primary">${props.title}</strong>
            <span class="text-gray-400 font-mono text-[10px]">${lat.toFixed(7)}, ${lon.toFixed(7)}</span>
        </div>
    `)

    mapInstance.setView([lat, lon], 16)

    setTimeout(() => {
        if (mapInstance) {
            mapInstance.invalidateSize()
        }
    }, 250)
}

const updateMarkerPosition = (lat: number, lon: number) => {
    currentLat.value = lat.toFixed(7)
    currentLon.value = lon.toFixed(7)

    if (markerInstance) {
        markerInstance.setLatLng([lat, lon])
        markerInstance.setPopupContent(`
            <div class="text-xs p-1">
                <strong class="block text-primary">${props.title}</strong>
                <span class="text-gray-400 font-mono text-[10px]">${currentLat.value}, ${currentLon.value}</span>
            </div>
        `)
    }
}

const switchLayer = (styleKey: 'osm' | 'dark' | 'satellite') => {
    activeLayer.value = styleKey
    if (!mapInstance) return

    if (currentTileLayer) {
        mapInstance.removeLayer(currentTileLayer)
    }

    const cfg = TILE_STYLES[styleKey]
    currentTileLayer = L.tileLayer(cfg.url, cfg.options).addTo(mapInstance)
}

const getLiveGps = () => {
    if (!navigator.geolocation) {
        notify('Browser tidak mendukung Geolocation GPS', 'warning')
        return
    }

    fetchingGps.value = true
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude
            const lon = pos.coords.longitude
            updateMarkerPosition(lat, lon)
            if (mapInstance) {
                mapInstance.flyTo([lat, lon], 17, { duration: 1.2 })
            }
            notify('Koordinat GPS berhasil diperbarui ke lokasi Anda saat ini!', 'success')
            fetchingGps.value = false
        },
        (err) => {
            notify(`Gagal mengambil GPS: ${err.message}`, 'error')
            fetchingGps.value = false
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
}

const copyCoords = async () => {
    try {
        await navigator.clipboard.writeText(`${currentLat.value}, ${currentLon.value}`)
        copied.value = true
        notify('Koordinat berhasil disalin ke clipboard!', 'info')
        setTimeout(() => { copied.value = false }, 2000)
    } catch {
        // ignore
    }
}

const closeModal = () => {
    emit('update:isOpen', false)
}

const applyCoords = () => {
    emit('apply', {
        latitude: currentLat.value,
        longitude: currentLon.value
    })
    notify(`Koordinat ${props.title} berhasil diterapkan!`, 'success')
    closeModal()
}

watch(() => props.isOpen, (open) => {
    if (open) {
        currentLat.value = props.latitude || '-6.2297907'
        currentLon.value = props.longitude || '106.8184312'
        nextTick(() => {
            initOrUpdateMap()
        })
    }
})

onUnmounted(() => {
    if (mapInstance) {
        mapInstance.remove()
        mapInstance = null
    }
})
</script>

<style>
/* OpenStreetMap Dark / Cyber Filter (Consistent with Ellohim-Admin) */
.map-tiles-dark img.leaflet-tile,
.map-tiles-dark .leaflet-tile {
    filter: brightness(0.65) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
}

/* Custom Marker Pin Styles */
.leaflet-custom-marker-wrapper {
    background: transparent;
    border: none;
}

.custom-attendance-pin {
    position: relative;
    width: 36px;
    height: 46px;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: grab;
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.45));
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.custom-attendance-pin:active {
    cursor: grabbing;
}

.custom-attendance-pin:hover {
    transform: scale(1.15) translateY(-4px);
    z-index: 9999 !important;
}

.custom-attendance-pin .pin-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #0f172a;
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    position: relative;
    border-width: 2.5px;
    border-style: solid;
}

.custom-attendance-pin .pin-point {
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    margin-top: -1px;
    z-index: 2;
}

/* Marker color variants */
.marker-success .pin-avatar {
    border-color: #10b981;
    color: #10b981;
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.6);
}
.marker-success .pin-point {
    border-top: 8px solid #10b981;
}
.marker-success .pin-pulse {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.4);
    animation: marker-pulse-anim 2s infinite;
    z-index: 1;
}

.marker-info .pin-avatar {
    border-color: #0ea5e9;
    color: #0ea5e9;
    box-shadow: 0 0 15px rgba(14, 165, 233, 0.6);
}
.marker-info .pin-point {
    border-top: 8px solid #0ea5e9;
}
.marker-info .pin-pulse {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(14, 165, 233, 0.4);
    animation: marker-pulse-anim 2s infinite;
    z-index: 1;
}

@keyframes marker-pulse-anim {
    0% {
        transform: scale(0.9);
        opacity: 0.8;
    }
    70% {
        transform: scale(2.2);
        opacity: 0;
    }
    100% {
        transform: scale(2.4);
        opacity: 0;
    }
}
</style>
