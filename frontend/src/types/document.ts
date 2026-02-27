export type DocumentType = 'contract' | 'invoice' | 'quote' | 'ficha' | 'movement' | 'upload';
export type DocumentCategory = 'legal' | 'financial' | 'operational' | 'technical' | 'general';
export type DocumentSource = 'auto' | 'upload';

export interface DocumentRecord {
  id: number;
  document_code: string;
  name: string;
  description?: string;
  document_type: DocumentType;
  category: DocumentCategory;
  mime_type: string;
  file_size?: number;
  file_path: string;
  original_name?: string;
  entity_type?: string;
  entity_id?: number;
  source: DocumentSource;
  is_active: boolean;
  uploaded_by?: number;
  uploader?: { id: number; first_name: string; last_name: string };
  created_at: string;
  updated_at: string;
}

export interface DocumentFilters {
  page?: number;
  limit?: number;
  document_type?: DocumentType;
  category?: DocumentCategory;
  source?: DocumentSource;
  entity_type?: string;
  entity_id?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface DocumentStatistics {
  total: number;
  auto: number;
  upload: number;
  totalSize: number;
  byType: Record<string, number>;
}
