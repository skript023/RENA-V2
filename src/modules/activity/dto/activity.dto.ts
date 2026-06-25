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