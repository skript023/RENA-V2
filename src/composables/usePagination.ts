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

    const next = () => {
        if (page.value < lastPage.value) page.value++;
    };

    const prev = () => {
        if (page.value > 1) page.value--;
    };

    return {
        page,
        lastPage,
        total,
        loading,
        data,
        search,
        fetch,
        next,
        prev
    };
}