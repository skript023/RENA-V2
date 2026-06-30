import { http, type ServerResponse } from "@/util/http";
import type Task from "./dto/activity.dto";
import authentication from "@/stores/authentication";
import type { TaskCategory } from "./dto/activity.dto";

export default class activity
{
    static async create<T>(task: Task): Promise<ServerResponse<T>>
    {
        try 
        {
            const response = await http.post('tasks', task, { 
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authentication.getRawData('ACCESS_TOKEN')}`
                }
            });

            return response.data;
        } 
        catch (error: any)
        {
            return error.response.data;
        }
    }
    static async load(page: number = 1, limit: number = 5, sortDirection: 'asc' | 'desc' = 'asc', search?: string): Promise<ServerResponse<Task[]>>
    {
        try 
        {
            const response = await http.get('tasks', { 
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authentication.getRawData('ACCESS_TOKEN')}`
                },
                params: { page, limit, ...(search && { search }), sortDirection }
            });

            return response.data;
        }
        catch (error: any)
        {
            return error.response.data;
        }
    }
    static async loadOne(id: string): Promise<ServerResponse<Task>>
    {
        try 
        {
            const response = await http.get(`tasks/${id}`, { 
                headers: {
                    "Content-Type": "application/json"
                }
            });

            return response.data;
        }
        catch (error: any)
        {
            return error.response.data;
        }
    }
    static async update<T>(id: string, task: Task): Promise<ServerResponse<T>>
    {
        try 
        {
            const response = await http.put(`tasks/${id}`, task, { 
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authentication.getRawData('ACCESS_TOKEN')}`
                }
            });

            return response.data;
        } 
        catch (error: any)
        {
            return error.response.data;
        }
    }
    static async remove<T>(id: string): Promise<ServerResponse<T>>
    {
        try 
        {
            const response = await http.delete(`tasks/${id}`, { 
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authentication.getRawData('ACCESS_TOKEN')}`
                }
            });

            return response.data;
        } 
        catch (error: any)
        {
            return error.response.data;
        }
    }
    static async categories(): Promise<ServerResponse<TaskCategory[]>>
    {
        try 
        {
            const response = await http.get('tasks/categories', { 
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authentication.getRawData('ACCESS_TOKEN')}`
                },
            });

            return response.data;
        }
        catch (error: any)
        {
            return error.response.data;
        }
    }
    static async sync(tasks: {id: string[]}): Promise<ServerResponse<TaskCategory[]>>
    {
        try 
        {
            const response = await http.post('tasks/sync', tasks, { 
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authentication.getRawData('ACCESS_TOKEN')}`
                },
            });

            return response.data;
        }
        catch (error: any)
        {
            return error.response.data;
        }
    }
}