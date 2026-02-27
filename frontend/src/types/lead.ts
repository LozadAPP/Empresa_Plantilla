/**
 * Tipos para el modulo de Prospectos (CRM)
 */

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  WON = 'won',
  LOST = 'lost',
}

export enum LeadSource {
  WEB = 'web',
  REFERRAL = 'referral',
  COLD_CALL = 'cold_call',
  EVENT = 'event',
  SOCIAL_MEDIA = 'social_media',
  OTHER = 'other',
}

export enum LeadPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum ActivityType {
  CALL = 'call',
  EMAIL = 'email',
  MEETING = 'meeting',
  NOTE = 'note',
  FOLLOW_UP = 'follow_up',
  PROPOSAL = 'proposal',
}

export interface LeadActivity {
  id: number;
  leadId: number;
  activityType: ActivityType;
  description: string;
  scheduledAt?: string | Date;
  completedAt?: string | Date;
  createdBy: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  creator?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface Lead {
  id: number;
  leadCode: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  estimatedValue: number;
  assignedTo?: number;
  customerId?: number;
  notes?: string;
  nextFollowUp?: string | Date;
  lostReason?: string;
  convertedAt?: string | Date;
  createdBy: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;

  // Relaciones
  assignee?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  customer?: {
    id: number;
    first_name: string;
    last_name: string;
    company_name?: string;
  };
  creator?: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
  };
  activities?: LeadActivity[];
}

export interface CreateLeadDTO {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: LeadSource;
  priority?: LeadPriority;
  estimatedValue?: number;
  assignedTo?: number;
  nextFollowUp?: string;
  notes?: string;
}

export interface UpdateLeadDTO {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: LeadSource;
  priority?: LeadPriority;
  estimatedValue?: number;
  assignedTo?: number;
  nextFollowUp?: string;
  notes?: string;
}

export interface LeadFilters {
  status?: LeadStatus | string;
  source?: LeadSource | string;
  priority?: LeadPriority | string;
  assigned_to?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LeadPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface LeadResponse {
  success: boolean;
  data: {
    leads: Lead[];
    pagination: LeadPagination;
  };
}

export interface SingleLeadResponse {
  success: boolean;
  data: Lead;
  message?: string;
}

export interface LeadStatistics {
  success: boolean;
  data: {
    pipeline: Record<string, number>;
    bySource: Record<string, number>;
    totalValue: number;
    conversionRate: number;
    totalLeads: number;
  };
}

export interface ConvertLeadResponse {
  success: boolean;
  message: string;
  data: {
    lead: Lead;
    customer: any;
    quote: any;
  };
}
