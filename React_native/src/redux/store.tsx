import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/client/authSlice';
import tripReducer from './slices/client/tripSlice';
import ratesReducer from './slices/client/ratesSlice';
import reportReducer from './slices/client/reportsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    trip: tripReducer,
    rates: ratesReducer,
    reports: reportReducer,
  },
});

export default store;
