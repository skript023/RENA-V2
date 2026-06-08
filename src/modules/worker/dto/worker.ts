export interface WorkerStatus {
    name: string
    hostname: string
    last_args: string
    last_heartbeat: string
    last_job_id: string
    last_queued: string
    pid: string
    progress: string
    state: string
    timestamp: string
    version: string
}

export interface QueueStatus {
    uuid: string
    worker: number
    args: string
    method: string
    status: string
    data: string
    pid: number
    created_at: string
}

export interface JobStatus {
    args: string
    created_at: string
    data: string
    function_name: string
    group: string
    id: string
    pid: string
    status: string
    stream: string
    uuid: string
    worker: string
    message: string
}

export interface WorkerStats {
  success: number;
  failed: number;
  waiting: number;
  processing: number;
  total: number;
}