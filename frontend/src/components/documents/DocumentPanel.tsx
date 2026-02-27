/**
 * DocumentPanel — Reusable panel showing documents attached to an entity.
 * Embeds in detail pages (VehicleDetail, CustomerDetail, RentalDetail, etc.)
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  alpha,
} from '@mui/material';
import {
  Description as DocIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Article as ContractIcon,
  Receipt as InvoiceIcon,
  RequestQuote as QuoteIcon,
  DirectionsCar as FichaIcon,
  Inventory as MovementIcon,
  AttachFile as UploadTypeIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import documentService from '../../services/documentService';
import { DocumentRecord, DocumentType, DocumentCategory } from '../../types/document';

const TYPE_ICON: Record<DocumentType, typeof DocIcon> = {
  contract: ContractIcon, invoice: InvoiceIcon, quote: QuoteIcon,
  ficha: FichaIcon, movement: MovementIcon, upload: UploadTypeIcon,
};

const TYPE_COLOR: Record<DocumentType, string> = {
  contract: '#3b82f6', invoice: '#10b981', quote: '#8b5cf6',
  ficha: '#06b6d4', movement: '#f59e0b', upload: '#f97316',
};

const TYPE_LABEL: Record<DocumentType, string> = {
  contract: 'Contrato', invoice: 'Factura', quote: 'Cotización',
  ficha: 'Ficha', movement: 'Movimiento', upload: 'Subido',
};

const CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: 'legal', label: 'Legal' },
  { value: 'financial', label: 'Financiero' },
  { value: 'operational', label: 'Operativo' },
  { value: 'technical', label: 'Técnico' },
  { value: 'general', label: 'General' },
];

interface DocumentPanelProps {
  entityType: string;
  entityId: number;
}

const DocumentPanel: React.FC<DocumentPanelProps> = ({ entityType, entityId }) => {
  const styles = useThemeStyles();
  const { enqueueSnackbar } = useSnackbar();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('general');
  const [uploading, setUploading] = useState(false);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const res = await documentService.getByEntity(entityType, entityId);
      setDocuments(res.data?.data || []);
    } catch {
      // Silent — panel is non-critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocs(); }, [entityType, entityId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = async (doc: DocumentRecord) => {
    try {
      const blob = await documentService.download(doc.id);
      const url = URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.original_name || `${doc.document_code}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      enqueueSnackbar('Error al descargar documento', { variant: 'error' });
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('name', uploadName || uploadFile.name);
      formData.append('category', uploadCategory);
      formData.append('entity_type', entityType);
      formData.append('entity_id', String(entityId));
      await documentService.upload(formData);
      enqueueSnackbar('Documento subido', { variant: 'success' });
      setUploadOpen(false);
      setUploadFile(null);
      setUploadName('');
      setUploadCategory('general');
      loadDocs();
    } catch {
      enqueueSnackbar('Error al subir documento', { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const paperSx = {
    p: 3,
    mt: 3,
    borderRadius: '16px',
    background: styles.isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#fff',
    border: `1px solid ${styles.border.subtle}`,
  };

  return (
    <Box sx={paperSx}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DocIcon sx={{ color: '#8b5cf6', fontSize: 22 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: styles.text.headingStrong }}>
            Documentos
          </Typography>
          <Chip label={documents.length} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<UploadIcon fontSize="small" />}
          onClick={() => setUploadOpen(true)}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
        >
          Subir
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} sx={{ color: '#8b5cf6' }} />
        </Box>
      ) : documents.length === 0 ? (
        <Typography variant="body2" sx={{ color: styles.text.muted, textAlign: 'center', py: 3 }}>
          No hay documentos asociados
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { color: styles.text.muted, fontWeight: 600, fontSize: '0.7rem', borderColor: styles.border.subtle } }}>
              <TableCell>Nombre</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell align="right">Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc) => {
              const Icon = TYPE_ICON[doc.document_type] || DocIcon;
              const color = TYPE_COLOR[doc.document_type] || '#6b7280';
              const label = TYPE_LABEL[doc.document_type] || doc.document_type;
              return (
                <TableRow key={doc.id} hover sx={{ '& td': { borderColor: styles.border.subtle, color: styles.text.primary, py: 1 } }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<Icon sx={{ fontSize: '14px !important' }} />}
                      label={label}
                      size="small"
                      sx={{ height: 22, fontSize: '0.6rem', fontWeight: 600, background: alpha(color, 0.15), color, '& .MuiChip-icon': { color } }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: styles.text.muted }}>
                      {new Date(doc.created_at).toLocaleDateString('es-MX')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Descargar">
                      <IconButton size="small" onClick={() => handleDownload(doc)} sx={{ color: '#3b82f6' }}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px', background: styles.isDarkMode ? '#1c1c2e' : '#fff' } }}>
        <DialogTitle sx={{ color: styles.text.headingStrong, fontWeight: 700, fontSize: '1rem' }}>Subir Documento</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Button variant="outlined" component="label" startIcon={<UploadIcon />} sx={{ borderRadius: '12px', textTransform: 'none', borderStyle: 'dashed', py: 1.5 }}>
              {uploadFile ? uploadFile.name : 'Seleccionar archivo'}
              <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setUploadFile(f); if (!uploadName) setUploadName(f.name.replace(/\.[^.]+$/, '')); }
              }} />
            </Button>
            <TextField label="Nombre" size="small" value={uploadName} onChange={(e) => setUploadName(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            <FormControl size="small">
              <InputLabel>Categoría</InputLabel>
              <Select value={uploadCategory} label="Categoría" onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)} sx={{ borderRadius: '12px' }}>
                {CATEGORY_OPTIONS.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUploadOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none' }}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpload} disabled={!uploadFile || uploading} startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
            {uploading ? 'Subiendo...' : 'Subir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentPanel;
