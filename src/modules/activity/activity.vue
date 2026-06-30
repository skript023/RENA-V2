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
            @refresh="refresh"
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
            :visible-pages="5"

            :selected-actions="[
                {
                    label: 'Delete',
                    icon: 'ph ph-trash',
                    class: 'btn-error',
                    onClick: deleteTask
                },
                {
                    label: 'Sync',
                    icon: 'ph ph-check',
                    class: 'btn-success',
                    onClick: sync
                },
                {
                    label: 'Export',
                    icon: 'ph ph-file',
                    class: 'btn-info',
                    onClick: () => {}
                }
            ]"
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
import type { CreateActivityDto, TaskCategory } from './dto/activity.dto';
import authentication from '@/stores/authentication';
import time from '@/util/time';
import { useConfirm } from '@/composables/useConfirm';
import { useNotification } from '@/composables/useNotification';
import moment from 'moment';

const { confirm } = useConfirm();
const { notify } = useNotification();

const selectedRows = ref<any[]>([]);

const filters = ref<Record<string, string>>({});

const sortColumn = ref('');
const sortDirection = ref<'asc' | 'desc'>('desc');
const formModal = ref();
const editingId = ref<string | null>(null);
const categories = ref<TaskCategory[]>([]);

const form = ref<CreateActivityDto>({
  user_id: '',
  title: '',
  description: '',
  priority: '',
  weight: 0,
  frequency: '',
  evidence_required: false,
  category_id: '',
  start_date: '',
  due_date: '',
  require_manual_assignment: false,
  status: 'pending',
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
        key: 'weight',
        label: 'Effort',
        type: 'number',
        defaultValue: 4,
    },
    {
        key: 'category_id',
        label: 'Category',
        type: 'select',
        placeholder: 'Select category',
        defaultValue: 'Meeting',
        options: []
    },
    {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        defaultValue: 'Medium',
        options: [
            {
                label: 'Critical',
                value: 'Critical'
            },
            {
                label: 'High',
                value: 'High'
            },
            {
                label: 'Medium',
                value: 'Medium'
            },
            {
                label: 'Low',
                value: 'Low'
            }
        ]
    },
    {
        key: 'frequency',
        label: 'Frequency',
        type: 'select',
        defaultValue: 'once',
        options: [
            {
                label: 'Once',
                value: 'once'
            },
            {
                label: 'Daily',
                value: 'daily'
            },
            {
                label: 'Weekly',
                value: 'weekly'
            },
            {
                label: 'Monthly',
                value: 'monthly'
            },
            {
                label: 'Quarterly',
                value: 'quarterly'
            },
            {
                label: 'Semester',
                value: 'semester'
            }
        ]
    },
    {
        key: 'evidence_required',
        label: 'Evidence Required?',
        type: 'checkbox',
        defaultValue: false,
        value: true
    },
    {
        key: 'status',
        label: 'Status',
        type: 'select',
        defaultValue: 'Completed',
        options: [
            {
                label: 'Open',
                value: 'Open'
            },
            {
                label: 'Completed',
                value: 'Completed'
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

async function loadCategories()
{
    const res = await activity.categories();

    categories.value = res.data;

    const field = fields.find((x: { key: string; }) => x.key === 'category_id');

    if (!field)
    {
        return;
    }

    field.options = categories.value.map((category: any) => ({
            label:
                category.name,

            value:
                category.id
        })
    );
}

onMounted(async () =>
{
    await Promise.all([
        fetch(),
        loadCategories()
    ]);
});

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
        user_id: authentication.data()?.id as string,

        title: '',

        description: '',

        priority: 'Medium',

        weight: 3,

        frequency: 'once',

        evidence_required: false,

        category_id: '3ab1fde2-22f4-459a-9ceb-0990dfb2e2c4',

        start_date: moment().format('YYYY-MM-DD'),
        due_date: moment().format('YYYY-MM-DD'),

        require_manual_assignment: false,

        status: 'Open'
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
        user_id: row.user_id ?? authentication.data()?.id,

        title: row.title ?? '',

        description: row.description ?? '',

        priority: row.priority ?? '',

        weight: Number( row.weight ) ?? 0,

        frequency: row.frequency ?? '',

        evidence_required: row.evidence_required ?? false,

        category_id: row.category_id ?? '',

        start_date: row.start_date?.split('T')[0] ?? '',

        due_date: row.due_date
                ?.split(
                    'T'
                )[0] ??
            '',

        require_manual_assignment: row.require_manual_assignment ?? false,

        status: row.status ?? 'Open'
    };

    formModal.value.open();
}

async function deleteTask(row: any)
{
    const ok = await confirm({
        title: "Delete Task",
        message: `Delete ${row.title}? This action cannot be undone.`,
        confirmText: "Delete",
        cancelText: "Cancel"
    })

    if (!ok) return

    try {
        await activity.remove(row.id);

        notify("Task deleted!", "success");
    } catch {
        notify("Failed to delete task", "error");
    }
    
    await fetch();
}

async function submitForm(payload: any)
{
    const body = {
        ...payload,
        start_date: time.database_date(payload.start_date),
        due_date: time.database_date(payload.due_date)
    };

    if (editingId.value)
    {
        await activity.update(
            editingId.value,
            body
        );

        notify("Task updated!", "success");
    }
    else
    {
        await activity.create(
            body
        );

        notify("Task submitted!", "success");
    }

    await fetch();
}

async function refresh() {
    await fetch();
}

async function sync(rows: any[]) {
    const ok = await confirm({
        title: "Sync Task",
        message: `Are you sure want to sync all this task? this action cannot be undone.`,
        confirmText: "Sync",
        cancelText: "Cancel"
    })

    if (!ok) return;
    const payload = {
        id: rows.map(row => row.id)
    };

    console.log(JSON.stringify(payload));
    await activity.sync(payload);

    notify("Task synced!", "success");
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