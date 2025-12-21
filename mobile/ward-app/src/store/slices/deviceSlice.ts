import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DeviceService } from '../../services/DeviceService';

interface Device {
  id: string;
  name: string;
  deviceType: string;
  status: string;
  serialNumber?: string;
  macAddress?: string;
  lastSeenAt?: string;
}

interface DeviceState {
  devices: Device[];
  connectedDevice: Device | null;
  isScanning: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: DeviceState = {
  devices: [],
  connectedDevice: null,
  isScanning: false,
  isLoading: false,
  error: null,
};

export const fetchDevices = createAsyncThunk(
  'device/fetchDevices',
  async (_, { rejectWithValue }) => {
    try {
      return await DeviceService.getDevices();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch devices');
    }
  }
);

export const connectDevice = createAsyncThunk(
  'device/connectDevice',
  async (device: Device, { rejectWithValue }) => {
    try {
      return await DeviceService.connectDevice(device);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to connect device');
    }
  }
);

export const autoConnectDevices = createAsyncThunk(
  'device/autoConnectDevices',
  async (_, { rejectWithValue }) => {
    try {
      return await DeviceService.autoConnectDevices();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to auto-connect devices');
    }
  }
);

const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    setConnectedDevice: (state, action: PayloadAction<Device | null>) => {
      state.connectedDevice = action.payload;
    },
    setScanning: (state, action: PayloadAction<boolean>) => {
      state.isScanning = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDevices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.devices = action.payload;
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(connectDevice.fulfilled, (state, action) => {
        state.connectedDevice = action.payload;
      })
      .addCase(connectDevice.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(autoConnectDevices.fulfilled, (state, action) => {
        if (action.payload.length > 0) {
          state.connectedDevice = action.payload[0]; // Подключаемся к первому устройству
        }
      })
      .addCase(autoConnectDevices.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setConnectedDevice, setScanning, clearError } = deviceSlice.actions;
export default deviceSlice.reducer;

