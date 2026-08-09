import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginRequest, registerRequest, getMeRequest, updateProfileRequest } from '../../../api/auth.api';

// بترجع رسالة واضحة تفرّق بين "مش قادر يوصل للسيرفر" و "السيرفر رد برفض"
const extractErrorMessage = error => {
  if (!error.response) {
    return 'مش قادر نوصل للسيرفر، اتأكد إن الباك شغال والـ IP صح';
  }
  return error.response.data?.message || 'حصل خطأ، حاول تاني';
};

const isDriverPendingReview = user => user?.role === 'DRIVER' && user.accountStatus === 'PENDING';

export const login = createAsyncThunk('auth/login', async ({ identifier, password }, { rejectWithValue }) => {
  try {
    const response = await loginRequest(identifier, password);
    const { token, user } = response.data.data;
    await SecureStore.setItemAsync('authToken', token);
    return { token, user, isDriverPendingReview: isDriverPendingReview(user) };
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error));
  }
});

export const register = createAsyncThunk('auth/register', async (formData, { rejectWithValue }) => {
  try {
    const response = await registerRequest(formData);
    const { token, user } = response.data.data;
    await SecureStore.setItemAsync('authToken', token);
    return { token, user, isDriverPendingReview: isDriverPendingReview(user) };
  } catch (error) {
    return rejectWithValue({
      message: extractErrorMessage(error),
      field: error.response?.data?.field || null, // مفيش response = مفيش field أصلاً، طبيعي
    });
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await SecureStore.deleteItemAsync('authToken');
  await AsyncStorage.removeItem('tripDraft');
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (formData, { rejectWithValue }) => {
  try {
    const response = await updateProfileRequest(formData);
    return response.data.data.user;
  } catch (error) {
    return rejectWithValue({
      message: extractErrorMessage(error),
      field: error.response?.data?.field || null,
    });
  }
});

export const restoreSession = createAsyncThunk('auth/restoreSession', async (_, { rejectWithValue }) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (!token) return rejectWithValue(null);
  try {
    const response = await getMeRequest();
    const { user } = response.data.data;
    return { token, user };
  } catch (_error) {
    await SecureStore.deleteItemAsync('authToken');
    return rejectWithValue(null);
  }
});

const initialState = {
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  sessionChecked: false,

  id: null,
  name: null,
  phone: null,
  email: null,
  role: null,
  avatar: null,
  homeAddress: null,
  officeAddress: null,
  old: null,
  wallet: 0,
  username: null,
  avgRating: null,
  accountStatus: null,
  isDriverPendingReview: false,
  isPhoneVerified: false,
  referralCode: null,
  createdAt: null,
  reputationScore: 100,
  reputationLabel: 'سمعة ممتازة',
  reputationUpdatedAt: null,
  reputationCompletedTrips: 0,
  reputationCancelledTrips: 0,
  reputationAcceptedReports: 0,
  isBanned: false,
  banReason: null,
  banStartAt: null,
  banEndAt: null,
  reputationBanEndAt: null,
  rapidCancelBanEndAt: null,

  coupons: [],
  rates: { sent: [], received: [] },
  reports: { sent: [], received: [] },
  referrals: [],

  favorites: [],
  rechargeRequests: [],
  rechargeRequestsLoaded: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    updateClientInfo: (state, action) => {
      Object.assign(state, action.payload);
    },
    clearAuthError: state => {
      state.error = null;
    },
    addFavorite: (state, action) => {
      state.favorites.push({ id: `fav_${Date.now()}`, ...action.payload });
    },
    removeFavorite: (state, action) => {
      state.favorites = state.favorites.filter(f => f.id !== action.payload);
    },
    updateFavorite: (state, action) => {
      state.favorites = state.favorites.map(f => (f.id === action.payload.id ? { ...f, ...action.payload } : f));
    },
    setRechargeRequests: (state, action) => {
      state.rechargeRequests = action.payload;
      state.rechargeRequestsLoaded = true;
    },
    addRechargeRequest: (state, action) => {
      state.rechargeRequests.unshift(action.payload);
      state.rechargeRequestsLoaded = true;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.isDriverPendingReview = action.payload.isDriverPendingReview;
        Object.assign(state, action.payload.user);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(register.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.isDriverPendingReview = isDriverPendingReview(action.payload.user);
        Object.assign(state, action.payload.user);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'حصل خطأ، حاول تاني';
      })
      .addCase(updateProfile.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, action.payload);
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'حصل خطأ، حاول تاني';
      })
      .addCase(logout.fulfilled, () => {
        return { ...initialState, sessionChecked: true };
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.isDriverPendingReview = isDriverPendingReview(action.payload.user);
        Object.assign(state, action.payload.user);
        state.sessionChecked = true;
      })
      .addCase(restoreSession.rejected, state => {
        state.sessionChecked = true;
      });
  },
});

export const {
  updateClientInfo,
  clearAuthError,
  addFavorite,
  removeFavorite,
  updateFavorite,
  setRechargeRequests,
  addRechargeRequest,
} = authSlice.actions;
export default authSlice.reducer;
