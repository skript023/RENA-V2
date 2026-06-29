export default interface Task
{
    id: string
    user_id: string
    title: string
    category_id: string
    description: string
    start_date: string
    due_date: string
    evidence_required: boolean
    frequency: string
    priority: string
    require_manual_assignment: boolean
    status: string
    weight: number
}

export interface TaskCategory {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateActivityDto {
  user_id: string;
  title: string;
  description: string;
  priority: string;
  weight: number;
  frequency: string;
  evidence_required: boolean;
  category_id: string;
  start_date: string;
  due_date: string;
  require_manual_assignment: boolean;
  status: string;
}