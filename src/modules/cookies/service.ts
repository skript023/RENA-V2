import { http, type ServerResponse } from "@/util/http";
import authentication from "@/stores/authentication";
import type { CookieFile, UpdateCookie } from "./cookies.dto";

export default class cookies
{
    static async list(): Promise<ServerResponse<CookieFile[]>>
    {
        const response = await http.get(`/cookies`, { 
            headers: {
                "Authorization": `Bearer ${authentication.getRawData('ACCESS_TOKEN')}`
            }
        });

        return response.data;
    }
    static async create(payload: UpdateCookie) {
        const response = await http.post(`/cookies`, payload, {
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${authentication.getRawData('ACCESS_TOKEN')}`
            },
        });
        return response.data
    }
    static async update(payload: UpdateCookie) {
        const response = await http.put(`/cookies`, payload, {
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${authentication.getRawData('ACCESS_TOKEN')}`
            },
        });
        return response.data
    }
    static async delete(filename: string) {
        const response = await http.delete(`/cookies/${encodeURIComponent(filename)}`, {
            headers: {
                "Authorization": `Bearer ${authentication.getRawData('ACCESS_TOKEN')}`
            },
        });

        return response.data
    }
}