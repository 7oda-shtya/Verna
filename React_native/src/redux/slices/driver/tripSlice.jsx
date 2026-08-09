import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { cancelOfferRequest, getActiveTripRequest, getAvailableTripsRequest, makeOfferRequest } from '../../../api/driver.api';

const getError = error => error.response?.data?.message || 'تعذر إتمام العملية، حاول مرة أخرى';

export const fetchAvailableTrips = createAsyncThunk('driverTrip/fetchAvailableTrips', async (_, { rejectWithValue }) => {
  try { return (await getAvailableTripsRequest()).data.data || []; }
  catch (error) { return rejectWithValue(getError(error)); }
});

export const fetchActiveTrip = createAsyncThunk('driverTrip/fetchActiveTrip', async (_, { rejectWithValue }) => {
  try { return (await getActiveTripRequest()).data.data || null; }
  catch (error) { return rejectWithValue(getError(error)); }
});

export const makeOffer = createAsyncThunk('driverTrip/makeOffer', async ({ tripId, ...offer }, { rejectWithValue, getState }) => {
  try {
    const trip = getState().trip.availableTrips.find(item => item.id === tripId) || null;
    const data = (await makeOfferRequest(tripId, offer)).data.data;
    return { tripId, trip, offer: data.offer || data, activeTrips: data.trips || [] };
  } catch (error) { return rejectWithValue(getError(error)); }
});

export const cancelOffer = createAsyncThunk('driverTrip/cancelOffer', async (offerId, { rejectWithValue }) => {
  try { await cancelOfferRequest(offerId); return offerId; }
  catch (error) { return rejectWithValue(getError(error)); }
});

const tripSlice = createSlice({
  name: 'driverTrip',
  initialState: { availableTrips: [], offers: [], activeTrip: null, activeTripLoaded: false, activeTripLoading: false, loading: false, error: null },
  reducers: {
    setActiveTrip: (state, action) => {
      const known = state.availableTrips.find(trip => trip.id === action.payload?.id) || state.offers.find(offer => offer.tripId === action.payload?.id)?.trip;
      state.activeTrip = { ...known, ...action.payload, status: action.payload?.status || known?.status || 'BOOKED' };
    },
    clearActiveTrip: state => { state.activeTrip = null; },
    clearTripError: state => { state.error = null; },
    upsertAvailableTrip: (state, action) => {
      const trip = action.payload;
      const index = state.availableTrips.findIndex(item => item.id === trip.id);
      if (index === -1) state.availableTrips.unshift(trip);
      else state.availableTrips[index] = { ...state.availableTrips[index], ...trip };
    },
    removeAvailableTrip: (state, action) => {
      state.availableTrips = state.availableTrips.filter(trip => trip.id !== action.payload);
    },
  },
  extraReducers: builder => builder
    .addCase(fetchAvailableTrips.pending, state => { state.loading = true; state.error = null; })
    .addCase(fetchAvailableTrips.fulfilled, (state, action) => { state.loading = false; state.availableTrips = action.payload; })
    .addCase(fetchAvailableTrips.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
    .addCase(fetchActiveTrip.pending, state => { state.activeTripLoading = true; })
    .addCase(fetchActiveTrip.fulfilled, (state, action) => {
      state.activeTripLoading = false;
      state.activeTripLoaded = true;
      if (action.payload) state.activeTrip = action.payload;
    })
    .addCase(fetchActiveTrip.rejected, (state, action) => { state.activeTripLoading = false; state.activeTripLoaded = true; state.error = action.payload; })
    .addCase(makeOffer.fulfilled, (state, action) => {
      const offer = action.payload.offer;
      state.offers.unshift({ ...offer, tripId: action.payload.tripId, trip: action.payload.trip });
      state.availableTrips = state.availableTrips.filter(trip => trip.id !== action.payload.tripId);
      const acceptedTrip = action.payload.activeTrips.find(trip => trip.id === action.payload.tripId);
      if (acceptedTrip) state.activeTrip = acceptedTrip;
    })
    .addCase(makeOffer.rejected, (state, action) => { state.error = action.payload; })
    .addCase(cancelOffer.fulfilled, (state, action) => { state.offers = state.offers.filter(offer => offer.id !== action.payload); }),
});

export const { setActiveTrip, clearActiveTrip, clearTripError, upsertAvailableTrip, removeAvailableTrip } = tripSlice.actions;
export default tripSlice.reducer;
