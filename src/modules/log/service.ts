import { http, type ServerResponse } from "@/util/http"
import authentication from "@/stores/authentication"

export default class logService
{
    static async getConfig(): Promise<ServerResponse<string>>
    {
        const res = await http.get(`/log/config`, {
            headers: {
                "Authorization": `Bearer ${authentication.getRawData("ACCESS_TOKEN")}`
            }
        })

        return res.data
    }

    static async setLevel(level: string)
    {
        const res = await http.post(`/log/change`, { level },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authentication.getRawData("ACCESS_TOKEN")}`
                }
            }
        )

        return res.data
    }
}