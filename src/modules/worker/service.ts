import { http, type ServerResponse } from "@/util/http";
import type { JobStatus, QueueStatus, WorkerStats, WorkerStatus } from "./dto/worker";
import authentication from "@/stores/authentication";

export default class worker
{
    static async get(page: number = 1, limit: number = 5): Promise<ServerResponse<WorkerStatus[]>>
    {
        try 
        {
            const response = await http.get(`/workers`, { 
                headers: {
                    "Authorization": `Bearer ${authentication.getRawData('ACCESS_TOKEN')}`
                },
                params: { page, limit }
            });

            return response.data;
        }
        catch (error: any)
        {
            return {
                success: false,
                data: [],
                message: error?.response?.data?.message ?? "error",
                last_page: 1,
                total_data: 0
            };
        }
    }
    static async get_status(): Promise<ServerResponse<WorkerStats>>
    {
        try 
        {
            const response = await http.get(`/jobs-status`, { 
                headers: {
                    "Authorization": `Bearer ${authentication.getRawData('ACCESS_TOKEN')}`
                },
            });

            return response.data;
        }
        catch (error: any)
        {
            return {
                success: false,
                data: {} as WorkerStats,
                message: error?.response?.data?.message ?? "error",
                last_page: 1,
                total_data: 0
            };
        }
    }
    static async get_one(id: string): Promise<ServerResponse<QueueStatus>>
    {
        try 
        {
            const response = await http.get(`/worker/${id}`, {
                headers: {
                    "Authorization": `Bearer ${authentication.getRawData('ACCESS_TOKEN')}`
                },
            });
            
            return response.data;
        } 
        catch (error: any)
        {
            return {
                success: false,
                data: {} as QueueStatus,
                message: error?.response?.data?.message ?? "error",
                last_page: 1,
                total_data: 0
            };
        }
    }
    static async get_job(page: number = 1, limit: number = 5, search?: string): Promise<ServerResponse<JobStatus[]>>
    {
        try 
        {
            const response = await http.get(`/jobs`, { 
                headers: {
                    "Authorization": `Bearer ${authentication.getRawData('ACCESS_TOKEN')}`
                },
                params: { page, limit, ...(search && { search }) }
            });

            return response.data;
        }
        catch (error: any)
        {
            return {
                success: false,
                data: [],
                message: error?.response?.data?.message ?? "error",
                last_page: 1,
                total_data: 0
            };
        }
    }
}