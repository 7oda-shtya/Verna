import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMeRequest, loginRequest, registerRequest } from '../../../api/auth.api';
import { updateKycRequest } from '../../../api/driver.api';

const fallbackError = 'حدث خطأ، حاول مرة أخرى';

const errorMessage = error => error.response?.data?.message || (!error.response ? 'تعذر الاتصال بالخادم' : fallbackError);
const normalizeDriverUser = (raw) => {

	const car = raw.car ?? raw.included?.car ?? null;
	const { included, ...user } = raw;
	return {
		...user,
		car: car ? {
			model: car.model ?? null,
			plateNumber: car.plateNumber ?? null,
			picture: car.picture ?? null,
			licenseDocument: car.licenseDocument ?? null,
			seats: car.seats ?? null,
		} : null,
		driverLicense: raw.driverLicense ?? null,
		nationalIdFront: raw.nationalIdFront ?? null,
		nationalIdBack: raw.nationalIdBack ?? null,
		isDriverPendingReview: raw.role === 'DRIVER' && raw.accountStatus === 'PENDING',
		isBanned: raw.accountStatus === 'BANNED' || Boolean(raw.isBanned),
	};
};


const KYC_FILE_FIELDS = new Set(['license', 'carPicture', 'carLicense', 'nationalIdFront', 'nationalIdBack']);

export const login = createAsyncThunk('auth/login', async ({ identifier, password }, { rejectWithValue }) => {
	try {
		const response = await loginRequest(identifier, password);
		const { token, user } = response.data.data;
		await SecureStore.setItemAsync('authToken', token);
		return { token, user: normalizeDriverUser(user) };
	} catch (error) {
		return rejectWithValue(errorMessage(error));
	}
});

export const register = createAsyncThunk('auth/register', async (formData, { rejectWithValue }) => {
	try {
		const response = await registerRequest(formData);
		const { token, user } = response.data.data;
		await SecureStore.setItemAsync('authToken', token);
		return { token, user: normalizeDriverUser(user) };
	} catch (error) {
		return rejectWithValue({ message: errorMessage(error), field: error.response?.data?.field || null });
	}
});

export const restoreSession = createAsyncThunk('auth/restoreSession', async (_, { rejectWithValue }) => {
	const token = await SecureStore.getItemAsync('authToken');
	if (!token) return rejectWithValue(null);
	try {
		const response = await getMeRequest();
		return { token, user: normalizeDriverUser(response.data.data.user) };
	} catch {
		await SecureStore.deleteItemAsync('authToken');
		return rejectWithValue(null);
	}
});

export const logout = createAsyncThunk('auth/logout', async () => {
	await SecureStore.deleteItemAsync('authToken');
	await AsyncStorage.removeItem('tripDraft');
});

export const updateKyc = createAsyncThunk('auth/updateKyc', async (data, { rejectWithValue }) => {
	try {
		const formData = data instanceof FormData ? data : new FormData();
		if (!(data instanceof FormData)) {
			Object.entries(data).forEach(([key, value]) => {
				if (value == null) return;
				if (KYC_FILE_FIELDS.has(key) && value.uri) {
					formData.append(key, { uri: value.uri, type: value.mimeType || 'image/jpeg', name: value.fileName || `${key}.jpg` });
				} else formData.append(key, value);
			});
		}
		const response = await updateKycRequest(formData);
		return normalizeDriverUser({ ...response.data.data.user, car: response.data.data.car });
	} catch (error) {
		return rejectWithValue(errorMessage(error));
	}
});

const initialState = {
	token: null, isAuthenticated: false, loading: false, error: null, sessionChecked: false,
	id: null, name: null, phone: null, email: null, role: null, avatar: null, wallet: 0,
	username: null, avgRating: null, accountStatus: null, isDriverPendingReview: false,
	isPhoneVerified: false, referralCode: null, createdAt: null, car: null, driverLicense: null,
	nationalIdFront: null, nationalIdBack: null, isOnline: false,
	reputationScore: 100, reputationLabel: 'سمعة ممتازة', reputationUpdatedAt: null,
	reputationCompletedTrips: 0, reputationCancelledTrips: 0, reputationAcceptedReports: 0,
	isBanned: false, banReason: null, banStartAt: null, banEndAt: null,
	reputationBanEndAt: null, rapidCancelBanEndAt: null,
	rates: { sent: [], received: [] }, reports: { sent: [], received: [] }, referrals: [],
	rechargeRequests: [], rechargeRequestsLoaded: false,
};

const applyUser = (state, user) => Object.assign(state, normalizeDriverUser(user));

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		// This name deliberately matches the client slice so shared action creators keep working.
		updateClientInfo: (state, action) => applyUser(state, { ...state, ...action.payload }),
		clearAuthError: state => { state.error = null; },
		setRechargeRequests: (state, action) => { state.rechargeRequests = action.payload; state.rechargeRequestsLoaded = true; },
		addRechargeRequest: (state, action) => { state.rechargeRequests.unshift(action.payload); state.rechargeRequestsLoaded = true; },
	},
	extraReducers: builder => builder
		.addCase(login.pending, state => { state.loading = true; state.error = null; })
		.addCase(login.fulfilled, (state, action) => { state.loading = false; state.isAuthenticated = true; state.token = action.payload.token; applyUser(state, action.payload.user); })
		.addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
		.addCase(register.pending, state => { state.loading = true; state.error = null; })
		.addCase(register.fulfilled, (state, action) => { state.loading = false; state.isAuthenticated = true; state.token = action.payload.token; applyUser(state, action.payload.user); })
		.addCase(register.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || fallbackError; })
		.addCase(updateKyc.pending, state => { state.loading = true; state.error = null; })
		.addCase(updateKyc.fulfilled, (state, action) => { state.loading = false; applyUser(state, action.payload); })
		.addCase(updateKyc.rejected, (state, action) => { state.loading = false; state.error = action.payload || fallbackError; })
		.addCase(logout.fulfilled, () => ({ ...initialState, sessionChecked: true }))
		.addCase(restoreSession.fulfilled, (state, action) => { state.isAuthenticated = true; state.token = action.payload.token; applyUser(state, action.payload.user); state.sessionChecked = true; })
		.addCase(restoreSession.rejected, state => { state.sessionChecked = true; }),
});

export const { updateClientInfo, clearAuthError, setRechargeRequests, addRechargeRequest } = authSlice.actions;
export default authSlice.reducer;
