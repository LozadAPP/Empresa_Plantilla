/**
 * Redux Slice para Devoluciones (CHAT 2)
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Return, CreateReturnDTO, UpdateReturnDTO } from '../../types/return';
import returnService from '../../services/returnService';

interface ReturnState {
  returns: Return[];
  selectedReturn: Return | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const initialState: ReturnState = {
  returns: [],
  selectedReturn: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    pages: 0
  }
};

// Async Thunks
export const fetchReturns = createAsyncThunk(
  'returns/fetchAll',
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await returnService.getAll(params || {});
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al obtener devoluciones');
    }
  }
);

export const fetchReturnById = createAsyncThunk(
  'returns/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await returnService.getById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al obtener devolución');
    }
  }
);

export const createReturn = createAsyncThunk(
  'returns/create',
  async (data: CreateReturnDTO, { rejectWithValue }) => {
    try {
      const response = await returnService.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear devolución');
    }
  }
);

export const updateReturn = createAsyncThunk(
  'returns/update',
  async ({ id, data }: { id: number; data: UpdateReturnDTO }, { rejectWithValue }) => {
    try {
      const response = await returnService.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar devolución');
    }
  }
);

// Slice
const returnSlice = createSlice({
  name: 'returns',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedReturn: (state) => {
      state.selectedReturn = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReturns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReturns.fulfilled, (state, action) => {
        state.loading = false;
        state.returns = action.payload.returns;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchReturns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchReturnById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReturnById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedReturn = action.payload;
      })
      .addCase(fetchReturnById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReturn.fulfilled, (state, action) => {
        state.loading = false;
        state.returns.unshift(action.payload);
      })
      .addCase(createReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(updateReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReturn.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.returns.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.returns[index] = action.payload;
        }
      })
      .addCase(updateReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearError, clearSelectedReturn } = returnSlice.actions;
export default returnSlice.reducer;
