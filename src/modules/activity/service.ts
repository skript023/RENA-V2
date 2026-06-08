import { http, type ServerResponse } from "@/util/http";
import type Task from "./dto/activity.dto";

export default class activity
{
    static async create<T>(task: Task): Promise<ServerResponse<T>>
    {
        try 
        {
            const response = await http.post('activity', { 
                body: JSON.stringify(task),
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
    static async load(): Promise<ServerResponse<Task[]>>
    {
        try 
        {
            const response = await http.get('activity', { 
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
    static async loadOne(id: string): Promise<ServerResponse<Task>>
    {
        try 
        {
            const response = await http.get(`activity/${id}`, { 
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
}