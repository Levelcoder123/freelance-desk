export interface User {
  id: string;
  email: string;
  fullName: string;
  plan: 'free' | 'pro';
  monthlyGoal: string | null;
  taxRate: string | null;
  seTaxRate: string | null;
  timezone: string;
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  revoked: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface Tokens {
  access: string;
  refresh: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tags: string[] | null;
  hourlyRate: string | null;
  status: 'active' | 'inactive' | 'lead';
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  invoiceCount?: number;
  totalEarned?: number;
  invoices?: any[];
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
  budget: string | null;
  createdAt: Date;
  updatedAt: Date;
  clientName?: string;
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
  amount: string;
  currency: string;
  taxRate: string;
  totalAmount: string;
  taxAmount: string;
  issueDate: string;
  dueDate: string | null;
  paidAt: Date | null;
  notes: string | null;
  lineItems: InvoiceLineItem[];
  pdfUrl: string | null;
  stripePaymentLink: string | null;
  createdAt: Date;
  updatedAt: Date;
  client_name?: string;
  client_email?: string;
  client_company?: string;
  client_address?: string;
  project_name?: string;
}

export interface Expense {
  id: string;
  userId: string;
  description: string;
  amount: string;
  currency: string;
  category: string;
  expenseDate: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
