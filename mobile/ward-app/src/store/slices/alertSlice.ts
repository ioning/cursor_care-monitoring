import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AlertService } from '../../services/AlertService';

interface Alert {
  id: string;
  alertType: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  createdAt: string;
}

interface AlertState {
  alerts: Alert[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: AlertState = {
  alerts: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

export const fetchAlerts = createAsyncThunk(
  'alert/fetchAlerts',
  async (_, { rejectWithValue }) => {
    try {
      return await AlertService.getAlerts();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch alerts');
    }
  }
);

const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.alerts.unshift(action.payload);
      state.unreadCount += 1;
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find((a) => a.id === action.payload);
      if (alert && state.unreadCount > 0) {
        state.unreadCount -= 1;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.alerts = action.payload;
        state.unreadCount = action.payload.filter((a) => a.status === 'active').length;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addAlert, markAsRead, clearError } = alertSlice.actions;
export default alertSlice.reducer;

