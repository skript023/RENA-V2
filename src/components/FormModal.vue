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

                    <!-- Checkbox -->
                    <label
                        v-if="field.type === 'checkbox'"
                        class="label cursor-pointer justify-start gap-3"
                    >
                        <input
                            type="checkbox"
                            class="checkbox"
                            :checked="localModel[field.key]"
                            @change="
                                updateField(
                                    field.key,
                                    ($event.target as HTMLInputElement).checked
                                )
                            "
                        />

                        <span>
                            {{ field.label }}
                        </span>
                    </label>

                    <template v-else>

                        <label class="label">
                            {{ field.label }}
                        </label>

                        <!-- Input -->
                        <input
                            v-if="
                                field.type !== 'textarea' &&
                                field.type !== 'select'
                            "
                            :value="localModel[field.key]"
                            @input="
                                updateField(
                                    field.key,

                                    field.type === 'number'
                                        ? (
                                            ($event.target as HTMLInputElement)
                                                .value === ''
                                                ? ''
                                                : Number(
                                                    ($event.target as HTMLInputElement)
                                                        .value
                                                )
                                        )
                                        : (
                                            ($event.target as HTMLInputElement)
                                                .value
                                        )
                                )
                            "
                            :type="field.type ?? 'text'"
                            :placeholder="field.placeholder"
                            class="input input-bordered w-full"
                        />

                        <!-- Textarea -->
                        <textarea
                            v-else-if="
                                field.type === 'textarea'
                            "
                            :value="localModel[field.key]"
                            @input="
                                updateField(
                                    field.key,
                                    ($event.target as HTMLTextAreaElement).value
                                )
                            "
                            :placeholder="field.placeholder"
                            class="textarea textarea-bordered w-full"
                        />

                        <!-- Select -->
                        <select
                            v-else
                            :value="localModel[field.key]"
                            @change="
                                updateField(
                                    field.key,
                                    ($event.target as HTMLSelectElement).value
                                )
                            "
                            class="select select-bordered w-full"
                        >

                            <option
                                v-if="field.placeholder"
                                disabled
                                value=""
                            >
                                {{ field.placeholder }}
                            </option>

                            <option
                                v-for="option in field.options"
                                :key="option.value"
                                :value="option.value"
                            >
                                {{ option.label }}
                            </option>

                        </select>

                    </template>

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
import {
    computed,
    ref
} from 'vue';

type Field = {
    key: string;

    label: string;

    type?:
        | 'text'
        | 'number'
        | 'date'
        | 'textarea'
        | 'select'
        | 'checkbox';

    placeholder?: string;

    defaultValue?: any;

    options?: {
        label: string;
        value: any;
    }[];
};

const props =
    withDefaults(
        defineProps<{
            title: string;

            fields: Field[];

            modelValue: Record<string, any>;

            submitLabel?: string;
        }>(),
        {
            submitLabel:
                'Submit'
        }
    );

const emit =
    defineEmits<{
        (
            e:
                'update:modelValue',
            value:
                Record<string, any>
        ): void;

        (
            e:
                'submit',
            value:
                Record<string, any>
        ): void;
    }>();

const modal =
    ref<HTMLDialogElement>();

const localModel =
    computed(() =>
    {
        const model = {
            ...props.modelValue
        };

        for (
            const field
            of props.fields
        )
        {
            if (
                model[field.key] ===
                undefined
            )
            {
                model[field.key] =
                    field.defaultValue ??
                    (
                        field.type ===
                        'checkbox'
                            ? false
                            : field.type ===
                            'number'
                                ? 0
                                : ''
                    );
            }
        }

        return model;
    });

function updateField(
    key: string,
    value: any
)
{
    emit(
        'update:modelValue',
        {
            ...props.modelValue,
            [key]:
                value
        }
    );
}

function open()
{
    modal
        .value
        ?.showModal();
}

function close()
{
    modal
        .value
        ?.close();
}

function submit()
{
    emit(
        'submit',
        localModel.value
    );

    close();
}

defineExpose({
    open,
    close
});
</script>