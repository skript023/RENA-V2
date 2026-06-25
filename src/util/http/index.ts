import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";

/* =========================
   TYPES
========================= */

export interface ServerResponse<T> {
    message: string;
    data: T;
    success: boolean;
    last_page: number;
    total_data: number;
}

interface RetryRequestConfig extends AxiosRequestConfig {
    _retry?: boolean;
}

/* =========================
   BACKEND SELECTOR
========================= */

const getBackendUrl = () => {
    return import.meta.env.VITE_ENVIRONMENT === "development"
        ? import.meta.env.VITE_BACKEND_URL_DEV
        : import.meta.env.VITE_BACKEND_URL_PROD;
};

/* =========================
   AXIOS INSTANCES
========================= */

const request = axios.create({
    withCredentials: true,
});

const refreshClient = axios.create({
    withCredentials: true,
});

/* =========================
   AUTH HELPERS
========================= */

const getToken = () => localStorage.getItem("ACCESS_TOKEN");

const setToken = (token: string) => {
    localStorage.setItem("ACCESS_TOKEN", token);
};

const clearToken = () => {
    localStorage.removeItem("ACCESS_TOKEN");
};

/* =========================
   HELPER: CHECK BACKEND REQUEST
========================= */

const isBackendRequest = (config?: AxiosRequestConfig) => {
    if (!config?.url) return false;

    // relative → backend
    if (config.url.startsWith("/")) return true;

    const base = getBackendUrl();
    return config.url.startsWith(base);
};

/* =========================
   REFRESH STATE
========================= */

let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

/* =========================
   REQUEST INTERCEPTOR
========================= */

request.interceptors.request.use((config) => {
    // 🔥 dynamic baseURL
    config.baseURL = getBackendUrl();

    if (!isBackendRequest(config)) {
        return config;
    }

    const token = getToken();

    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

/* =========================
   REFRESH REQUEST INTERCEPTOR
========================= */

refreshClient.interceptors.request.use((config) => {
    config.baseURL = getBackendUrl();
    return config;
});

/* =========================
   RESPONSE INTERCEPTOR
========================= */

request.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as RetryRequestConfig;

        if (!isBackendRequest(originalRequest)) {
            return Promise.reject(error);
        }

        const status = error?.response?.status;

        console.log("INTERCEPTOR:", status, originalRequest?.url);

        // network error (CORS dll)
        if (!error.response) {
            return Promise.reject(error);
        }

        if (status !== 401) {
            return Promise.reject(error);
        }

        // kalau refresh gagal → logout
        if (originalRequest.url?.includes("/auth/refresh")) {
            clearToken();
            window.location.href = "/";
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        /* =========================
           WAIT QUEUE
        ========================= */

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                queue.push((token) => {
                    if (!token) {
                        reject(error);
                        return;
                    }

                    originalRequest.headers = originalRequest.headers ?? {};
                    originalRequest.headers.Authorization = `Bearer ${token}`;

                    resolve(request(originalRequest));
                });
            });
        }

        /* =========================
           START REFRESH
        ========================= */

        isRefreshing = true;

        try {
            console.log("REFRESH START");

            const res = await refreshClient.post("/auth/refresh");

            const newToken = res.data?.data?.token;

            if (!newToken) {
                throw new Error("No token returned");
            }

            console.log("REFRESH SUCCESS");

            setToken(newToken);

            request.defaults.headers.common.Authorization = `Bearer ${newToken}`;

            // resolve queue
            queue.forEach((cb) => cb(newToken));
            queue = [];

            // retry original request
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            return request(originalRequest);
        } catch (err) {
            console.log("REFRESH FAILED");

            queue.forEach((cb) => cb(null));
            queue = [];

            clearToken();
            window.location.href = "/";

            return Promise.reject(err);
        } finally {
            isRefreshing = false;
        }
    }
);

/* =========================
   HTTP WRAPPER
========================= */

class HttpRequest {
    async get<T = any>(
        route: string,
        config?: AxiosRequestConfig
    ): Promise<AxiosResponse<T>> {
        return request.get(route, config);
    }

    async post<T = any>(
        route: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<AxiosResponse<T>> {
        return request.post(route, data, config);
    }

    async patch<T = any>(
        route: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<AxiosResponse<T>> {
        return request.patch(route, data, config);
    }

    async put<T = any>(
        route: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<AxiosResponse<T>> {
        return request.put(route, data, config);
    }

    async delete<T = any>(
        route: string,
        config?: AxiosRequestConfig
    ): Promise<AxiosResponse<T>> {
        return request.delete(route, config);
    }
}

export const http = new HttpRequest();