import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import deviceReducer from './slices/deviceSlice';
import telemetryReducer from './slices/telemetrySlice';
import locationReducer from './slices/locationSlice';
import alertReducer from './slices/alertSlice';
import wardReducer from './slices/wardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    device: deviceReducer,
    telemetry: telemetryReducer,
    location: locationReducer,
    alert: alertReducer,
    ward: wardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
