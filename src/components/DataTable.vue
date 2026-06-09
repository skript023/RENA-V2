<template>
    <div class="space-y-4">

        <!-- Toolbar -->
        <div>
        <h2 class="text-2xl font-bold">
            {{ title }}
        </h2>

        <p class="text-sm text-base-content/60">
            Manage and monitor your records
        </p>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">

        <slot name="toolbar">

            <button
                class="btn btn-primary btn-sm"
                @click="$emit('add')"
            >
                <i class="ph ph-plus"></i>
                Add
            </button>

            <button
                class="btn btn-success btn-sm"
                @click="$emit('export')"
            >
                <i class="ph ph-file-xls"></i>
                Export
            </button>

        </slot>

        <button
            class="btn btn-outline btn-sm"
            @click="$emit('refresh')"
        >
            <i class="ph ph-arrows-clockwise"></i>
            Refresh
        </button>

        <div
            v-if="selectedRows.length"
            class="dropdown"
        >
            <button
                class="btn btn-error btn-sm"
            >
                <i class="ph ph-trash"></i>
                Delete Selected
            </button>
        </div>

        <!-- Filters -->
        <div class="dropdown">

            <button
                tabindex="0"
                class="btn btn-outline btn-sm"
            >
                <i class="ph ph-funnel"></i>
                Filters
            </button>

            <div
                tabindex="0"
                class="dropdown-content z-50 card bg-base-100 border border-base-300 shadow-xl w-96"
            >
                <div class="card-body">

                    <h3 class="font-semibold">
                        Filters
                    </h3>

                    <div
                        v-for="column in filterColumns"
                        :key="column.name"
                    >
                        <label class="label">
                            {{ column.label }}
                        </label>

                        <input
                            class="input input-bordered input-sm"
                            :value="localFilters[column.name]"
                            @input="onFilterInput(column.name, $event)"
                        >
                    </div>

                </div>
            </div>

        </div>

        <!-- Column Selector -->
        <div class="dropdown">

        <button
            tabindex="0"
            class="btn btn-outline btn-sm"
        >
            <i class="ph ph-columns"></i>
            Columns
        </button>

        <div
            tabindex="0"
            class="dropdown-content z-50 card bg-base-100 border border-base-300 shadow-xl w-72"
        >
            <div class="card-body">

                <h3 class="font-semibold">
                    Visible Columns
                </h3>

                <label
                    v-for="column in columns"
                    :key="column.name"
                    class="label cursor-pointer justify-start gap-3"
                >
                    <input
                        v-model="visibleColumns"
                        :value="column.name"
                        type="checkbox"
                        class="checkbox checkbox-sm"
                    >

                    <span>
                        {{ column.label }}
                    </span>
                </label>

            </div>
        </div>

    </div>

        <div class="ml-auto">

            <label
                class="input input-bordered flex items-center gap-2 w-80"
            >
                <i class="ph ph-magnifying-glass"></i>

                <input
                    :value="search"
                    type="text"
                    class="grow"
                    placeholder="Search..."
                    @input="onSearch"
                >
            </label>

        </div>

    </div>

    <!-- Stats -->
    <div class="flex flex-wrap gap-2">

        <div class="badge badge-primary gap-1">
            <i class="ph ph-database"></i>
            {{ total }} Records
        </div>

        <div
            v-if="selectedRows.length"
            class="badge badge-success gap-1"
        >
            <i class="ph ph-check-circle"></i>
            {{ selectedRows.length }} Selected
        </div>

        <div
            v-if="loading"
            class="badge badge-warning gap-1"
        >
            <i class="ph ph-spinner-gap animate-spin"></i>
            Loading
        </div>

    </div>

        <!-- Selected -->
        <div
            v-if="selectedRows.length"
            class="alert alert-info"
        >
            {{ selectedRows.length }} selected
        </div>

        <!-- Table -->
        <div class="overflow-x-auto rounded-box border border-base-300 bg-base-100">

            <table class="table table-zebra">

                <thead>

                    <tr>

                        <th v-if="selectable">
                            <input
                                v-model="selectAll"
                                type="checkbox"
                                class="checkbox"
                            >
                        </th>

                        <th
                            v-for="column in displayedColumns"
                            :key="column.name"
                            :class="{
                                'cursor-pointer': column.options?.sort
                            }"
                            @click="toggleSort(column)"
                        >
                            <div class="flex items-center gap-2">

                                {{ column.label }}

                                <span
                                    v-if="sortColumn === column.name"
                                >
                                    {{ sortDirection === 'asc' ? '▲' : '▼' }}
                                </span>

                            </div>
                        </th>

                    </tr>

                </thead>

                <tbody>

                    <tr v-if="loading">
                        <td :colspan="effectiveColumns">

                            <div class="space-y-2 py-4">

                                <div
                                    v-for="i in 8"
                                    :key="i"
                                    class="skeleton h-10 w-full"
                                />

                            </div>

                        </td>
                    </tr>

                    <tr
                        v-else-if="items.length === 0"
                    >
                        <td
                            :colspan="effectiveColumns"
                            class="text-center py-16"
                        >
                            No Data Available
                        </td>
                    </tr>

                    <tr
                        v-for="row in items"
                        :key="getValue(row, rowKey)"
                    >

                        <td v-if="selectable">

                            <input
                                v-model="selectedRows"
                                :value="row"
                                type="checkbox"
                                class="checkbox"
                            >

                        </td>

                        <td
                            v-for="column in displayedColumns"
                            :key="column.name"
                        >

                            <slot
                                :name="`cell-${column.name}`"
                                :row="row"
                                :value="getValue(row, column.name)"
                            >
                                {{ getValue(row, column.name) }}
                            </slot>

                        </td>

                    </tr>

                </tbody>

            </table>

        </div>

        <!-- Footer -->
        <div
    class="flex flex-col md:flex-row justify-between items-center gap-3"
>

    <div class="text-sm text-base-content/60">

        Showing

        <span class="font-semibold">
            {{ items.length }}
        </span>

        of

        <span class="font-semibold">
            {{ total }}
        </span>

        records

    </div>

    <div class="join">

        <button
            class="btn btn-sm join-item"
            :disabled="page === 1"
            @click="$emit('first')"
        >
            <i class="ph ph-caret-double-left"></i>
        </button>

        <button
            class="btn btn-sm join-item"
            :disabled="page === 1"
            @click="$emit('prev')"
        >
            <i class="ph ph-caret-left"></i>
        </button>

        <button
            class="btn btn-sm btn-primary join-item"
        >
            {{ page }}
        </button>

        <button
            class="btn btn-sm join-item"
            :disabled="page >= lastPage"
            @click="$emit('next')"
        >
            <i class="ph ph-caret-right"></i>
        </button>

        <button
            class="btn btn-sm join-item"
            :disabled="page >= lastPage"
            @click="$emit('last')"
        >
            <i class="ph ph-caret-double-right"></i>
        </button>

    </div>

</div>

    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface Props {
    title: string;
    items: any[];

    columns: any[];

    page: number;
    lastPage: number;
    total: number;

    search?: string;
    loading?: boolean;

    selectable?: boolean;
    rowKey?: string;
}

const props = withDefaults(
    defineProps<Props>(),
    {
        search: '',
        loading: false,
        selectable: true,
        rowKey: 'id'
    }
);

const emit = defineEmits<{
    (e: 'add'): void;
    (e: 'export'): void;
    (e: 'refresh'): void;
    (e: 'update:search', value: string): void;

    (e: 'filter', payload: {
        column: string;
        value: string;
    }): void;

    (e: 'sort', payload: {
        column: string;
        direction: 'asc' | 'desc';
    }): void;

    (e: 'selection-change', rows: any[]): void;

    (e: 'next'): void;
    (e: 'prev'): void;
    (e: 'first'): void;
    (e: 'last'): void;
}>();

const selectedRows = ref<any[]>([]);

const localFilters = ref<Record<string, string>>({});

const sortColumn = ref('');
const sortDirection = ref<'asc' | 'desc'>('asc');

watch(selectedRows, rows => {
    emit('selection-change', rows);
}, { deep: true });

const selectAll = computed({
    get() {
        return (
            props.items.length > 0 &&
            selectedRows.value.length === props.items.length
        );
    },

    set(value: boolean) {
        selectedRows.value = value
            ? [...props.items]
            : [];
    }
});

const filterColumns = computed(() =>
    props.columns.filter(
        x => x.options?.filter
    )
);

const effectiveColumns = computed(() =>
    props.columns.length +
    (props.selectable ? 1 : 0)
);

const visibleColumns = ref<string[]>(
    props.columns.map(x => x.name)
);

const displayedColumns = computed(() =>
    props.columns.filter(
        x => visibleColumns.value.includes(x.name)
    )
);

function getValue(obj: Record<string, any>, path: string): any {
    return path
        .split('.')
        .reduce(
            (acc, key) => acc?.[key],
            obj
        );
}

function onSearch(
    event: Event
) {
    emit(
        'update:search',
        (event.target as HTMLInputElement).value
    );
}

function onFilterInput(
    column: string,
    event: Event
) {
    const value =
        (event.target as HTMLInputElement).value;

    localFilters.value[column] = value;

    emit('filter', {
        column,
        value
    });
}

function toggleSort(
    column: any
) {
    if (!column.options?.sort)
        return;

    if (sortColumn.value === column.name)
    {
        sortDirection.value =
            sortDirection.value === 'asc'
                ? 'desc'
                : 'asc';
    }
    else
    {
        sortColumn.value = column.name;
        sortDirection.value = 'asc';
    }

    emit('sort', {
        column: sortColumn.value,
        direction: sortDirection.value
    });
}
</script>