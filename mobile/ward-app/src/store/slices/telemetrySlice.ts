import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TelemetryData {
  metricType: string;
  value: number;
  unit: string;
  timestamp: string;
}

interface TelemetryState {
  data: TelemetryData[];
  latest: Record<string, TelemetryData>;
  isRecording: boolean;
}

const initialState: TelemetryState = {
  data: [],
  latest: {},
  isRecording: false,
};

const telemetrySlice = createSlice({
  name: 'telemetry',
  initialState,
  reducers: {
    addTelemetryData: (state, action: PayloadAction<TelemetryData>) => {
      state.data.push(action.payload);
      state.latest[action.payload.metricType] = action.payload;
      // Keep only last 1000 records
      if (state.data.length > 1000) {
        state.data = state.data.slice(-1000);
      }
    },
    setRecording: (state, action: PayloadAction<boolean>) => {
      state.isRecording = action.payload;
    },
    clearData: (state) => {
      state.data = [];
      state.latest = {};
    },
  },
});

export const { addTelemetryData, setRecording, clearData } = telemetrySlice.actions;
export default telemetrySlice.reducer;

