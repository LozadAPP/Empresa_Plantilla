/**
 * Redux Slice para Pagos e Facturas (CHAT 2)
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Payment, CreatePaymentDTO, PaymentFilters } from '../../types/payment';
import { Invoice, CreateInvoiceDTO, InvoiceFilters } from '../../types/invoice';
import paymentService from '../../services/paymentService';
import invoiceService from '../../services/invoiceService';

interface PaymentState {
  payments: Payment[];
  invoices: Invoice[];
  selectedPayment: Payment | null;
  selectedInvoice: Invoice | null;
  loading: boolean;
  error: string | null;
  paymentPagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  invoicePagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const initialState: PaymentState = {
  payments: [],
  invoices: [],
  selectedPayment: null,
  selectedInvoice: null,
  loading: false,
  error: null,
  paymentPagination: {
    total: 0,
    page: 1,
    limit: 20,
    pages: 0
  },
  invoicePagination: {
    total: 0,
    page: 1,
    limit: 20,
    pages: 0
  }
};

// Async Thunks - Payments
export const fetchPayments = createAsyncThunk(
  'payments/fetchAll',
  async (filters: PaymentFilters | undefined, { rejectWithValue }) => {
    try {
      const response = await paymentService.getAll(filters);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al obtener pagos');
    }
  }
);

export const createPayment = createAsyncThunk(
  'payments/create',
  async (data: CreatePaymentDTO, { rejectWithValue }) => {
    try {
      const response = await paymentService.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear pago');
    }
  }
);

// Async Thunks - Invoices
export const fetchInvoices = createAsyncThunk(
  'invoices/fetchAll',
  async (filters: InvoiceFilters | undefined, { rejectWithValue }) => {
    try {
      const response = await invoiceService.getAll(filters);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al obtener facturas');
    }
  }
);

export const createInvoice = createAsyncThunk(
  'invoices/create',
  async (data: CreateInvoiceDTO, { rejectWithValue }) => {
    try {
      const response = await invoiceService.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear factura');
    }
  }
);

export const resendInvoice = createAsyncThunk(
  'invoices/resend',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await invoiceService.resend(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al reenviar factura');
    }
  }
);

export const fetchOverdueInvoices = createAsyncThunk(
  'invoices/fetchOverdue',
  async (_, { rejectWithValue }) => {
    try {
      const response = await invoiceService.getOverdue();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al obtener facturas vencidas');
    }
  }
);

export const fetchInvoiceById = createAsyncThunk(
  'invoices/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await invoiceService.getById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al obtener factura');
    }
  }
);

// Slice
const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedPayment: (state) => {
      state.selectedPayment = null;
    },
    clearSelectedInvoice: (state) => {
      state.selectedInvoice = null;
    }
  },
  extraReducers: (builder) => {
    // Payments
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload.payments;
        state.paymentPagination = action.payload.pagination;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.payments.unshift(action.payload);
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Invoices
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload.invoices;
        state.invoicePagination = action.payload.pagination;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices.unshift(action.payload);
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(resendInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendInvoice.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resendInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchOverdueInvoices.fulfilled, (state, action) => {
        state.invoices = action.payload.invoices;
      });

    // fetchInvoiceById
    builder
      .addCase(fetchInvoiceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoiceById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedInvoice = action.payload;
      })
      .addCase(fetchInvoiceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearError, clearSelectedPayment, clearSelectedInvoice } = paymentSlice.actions;
export default paymentSlice.reducer;
