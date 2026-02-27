/**
 * Documents — Central document management page.
 * Lists all auto-generated and uploaded documents with filters.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  Description as DocIcon,
  Search as SearchIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Article as ContractIcon,
  Receipt as InvoiceIcon,
  RequestQuote as QuoteIcon,
  DirectionsCar as FichaIcon,
  Inventory as MovementIcon,
  AttachFile as UploadTypeIcon,
  Clear as ClearIcon,
  Storage as SizeIcon,
  AutoMode as AutoIcon,
  PersonOutline as UserIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { StyledKPI } from '../components/styled';
import EmptyState from '../components/common/EmptyState';
import documentService from '../services/documentService';
import { DocumentRecord, DocumentStatistics, DocumentType, DocumentCategory, DocumentSource } from '../types/document';

// ── Type config ──────────────────────────────────
const TYPE_CONFIG: Record<DocumentType, { label: string; color: string; Icon: typeof DocIcon }> = {
  contract:  { label: 'Contrato',  color: '#3b82f6', Icon: ContractIcon },
  invoice:   { label: 'Factura',   color: '#10b981', Icon: InvoiceIcon },
  quote:     { label: 'Cotización', color: '#8b5cf6', Icon: QuoteIcon },
  ficha:     { label: 'Ficha',     color: '#06b6d4', Icon: FichaIcon },
  movement:  { label: 'Movimiento', color: '#f59e0b', Icon: MovementIcon },
  upload:    { label: 'Subido',    color: '#f97316', Icon: UploadTypeIcon },
};

const CATEGORY_CONFIG: Record<DocumentCategory, { label: string; color: string }> = {
  legal:       { label: 'Legal',      color: '#3b82f6' },
  financial:   { label: 'Financiero', color: '#10b981' },
  operational: { label: 'Operativo',  color: '#f59e0b' },
  technical:   { label: 'Técnico',    color: '#06b6d4' },
  general:     { label: 'General',    color: '#6b7280' },
};

const ENTITY_LABELS: Record<string, string> = {
  vehicle: 'Vehículo', rental: 'Renta', customer: 'Cliente',
  invoice: 'Factura', quote: 'Cotización', inventory_movement: 'Movimiento',
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Documents: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const styles = useThemeStyles();

  // ── Data state ────────────────────────────────────
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [stats, setStats] = useState<DocumentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // ── Filter state ──────────────────────────────────
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // ── Upload dialog ─────────────────────────────────
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('general');
  const [uploadEntityType, setUploadEntityType] = useState('');
  const [uploadEntityId, setUploadEntityId] = useState('');
  const [uploading, setUploading] = useState(false);

  // ── Load stats once ───────────────────────────────
  useEffect(() => {
    documentService.getStatistics().then(res => setStats(res.data?.data || null)).catch(() => {});
  }, []);

  // ── Load documents ────────────────────────────────
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await documentService.getAll({
        page: page + 1,
        limit: rowsPerPage,
        ...(search && { search }),
        ...(typeFilter && { document_type: typeFilter as DocumentType }),
        ...(categoryFilter && { category: categoryFilter as DocumentCategory }),
        ...(sourceFilter && { source: sourceFilter as DocumentSource }),
      });
      setDocuments(res.data?.data || []);
      setTotalCount(res.data?.pagination?.total || 0);
    } catch {
      enqueueSnackbar('Error al cargar documentos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, typeFilter, categoryFilter, sourceFilter, enqueueSnackbar]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  // ── Handlers ──────────────────────────────────────
  const handleClearFilters = () => {
    setSearch(''); setTypeFilter(''); setCategoryFilter(''); setSourceFilter(''); setPage(0);
  };

  const hasActiveFilters = search || typeFilter || categoryFilter || sourceFilter;

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

  const handleDelete = async (doc: DocumentRecord) => {
    try {
      await documentService.softDelete(doc.id);
      enqueueSnackbar('Documento eliminado', { variant: 'success' });
      loadDocuments();
      documentService.getStatistics().then(res => setStats(res.data?.data || null)).catch(() => {});
    } catch {
      enqueueSnackbar('Error al eliminar documento', { variant: 'error' });
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('name', uploadName || uploadFile.name);
      if (uploadDesc) formData.append('description', uploadDesc);
      formData.append('category', uploadCategory);
      if (uploadEntityType) formData.append('entity_type', uploadEntityType);
      if (uploadEntityId) formData.append('entity_id', uploadEntityId);

      await documentService.upload(formData);
      enqueueSnackbar('Documento subido exitosamente', { variant: 'success' });
      setUploadOpen(false);
      resetUploadForm();
      loadDocuments();
      documentService.getStatistics().then(res => setStats(res.data?.data || null)).catch(() => {});
    } catch {
      enqueueSnackbar('Error al subir documento', { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null); setUploadName(''); setUploadDesc('');
    setUploadCategory('general'); setUploadEntityType(''); setUploadEntityId('');
  };

  // ── Render ────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '14px',
            background: `linear-gradient(135deg, ${alpha('#8b5cf6', 0.2)}, ${alpha('#3b82f6', 0.2)})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <DocIcon sx={{ color: '#8b5cf6', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: styles.text.headingStrong }}>
              Documentos
            </Typography>
            <Typography variant="caption" sx={{ color: styles.text.muted }}>
              {totalCount} documento{totalCount !== 1 ? 's' : ''} registrado{totalCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setUploadOpen(true)}
          sx={{
            borderRadius: '12px', textTransform: 'none', fontWeight: 600,
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
          }}
        >
          Subir Documento
        </Button>
      </Box>

      {/* KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: styles.responsive.gridKpi, gap: 2, mb: 3 }}>
        <StyledKPI label="Total Documentos" value={stats?.total ?? '-'} color="#8b5cf6" icon={<DocIcon />} />
        <StyledKPI label="Auto-generados" value={stats?.auto ?? '-'} subtitle="PDFs del sistema" color="#3b82f6" icon={<AutoIcon />} />
        <StyledKPI label="Subidos" value={stats?.upload ?? '-'} subtitle="por usuarios" color="#f97316" icon={<UserIcon />} />
        <StyledKPI label="Almacenamiento" value={formatFileSize(stats?.totalSize)} color="#10b981" icon={<SizeIcon />} />
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, p: 2, borderRadius: '16px', background: styles.isDarkMode ? 'rgba(6, 11, 40, 0.6)' : 'rgba(0, 0, 0, 0.02)', border: `1px solid ${styles.border.subtle}` }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} flexWrap="wrap" useFlexGap>
          <TextField
            placeholder="Buscar nombre, código..."
            size="small"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: styles.text.muted, fontSize: 20 }} /></InputAdornment> }}
            sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: '12px', background: styles.isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff' } }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Tipo</InputLabel>
            <Select value={typeFilter} label="Tipo" onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ borderRadius: '12px' }}>
              <MenuItem value="">Todos</MenuItem>
              {Object.entries(TYPE_CONFIG).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Categoría</InputLabel>
            <Select value={categoryFilter} label="Categoría" onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }} sx={{ borderRadius: '12px' }}>
              <MenuItem value="">Todas</MenuItem>
              {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Origen</InputLabel>
            <Select value={sourceFilter} label="Origen" onChange={(e) => { setSourceFilter(e.target.value); setPage(0); }} sx={{ borderRadius: '12px' }}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="auto">Auto-generado</MenuItem>
              <MenuItem value="upload">Subido</MenuItem>
            </Select>
          </FormControl>
          {hasActiveFilters && (
            <Chip label="Limpiar" size="small" onDelete={handleClearFilters} deleteIcon={<ClearIcon />} sx={{ height: 28, fontSize: '0.75rem' }} />
          )}
        </Stack>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: '#8b5cf6' }} />
        </Box>
      ) : documents.length === 0 ? (
        <EmptyState
          title="Sin documentos"
          subtitle={hasActiveFilters ? 'No se encontraron documentos con los filtros aplicados.' : 'No hay documentos registrados. Suba un archivo o descargue un PDF para comenzar.'}
          icon={<DocIcon sx={{ fontSize: 48 }} />}
          action={hasActiveFilters ? undefined : { label: 'Subir Primer Documento', onClick: () => setUploadOpen(true) }}
        />
      ) : (
        <>
          <TableContainer sx={{ borderRadius: '16px', border: `1px solid ${styles.border.subtle}`, background: styles.isDarkMode ? 'rgba(6, 11, 40, 0.6)' : '#fff' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { color: styles.text.muted, fontWeight: 600, fontSize: '0.75rem', borderColor: styles.border.subtle } }}>
                  <TableCell>Código</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Entidad</TableCell>
                  <TableCell>Origen</TableCell>
                  <TableCell>Tamaño</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((doc) => {
                  const typeCfg = TYPE_CONFIG[doc.document_type] || TYPE_CONFIG.upload;
                  const catCfg = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.general;
                  return (
                    <TableRow key={doc.id} hover sx={{ '& td': { borderColor: styles.border.subtle, color: styles.text.primary } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: styles.text.secondary, fontSize: '0.8rem' }}>
                          {doc.document_code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<typeCfg.Icon sx={{ fontSize: '14px !important' }} />}
                          label={typeCfg.label}
                          size="small"
                          sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600, background: alpha(typeCfg.color, 0.15), color: typeCfg.color, border: `1px solid ${alpha(typeCfg.color, 0.3)}`, '& .MuiChip-icon': { color: typeCfg.color } }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={catCfg.label}
                          size="small"
                          sx={{ height: 20, fontSize: '0.6rem', fontWeight: 500, background: alpha(catCfg.color, 0.1), color: catCfg.color }}
                        />
                      </TableCell>
                      <TableCell>
                        {doc.entity_type ? (
                          <Typography variant="caption" sx={{ color: styles.text.muted }}>
                            {ENTITY_LABELS[doc.entity_type] || doc.entity_type} #{doc.entity_id}
                          </Typography>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={doc.source === 'auto' ? 'Auto' : 'Subido'}
                          size="small"
                          sx={{ height: 20, fontSize: '0.6rem', fontWeight: 500, background: doc.source === 'auto' ? alpha('#3b82f6', 0.1) : alpha('#f97316', 0.1), color: doc.source === 'auto' ? '#3b82f6' : '#f97316' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: styles.text.muted }}>
                          {formatFileSize(doc.file_size)}
                        </Typography>
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
                        <Tooltip title="Eliminar">
                          <IconButton size="small" onClick={() => handleDelete(doc)} sx={{ color: '#ef4444' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 20, 50]}
              labelRowsPerPage="Por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              sx={{ color: styles.text.secondary }}
            />
          </Box>
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', background: styles.isDarkMode ? '#1c1c2e' : '#fff' } }}>
        <DialogTitle sx={{ color: styles.text.headingStrong, fontWeight: 700 }}>Subir Documento</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Button variant="outlined" component="label" startIcon={<UploadIcon />} sx={{ borderRadius: '12px', textTransform: 'none', borderStyle: 'dashed', py: 2 }}>
              {uploadFile ? uploadFile.name : 'Seleccionar archivo'}
              <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setUploadFile(f); if (!uploadName) setUploadName(f.name.replace(/\.[^.]+$/, '')); }
              }} />
            </Button>
            <TextField label="Nombre" size="small" value={uploadName} onChange={(e) => setUploadName(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            <TextField label="Descripción" size="small" multiline rows={2} value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            <FormControl size="small">
              <InputLabel>Categoría</InputLabel>
              <Select value={uploadCategory} label="Categoría" onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)} sx={{ borderRadius: '12px' }}>
                {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Entidad (opcional)</InputLabel>
                <Select value={uploadEntityType} label="Entidad (opcional)" onChange={(e) => setUploadEntityType(e.target.value)} sx={{ borderRadius: '12px' }}>
                  <MenuItem value="">Ninguna</MenuItem>
                  <MenuItem value="vehicle">Vehículo</MenuItem>
                  <MenuItem value="rental">Renta</MenuItem>
                  <MenuItem value="customer">Cliente</MenuItem>
                </Select>
              </FormControl>
              {uploadEntityType && (
                <TextField label="ID Entidad" size="small" type="number" value={uploadEntityId} onChange={(e) => setUploadEntityId(e.target.value)} sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
              )}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setUploadOpen(false); resetUploadForm(); }} sx={{ borderRadius: '10px', textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleUpload} disabled={!uploadFile || uploading} startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
            {uploading ? 'Subiendo...' : 'Subir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Documents;
