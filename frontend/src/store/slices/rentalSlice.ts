/**
 * Redux Slice para Rentas (CHAT 2)
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Rental,
  CreateRentalDTO,
  UpdateRentalDTO,
  RentalFilters
} from '../../types/rental';
import rentalService from '../../services/rentalService';

interface RentalState {
  rentals: Rental[];
  selectedRental: Rental | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const initialState: RentalState = {
  rentals: [],
  selectedRental: null,
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
export const fetchRentals = createAsyncThunk(
  'rentals/fetchAll',
  async (filters: RentalFilters | undefined, { rejectWithValue }) => {
    try {
      const response = await rentalService.getAll(filters);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al obtener rentas');
    }
  }
);

export const fetchRentalById = createAsyncThunk(
  'rentals/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await rentalService.getById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al obtener renta');
    }
  }
);

export const createRental = createAsyncThunk(
  'rentals/create',
  async (data: CreateRentalDTO, { rejectWithValue }) => {
    try {
      const response = await rentalService.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear renta');
    }
  }
);

export const updateRental = createAsyncThunk(
  'rentals/update',
  async ({ id, data }: { id: number; data: UpdateRentalDTO }, { rejectWithValue }) => {
    try {
      const response = await rentalService.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar renta');
    }
  }
);

export const cancelRental = createAsyncThunk(
  'rentals/cancel',
  async ({ id, reason }: { id: number; reason: string }, { rejectWithValue }) => {
    try {
      const response = await rentalService.cancel(id, reason);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cancelar renta');
    }
  }
);

// Slice
const rentalSlice = createSlice({
  name: 'rentals',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedRental: (state) => {
      state.selectedRental = null;
    },
    setSelectedRental: (state, action: PayloadAction<Rental>) => {
      state.selectedRental = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Fetch all rentals
    builder
      .addCase(fetchRentals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRentals.fulfilled, (state, action) => {
        state.loading = false;
        state.rentals = action.payload.rentals;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchRentals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch rental by ID
    builder
      .addCase(fetchRentalById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRentalById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedRental = action.payload;
      })
      .addCase(fetchRentalById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create rental
    builder
      .addCase(createRental.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRental.fulfilled, (state, action) => {
        state.loading = false;
        state.rentals.unshift(action.payload);
      })
      .addCase(createRental.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update rental
    builder
      .addCase(updateRental.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRental.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.rentals.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.rentals[index] = action.payload;
        }
        if (state.selectedRental?.id === action.payload.id) {
          state.selectedRental = action.payload;
        }
      })
      .addCase(updateRental.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Cancel rental
    builder
      .addCase(cancelRental.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelRental.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.rentals.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.rentals[index] = action.payload;
        }
        if (state.selectedRental?.id === action.payload.id) {
          state.selectedRental = action.payload;
        }
      })
      .addCase(cancelRental.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearError, clearSelectedRental, setSelectedRental } = rentalSlice.actions;
export default rentalSlice.reducer;
