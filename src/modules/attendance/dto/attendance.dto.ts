export interface AttendanceSettings {
    wfh_latitude: string;
    wfh_longitude: string;
    wfo_latitude: string;
    wfo_longitude: string;
    wfh_days: string;
    attendance_mode: 'AUTO' | 'WFH' | 'WFO';
    start_description: string;
    auto_retry?: boolean;
    max_retries?: number;
}

export interface AttendanceLog {
    id: string;
    user_id: string;
    provider: 'HRMIS' | 'JAHRA';
    type: 'CHECKIN' | 'CHECKOUT';
    status: 'SUCCESS' | 'FAILED';
    message: string;
    payload?: string;
    execution_type: 'CRON' | 'MANUAL' | 'RETRY' | 'AUTO_RETRY';
    retry_count: number;
    created_at: string;
    updated_at: string;
}

export interface AttendanceLogsResponse {
    rows: AttendanceLog[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}
