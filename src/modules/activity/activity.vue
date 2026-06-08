<template>
    <Navigation title="Activity">

        <DataTable
            title="Activity Logs"
            :items="activities"
            :columns="columns"
            :page="page"
            :last-page="lastPage"
            :total="total"
            :loading="loading"
            :search="search"
            row-key="_id"
            @update:search="search = $event"
            @add="createTask"
            @export="exportExcel"
            @filter="onFilter"
            @sort="onSort"
            @selection-change="selectedRows = $event"
            @next="next"
            @prev="prev"
        >

            <template #cell-user.fullname="{ row }">

                <div>
                    <div class="font-medium">
                        {{ row.user?.fullname }}
                    </div>

                    <div class="text-xs opacity-60">
                        {{ row.user?.username }}
                    </div>
                </div>

            </template>

            <template #cell-status="{ value }">

                <span
                    class="badge"
                    :class="getStatusClass(value)"
                >
                    {{ value }}
                </span>

            </template>

            <template #cell-id="{ row }">

                <div class="flex gap-2">

                    <button
                        class="btn btn-xs btn-info"
                        @click="editTask(row)"
                    >
                        Edit
                    </button>

                    <button
                        class="btn btn-xs btn-error"
                        @click="deleteTask(row)"
                    >
                        Delete
                    </button>

                </div>

            </template>

        </DataTable>

    </Navigation>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import Navigation from '@/components/Navigation.vue';
import DataTable from '@/components/DataTable.vue';

import { usePagination } from '@/composables/usePagination';

import activity from './service';

const selectedRows = ref<any[]>([]);

const filters = ref<Record<string, string>>({});

const sortColumn = ref('');
const sortDirection = ref<'asc' | 'desc'>('asc');

const columns = [
    {
        name: 'user.fullname',
        label: 'User',
        options: {
            filter: true,
            sort: true
        }
    },
    {
        name: 'name',
        label: 'Task',
        options: {
            filter: true,
            sort: true
        }
    },
    {
        name: 'status',
        label: 'Status',
        options: {
            filter: true,
            sort: true
        }
    },
    {
        name: 'start_date',
        label: 'Start Date',
        options: {
            filter: true,
            sort: true
        }
    },
    {
        name: 'end_date',
        label: 'End Date',
        options: {
            filter: true,
            sort: true
        }
    },
    {
        name: 'id',
        label: 'Action',
        options: {
            filter: false,
            sort: false
        }
    }
];

const {
    data,
    page,
    lastPage,
    total,
    loading,
    search,
    fetch,
    next,
    prev
} = usePagination(
    (_page, _limit, _search) =>
        activity.load({
            page: _page,
            limit: _limit,
            search: _search,
            filters: filters.value,
            sort_column: sortColumn.value,
            sort_direction: sortDirection.value
        })
);

onMounted(fetch);

const activities = computed(
    () => data.value ?? []
);

function onFilter(payload: {
    column: string;
    value: string;
})
{
    filters.value[payload.column] = payload.value;

    fetch();
}

function onSort(payload: {
    column: string;
    direction: 'asc' | 'desc';
})
{
    sortColumn.value = payload.column;
    sortDirection.value = payload.direction;

    fetch();
}

function createTask()
{
    console.log('create');
}

function exportExcel()
{
    console.log('export');
}

function editTask(row: any)
{
    console.log('edit', row);
}

function deleteTask(row: any)
{
    console.log('delete', row);
}

function getStatusClass(status: string)
{
    switch (status?.toLowerCase())
    {
        case 'completed':
            return 'badge-success';

        case 'pending':
            return 'badge-warning';

        case 'cancelled':
            return 'badge-error';

        default:
            return 'badge-neutral';
    }
}
</script>