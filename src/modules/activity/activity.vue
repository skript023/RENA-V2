<template>
    <FormModal
        ref="formModal"
        v-model="form"
        :title="
            editingId
                ? 'Edit Activity'
                : 'Create Activity'
        "
        :fields="fields"
        :submit-label="
            editingId
                ? 'Update'
                : 'Create'
        "
        @submit="submitForm"
    />
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
            row-key="id"
            @update:search="search = $event"
            @add="createTask"
            @export="exportExcel"
            @filter="onFilter"
            @sort="onSort"
            @selection-change="selectedRows = $event"
            @next="next"
            @prev="prev"
            @first="first"
            @last="last"

            @goto="goto"
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

import DataTable from '@/components/DataTable.vue';
import Navigation from '@/components/Navigation.vue';
import FormModal from '@/components/FormModal.vue';

import { usePagination } from '@/composables/usePagination';

import activity from './service';

const selectedRows = ref<any[]>([]);

const filters = ref<Record<string, string>>({});

const sortColumn = ref('');
const sortDirection = ref<'asc' | 'desc'>('desc');
const formModal = ref();
const editingId = ref<string | null>(null);

const form = ref({
    title: '',
    description: '',
    status: 'pending',
    start_date: '',
    due_date: ''
});

const fields: any = [
    {
        key: 'title',
        label: 'Title',
        type: 'text'
    },
    {
        key: 'description',
        label: 'Description',
        type: 'textarea'
    },
    {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
            {
                label: 'Pending',
                value: 'pending'
            },
            {
                label: 'Completed',
                value: 'completed'
            },
            {
                label: 'Cancelled',
                value: 'cancelled'
            }
        ]
    },
    {
        key: 'start_date',
        label: 'Start Date',
        type: 'date'
    },
    {
        key: 'due_date',
        label: 'End Date',
        type: 'date'
    }
];

const columns = [
    {
        name: 'user.lastname',
        label: 'User',
        options: {
            filter: true,
            sort: true
        }
    },
    {
        name: 'title',
        label: 'Title',
        options: {
            filter: true,
            sort: true
        }
    },
    {
        name: 'description',
        label: 'Description',
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
        name: 'due_date',
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
    prev,
    first,
    last,
    goto
} = usePagination(
    (_page, _limit, _search) =>
        activity.load(_page, _limit, sortDirection.value, _search)
        // activity.load({
        //     page: _page,
        //     limit: _limit,
        //     search: _search,
        //     filters: filters.value,
        //     sort_column: sortColumn.value,
        //     sort_direction: sortDirection.value
        // })
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
    editingId.value = null;

    form.value = {
        title: '',
        description: '',
        status: 'pending',
        start_date: '',
        due_date: ''
    };

    formModal.value.open();
}

function exportExcel()
{
    console.log('export');
}

function editTask(row: any)
{
    editingId.value = row.id;

    form.value = {
        title: row.title,
        description: row.description,
        status: row.status,
        start_date: row.start_date,
        due_date: row.due_date
    };

    formModal.value.open();
}

function deleteTask(row: any)
{
    console.log('delete', row);
}

async function submitForm(payload: any)
{
    if (editingId.value)
    {
        await activity.update(
            editingId.value,
            payload
        );
    }
    else
    {
        await activity.create(payload);
    }

    fetch();
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