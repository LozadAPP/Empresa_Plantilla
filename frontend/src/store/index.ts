import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import rentalReducer from './slices/rentalSlice';
import returnReducer from './slices/returnSlice';
import paymentReducer from './slices/paymentSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rentals: rentalReducer,
    returns: returnReducer,
    payments: paymentReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
