export interface AttendanceSettings {
    wfh_latitude: string;
    wfh_longitude: string;
    wfo_latitude: string;
    wfo_longitude: string;
    wfh_days: string;
    attendance_mode: 'AUTO' | 'WFH' | 'WFO';
    start_description: string;
}

