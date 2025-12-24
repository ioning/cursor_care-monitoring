import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthService } from '../../services/AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  } | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await AuthService.login(credentials.email, credentials.password);
      await AsyncStorage.setItem('token', response.accessToken);
      await AsyncStorage.setItem('refreshToken', response.refreshToken);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('refreshToken');
  await AuthService.logout();
});

export const checkAuth = createAsyncThunk('auth/checkAuth', async () => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    try {
      const userData = await AuthService.getCurrentUser();
      const user = (userData as any)?.data || userData;
      return { user, token };
    } catch (error) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      throw error;
    }
  }
  throw new Error('No token found');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.token = action.payload.token;
        // getCurrentUser возвращает { success: true, data: { id, email, ... } } или напрямую user объект
        const userData = action.payload.user?.data || action.payload.user;
        state.user = userData ? {
          id: userData.id,
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role,
        } : null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;

