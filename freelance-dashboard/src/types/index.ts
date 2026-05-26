export interface User {
  id: string;
  email: string;
  fullName: string;
  plan: 'free' | 'pro';
  monthlyGoal: number | null;
  taxRate: number | null;
  seTaxRate: number | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
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
  hourlyRate: number | null;
  status: 'active' | 'inactive';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  invoiceCount?: number;
  totalEarned?: number;
}

export interface Project {
  id: string;
  userId: string;
  clientId: string | null;
  name: string;
  description: string | null;
  status: 'active' | 'completed' | 'on_hold' | 'planned';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  deadline: string | null;
  budget: number | null;
  createdAt: string;
  updatedAt: string;
  clientName?: string;
}

export interface Expense {
  id: string;
  userId: string;
  projectId: string | null;
  description: string;
  amount: number;
  currency: string;
  category: string;
  expenseDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  projectName?: string;
}

export interface DashboardData {
  summary: {
    totalEarned: number;
    totalExpenses: number;
    totalPending: number;
    totalOverdue: number;
    overdueInvoices: number;
    openInvoices: number;
    totalOutstanding: number;
    expensesByCategory: { category: string; total: number }[];
    activeClients: number;
  };
  monthlyRevenue: { label: string; revenue: number; invoiceCount: number }[];
  deadlines: { id: string; name: string; deadline: string; priority: string; progress: number; clientName: string }[];
  recentInvoices: { id: string; invoiceNumber: string; amount: number; status: string; dueDate: string; clientName: string }[];
  tax: {
    gross: number;
    expenses: number;
    taxable: number;
    taxOwed: number;
    taxRate: number;
    seTaxRate: number;
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
  userId: string;
  clientId: string | null;
  projectId: string | null;
  invoiceNumber: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  amount: number;
  currency: string;
  taxRate: number;
  totalAmount: number;
  taxAmount: number;
  issueDate: string;
  dueDate: string | null;
  paidAt: string | null;
  notes: string | null;
  lineItems: InvoiceLineItem[];
  pdfUrl: string | null;
  stripePaymentLink: string | null;
  createdAt: string;
  updatedAt: string;
  clientName?: string;
  clientCompany?: string;
  projectName?: string;
}
