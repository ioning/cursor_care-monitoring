import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

interface LocationState {
  currentLocation: Location | null;
  isTracking: boolean;
  error: string | null;
}

const initialState: LocationState = {
  currentLocation: null,
  isTracking: false,
  error: null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setLocation: (state, action: PayloadAction<Location>) => {
      state.currentLocation = action.payload;
      state.error = null;
    },
    setTracking: (state, action: PayloadAction<boolean>) => {
      state.isTracking = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setLocation, setTracking, setError } = locationSlice.actions;
export default locationSlice.reducer;

