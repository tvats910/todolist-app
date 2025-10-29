export interface Task {
  id: number;
  title: string;
  description?: string | null;
  user_id: number;
  completed: boolean;
  email?: string;
  name:string
}
