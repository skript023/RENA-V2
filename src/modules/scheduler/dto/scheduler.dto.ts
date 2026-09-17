export interface SchedulerTask {
  id: string
  name: string
  enabled: boolean
  cron: string
  timezone: string
  start_time: string
  end_time: string
  next_run: string
  last_run: string
  status: 'idle' | 'running' | 'disabled' | 'outside_window' | string
}

export interface UpdateSchedulerTaskPayload {
  enabled: boolean
  cron: string
  timezone: string
  start_time: string
  end_time: string
}
