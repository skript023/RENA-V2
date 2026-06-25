<template>
    <dialog
        ref="modal"
        class="modal"
    >
        <div class="modal-box max-w-2xl">

            <h3 class="font-bold text-lg mb-4">
                {{ title }}
            </h3>

            <div class="space-y-4">

                <div
                    v-for="field in fields"
                    :key="field.key"
                >

                    <label class="label">
                        {{ field.label }}
                    </label>

                    <!-- Input -->
                    <input
                        v-if="field.type !== 'textarea' && field.type !== 'select'"
                        v-model="localModel[field.key]"
                        :type="field.type"
                        class="input input-bordered w-full"
                    />

                    <!-- Textarea -->
                    <textarea
                        v-else-if="field.type === 'textarea'"
                        v-model="localModel[field.key]"
                        class="textarea textarea-bordered w-full"
                    />

                    <!-- Select -->
                    <select
                        v-else
                        v-model="localModel[field.key]"
                        class="select select-bordered w-full"
                    >
                        <option
                            v-for="option in field.options"
                            :key="option.value"
                            :value="option.value"
                        >
                            {{ option.label }}
                        </option>
                    </select>

                </div>

            </div>

            <div class="modal-action">

                <button
                    class="btn"
                    @click="close"
                >
                    Cancel
                </button>

                <button
                    class="btn btn-primary"
                    @click="submit"
                >
                    {{ submitLabel }}
                </button>

            </div>

        </div>
    </dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

type Field = {
    key: string;
    label: string;
    type?: 'text' | 'date' | 'textarea' | 'select';
    options?: {
        label: string;
        value: string;
    }[];
};

const props = defineProps<{
    title: string;
    fields: Field[];
    modelValue: Record<string, any>;
    submitLabel?: string;
}>();

const emit = defineEmits([
    'update:modelValue',
    'submit'
]);

const modal = ref<HTMLDialogElement>();

const localModel = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v)
});

function open()
{
    modal.value?.showModal();
}

function close()
{
    modal.value?.close();
}

function submit()
{
    emit('submit', localModel.value);

    close();
}

defineExpose({
    open,
    close
});
</script>