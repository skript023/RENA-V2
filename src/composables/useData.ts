import type { ServerResponse } from "@/util/http";
import { ref } from "vue";

export function useData<T>(fetcher: () => Promise<ServerResponse<T>>) {
    const loading = ref(false);
    const data = ref<T>();

    const fetch = async () => {
        loading.value = true;

        const res = await fetcher();

        if (res.success) 
        {
            data.value = res.data;
        }

        loading.value = false;
    };

    return {
        loading,
        data,
        fetch,
    };
}