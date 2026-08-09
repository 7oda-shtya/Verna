import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/client/themeSlice';
import libraryReducer from './slices/client/librarySlice';
import { libraryApi } from './services/libraryApi';
const isDriverApp = process.env.APP_VARIANT === 'driver';
// Both variants expose the same store keys; only their domain reducers differ.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const authReducer = isDriverApp ? require('./slices/driver/authSlice').default : require('./slices/client/authSlice').default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tripReducer = isDriverApp ? require('./slices/driver/tripSlice').default : require('./slices/client/tripSlice').default;

const store = configureStore({
  reducer: {
    auth: authReducer,
    trip: tripReducer,
    theme: themeReducer,
    library: libraryReducer,
    [libraryApi.reducerPath]: libraryApi.reducer,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(libraryApi.middleware),
});

export default store;
