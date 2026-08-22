/*
 * ملف store يجمع كل Redux reducers في مكان واحد ويُستخدم كنقطة ربط رئيسية للتطبيق.
 */
import { configureStore } from "@reduxjs/toolkit";
import authReducer from './reducers/authSlice';
import adminReducer from './reducers/adminSlice';
import driverReducer from './reducers/driverSlice';
import tripReducer from './reducers/tripSlice';
import clientReducer from './reducers/clientSlice';

const store = configureStore({
  reducer: {
		auth: authReducer,
		admin: adminReducer,
		driver: driverReducer,
		trip: tripReducer,
		client: clientReducer,
	}
});

export default store;