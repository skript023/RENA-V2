import { http, type ServerResponse } from "@/util/http";
import authentication from "@/stores/authentication";
import type { Command } from "./dto/configs.dto";

export default class configs
{
    static async get_config<T>(name?: String, type?: "music" | "video"): Promise<ServerResponse<T>>
    {
        try 
        {
            const response = await http.get(`/youtube/command/detail`, 
            {
                params: {
                    type,
                    name
                },
                headers: {
                    "Authorization": `Bearer ${authentication.getRawData('ACCESS_TOKEN')}`
                }
            });

            return response.data;
        }
        catch (error: any)
        {
            return error.response?.data;
        }
    }
    static async update_config(payload: Command)
    {
        try 
        {
            const response = await http.put(`/youtube/command/update`, payload, {
                headers: {
                    'Content-Type': 'application/json',
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

    static async get_system_config<T = any>(key?: string): Promise<ServerResponse<T>>
    {
        try 
        {
            const response = await http.get(`/system/config`, 
            {
                params: { key },
                headers: {
                    "Authorization": `Bearer ${authentication.getRawData('ACCESS_TOKEN')}`
                }
            });

            return response.data;
        }
        catch (error: any)
        {
            return error.response?.data;
        }
    }

    static async update_system_config(key: string, value: string): Promise<ServerResponse<any>>
    {
        try 
        {
            const response = await http.put(`/system/config`, { key, value }, {
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${authentication.getRawData('ACCESS_TOKEN')}`
                },
            });
            
            return response.data;
        }
        catch (error: any)
        {
            return error.response?.data;
        }
    }
}