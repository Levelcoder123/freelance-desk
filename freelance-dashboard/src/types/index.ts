export interface User {
  id: string;
  email: string;
  full_name: string;
  plan: 'free' | 'pro';
  monthly_goal: number | null;
  tax_rate: number | null;
  se_tax_rate: number | null;
  timezone: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface NormalizedAuth {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tags: string[] | null;
  hourly_rate: number | null;
  status: 'active' | 'inactive';
  notes: string | null;
  created_at: string;
  updated_at: string;
  invoice_count?: number;
  total_earned?: number;
}

export interface Project {
  id: string;
  user_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  status: 'active' | 'completed' | 'on_hold' | 'planned';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  deadline: string | null;
  budget: number | null;
  created_at: string;
  updated_at: string;
  client_name?: string;
}

export interface Expense {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  expense_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  summary: {
    total_earned: number;
    total_expenses: number;
    total_pending: number;
    total_overdue: number;
    overdue_invoices: number;
    open_invoices: number;
    total_outstanding: number;
    expenses_by_category: { category: string; total: number }[];
  };
  monthly_revenue: { label: string; revenue: number; invoice_count: number }[];
  deadlines: { id: string; name: string; deadline: string; priority: string; progress: number; client_name: string }[];
  recent_invoices: { id: string; invoice_number: string; amount: number; status: string; due_date: string; client_name: string }[];
  tax: {
    gross: number;
    expenses: number;
    taxable: number;
    tax_owed: number;
    tax_rate: number;
    se_tax_rate: number;
  };
  goal: {
    target: number;
    earned: number;
    percent: number;
  };
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string | null;
  project_id: string | null;
  invoice_number: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  amount: number;
  currency: string;
  tax_rate: number;
  total_amount: number;
  tax_amount: number;
  issue_date: string;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  line_items: InvoiceLineItem[];
  pdf_url: string | null;
  stripe_payment_link: string | null;
  created_at: string;
  updated_at: string;
  client_name?: string;
  client_company?: string;
  project_name?: string;
}
