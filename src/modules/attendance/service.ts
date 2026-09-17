import { http, type ServerResponse } from "@/util/http";
import type { AttendanceSettings } from "./dto/attendance.dto";

export default class attendanceService {
    static async getSettings(): Promise<ServerResponse<AttendanceSettings>> {
        const response = await http.get<ServerResponse<AttendanceSettings>>("/attendance/settings");
        return response.data;
    }

    static async updateSettings(payload: AttendanceSettings): Promise<ServerResponse<AttendanceSettings>> {
        const response = await http.put<ServerResponse<AttendanceSettings>>("/attendance/settings", payload);
        return response.data;
    }
}

