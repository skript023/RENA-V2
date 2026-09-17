import { http, type ServerResponse } from "@/util/http";
import type { AttendanceSettings, AttendanceLogsResponse } from "./dto/attendance.dto";

export default class attendanceService {
    static async getSettings(): Promise<ServerResponse<AttendanceSettings>> {
        const response = await http.get<ServerResponse<AttendanceSettings>>("/attendance/settings");
        return response.data;
    }

    static async updateSettings(payload: AttendanceSettings): Promise<ServerResponse<AttendanceSettings>> {
        const response = await http.put<ServerResponse<AttendanceSettings>>("/attendance/settings", payload);
        return response.data;
    }

    static async getLogs(params?: { page?: number; limit?: number; provider?: string; status?: string }): Promise<ServerResponse<AttendanceLogsResponse>> {
        const response = await http.get<ServerResponse<AttendanceLogsResponse>>("/attendance/logs", { params });
        return response.data;
    }

    static async retryLog(id: string): Promise<ServerResponse<any>> {
        const response = await http.post<ServerResponse<any>>(`/attendance/logs/${id}/retry`);
        return response.data;
    }

    static async retryAllFailed(): Promise<ServerResponse<{ total_retried: number; succeeded: number; failed: number }>> {
        const response = await http.post<ServerResponse<{ total_retried: number; succeeded: number; failed: number }>>("/attendance/retry-failed");
        return response.data;
    }

    static async manualCheckinHrmis(payload?: any): Promise<ServerResponse<string>> {
        const response = await http.get<ServerResponse<string>>("/attendance/hrmis/checkin", { params: payload });
        return response.data;
    }

    static async manualCheckoutHrmis(payload?: any): Promise<ServerResponse<string>> {
        const response = await http.get<ServerResponse<string>>("/attendance/hrmis/checkout", { params: payload });
        return response.data;
    }

    static async manualCheckinJahra(): Promise<ServerResponse<string>> {
        const response = await http.get<ServerResponse<string>>("/attendance/jahra/checkin");
        return response.data;
    }

    static async manualCheckoutJahra(): Promise<ServerResponse<string>> {
        const response = await http.get<ServerResponse<string>>("/attendance/jahra/checkout");
        return response.data;
    }
}
