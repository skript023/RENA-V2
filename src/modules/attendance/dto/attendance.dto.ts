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
    provider: 'HRMIS' | 'JAHRA' | 'GOOGLE_SHEETS';
    type: 'CHECKIN' | 'CHECKOUT' | 'WEEKLY_REPORT';
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

export interface BackfillSheetsPayload {
    type?: 'all' | 'attendance' | 'weekly_report';
    attendance_start?: string;
    attendance_end?: string;
    weekly_start?: string;
    weekly_end?: string;
    skip_holidays?: boolean;
    skip_existing?: boolean;
    exclude_dates?: string[];
}

export interface BackfillSheetsResult {
    attendance?: {
        processed_days: number;
        added_days: number;
        skipped_holidays: number;
        skipped_existing: number;
        months_affected: string[];
    };
    weekly_report?: {
        processed_weeks: number;
        added_weeks: number;
        skipped_existing: number;
        months_affected: string[];
    };
}
