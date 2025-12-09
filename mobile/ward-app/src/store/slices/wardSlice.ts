import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { WardService, Ward, CreateWardDto, UpdateWardDto } from '../../services/WardService';

interface WardState {
  wards: Ward[];
  currentWard: Ward | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: WardState = {
  wards: [],
  currentWard: null,
  isLoading: false,
  error: null,
};

export const fetchWards = createAsyncThunk('wards/fetchWards', async () => {
  return await WardService.getWards();
});

export const fetchWard = createAsyncThunk('wards/fetchWard', async (wardId: string) => {
  return await WardService.getWard(wardId);
});

export const createWard = createAsyncThunk(
  'wards/createWard',
  async (data: CreateWardDto) => {
    return await WardService.createWard(data);
  },
);

export const updateWard = createAsyncThunk(
  'wards/updateWard',
  async ({ wardId, data }: { wardId: string; data: UpdateWardDto }) => {
    return await WardService.updateWard(wardId, data);
  },
);

export const deleteWard = createAsyncThunk('wards/deleteWard', async (wardId: string) => {
  await WardService.deleteWard(wardId);
  return wardId;
});

export const uploadAvatar = createAsyncThunk(
  'wards/uploadAvatar',
  async ({ wardId, imageUri }: { wardId: string; imageUri: string }) => {
    return await WardService.uploadAvatar(wardId, imageUri);
  },
);

const wardSlice = createSlice({
  name: 'wards',
  initialState,
  reducers: {
    setCurrentWard: (state, action: PayloadAction<Ward | null>) => {
      state.currentWard = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch wards
      .addCase(fetchWards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wards = action.payload;
      })
      .addCase(fetchWards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch wards';
      })
      // Fetch ward
      .addCase(fetchWard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentWard = action.payload;
        // Update in wards list if exists
        const index = state.wards.findIndex((w) => w.id === action.payload.id);
        if (index >= 0) {
          state.wards[index] = action.payload;
        }
      })
      .addCase(fetchWard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch ward';
      })
      // Create ward
      .addCase(createWard.fulfilled, (state, action) => {
        state.wards.push(action.payload);
      })
      // Update ward
      .addCase(updateWard.fulfilled, (state, action) => {
        const index = state.wards.findIndex((w) => w.id === action.payload.id);
        if (index >= 0) {
          state.wards[index] = action.payload;
        }
        if (state.currentWard?.id === action.payload.id) {
          state.currentWard = action.payload;
        }
      })
      // Delete ward
      .addCase(deleteWard.fulfilled, (state, action) => {
        state.wards = state.wards.filter((w) => w.id !== action.payload);
        if (state.currentWard?.id === action.payload) {
          state.currentWard = null;
        }
      })
      // Upload avatar
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        const index = state.wards.findIndex((w) => w.id === action.payload.id));
        if (index >= 0) {
          state.wards[index] = action.payload;
        }
        if (state.currentWard?.id === action.payload.id) {
          state.currentWard = action.payload;
        }
      });
  },
});

export const { setCurrentWard, clearError } = wardSlice.actions;
export default wardSlice.reducer;


import { WardService, Ward, CreateWardDto, UpdateWardDto } from '../../services/WardService';

interface WardState {
  wards: Ward[];
  currentWard: Ward | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: WardState = {
  wards: [],
  currentWard: null,
  isLoading: false,
  error: null,
};

export const fetchWards = createAsyncThunk('wards/fetchWards', async () => {
  return await WardService.getWards();
});

export const fetchWard = createAsyncThunk('wards/fetchWard', async (wardId: string) => {
  return await WardService.getWard(wardId);
});

export const createWard = createAsyncThunk(
  'wards/createWard',
  async (data: CreateWardDto) => {
    return await WardService.createWard(data);
  },
);

export const updateWard = createAsyncThunk(
  'wards/updateWard',
  async ({ wardId, data }: { wardId: string; data: UpdateWardDto }) => {
    return await WardService.updateWard(wardId, data);
  },
);

export const deleteWard = createAsyncThunk('wards/deleteWard', async (wardId: string) => {
  await WardService.deleteWard(wardId);
  return wardId;
});

export const uploadAvatar = createAsyncThunk(
  'wards/uploadAvatar',
  async ({ wardId, imageUri }: { wardId: string; imageUri: string }) => {
    return await WardService.uploadAvatar(wardId, imageUri);
  },
);

const wardSlice = createSlice({
  name: 'wards',
  initialState,
  reducers: {
    setCurrentWard: (state, action: PayloadAction<Ward | null>) => {
      state.currentWard = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch wards
      .addCase(fetchWards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wards = action.payload;
      })
      .addCase(fetchWards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch wards';
      })
      // Fetch ward
      .addCase(fetchWard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentWard = action.payload;
        // Update in wards list if exists
        const index = state.wards.findIndex((w) => w.id === action.payload.id);
        if (index >= 0) {
          state.wards[index] = action.payload;
        }
      })
      .addCase(fetchWard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch ward';
      })
      // Create ward
      .addCase(createWard.fulfilled, (state, action) => {
        state.wards.push(action.payload);
      })
      // Update ward
      .addCase(updateWard.fulfilled, (state, action) => {
        const index = state.wards.findIndex((w) => w.id === action.payload.id);
        if (index >= 0) {
          state.wards[index] = action.payload;
        }
        if (state.currentWard?.id === action.payload.id) {
          state.currentWard = action.payload;
        }
      })
      // Delete ward
      .addCase(deleteWard.fulfilled, (state, action) => {
        state.wards = state.wards.filter((w) => w.id !== action.payload);
        if (state.currentWard?.id === action.payload) {
          state.currentWard = null;
        }
      })
      // Upload avatar
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        const index = state.wards.findIndex((w) => w.id === action.payload.id));
        if (index >= 0) {
          state.wards[index] = action.payload;
        }
        if (state.currentWard?.id === action.payload.id) {
          state.currentWard = action.payload;
        }
      });
  },
});

export const { setCurrentWard, clearError } =ÿÿÿÿÿÿE E ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿE