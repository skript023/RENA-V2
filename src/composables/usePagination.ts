import type { ServerResponse } from "@/util/http";
import { ref, watch } from "vue";

export function usePagination<T>(fetcher: (page: number, limit: number, search?: string) => Promise<ServerResponse<T>>, limit = 10) {
    const page = ref<number>(1);
    const lastPage = ref(1);
    const total = ref(0);
    const loading = ref(false);
    const data = ref<T>();
    const search = ref('');

    const fetch = async () => {
        loading.value = true;

        const res = await fetcher(page.value, limit, search.value.trim().length === 0 ? undefined : search.value);

        if (res.success) 
        {
            data.value = res.data;
            lastPage.value = res.last_page;
            total.value = res.total_data;
        }

        loading.value = false;
    };

    watch(page, () => {
        fetch();
    });

    watch(search, () => {
        page.value = 1;
        fetch();
    });

    async function next()
    {
        await goto(
            page.value + 1
        );
    }

    async function prev()
    {
        await goto(
            page.value - 1
        );
    }

    async function first()
    {
        await goto(1);
    }

    async function last()
    {
        await goto(
            lastPage.value
        );
    }

    async function goto(
        target: number
    )
    {
        if (
            target < 1 ||
            target > lastPage.value
        )
            return;

        page.value = target;

        await fetch();
    }

    return {
        page,
        lastPage,
        total,
        loading,
        data,
        search,
        fetch,
        next,
        prev,
        first,
        last,
        goto
    };
}