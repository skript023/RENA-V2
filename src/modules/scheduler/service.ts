import { http, type ServerResponse } from "@/util/http"
import type { SchedulerTask, UpdateSchedulerTaskPayload } from "./dto/scheduler.dto"

export default class schedulerService {
  static async getTasks(): Promise<ServerResponse<SchedulerTask[]>> {
    const res = await http.get(`/system/scheduler/tasks`)
    return res.data
  }

  static async updateTask(
    id: string,
    payload: UpdateSchedulerTaskPayload
  ): Promise<ServerResponse<any>> {
    const res = await http.put(`/system/scheduler/tasks/${id}`, payload)
    return res.data
  }

  static async runTask(id: string): Promise<ServerResponse<any>> {
    const res = await http.post(`/system/scheduler/tasks/${id}/run`, {})
    return res.data
  }
}
