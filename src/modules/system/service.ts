import { http, type ServerResponse } from "@/util/http"
import authentication from "@/stores/authentication"
import type { ServiceResponse, SystemResponse } from "./dto/system.dto"

export default class system
{
    static async getStatus(): Promise<ServerResponse<SystemResponse[]>>
    {
        const res = await http.get(`/server/status`, {
            headers: {
                "Authorization": `Bearer ${authentication.getRawData("ACCESS_TOKEN")}`
            }
        })

        return res.data
    }
    static async getServiceStatus(): Promise<ServerResponse<ServiceResponse>>
    {
        const res = await http.get(`/service/status`, {
            headers: {
                "Authorization": `Bearer ${authentication.getRawData("ACCESS_TOKEN")}`
            }
        })

        return res.data
    }
}