import { createSlice } from "@reduxjs/toolkit";

// initialState يوفّر بيانات تجريبية جاهزة تُستخدم من الواجهة عند فتح التطبيق.
const initialState = {
	name: "عمرو محمد",
	phone: "01012345678",
	email: "omar.mohamed@example.com",
	homeAddress: "123 شارع التحرير، القاهرة، مصر",
	id: "a_01",
	old: 25,
	avatar: '/images/14.png',
	password: "********",
	wallet: 0,
	preferredTrips: [
		{
			from: { lat: 31.132, lng: 33.803, name: "ميدان الرفاعي - العريش" },
			to: { lat: 31.115, lng: 33.752, name: "جامعة سيناء - المساعيد" }
		},
	],
	favorites: [
		{ id: "fav_1", name: "المنزل", address: "123 شارع التحرير، القاهرة، مصر", type: "home" },
		{ id: "fav_2", name: "العمل", address: "مدينة نصر، القاهرة", type: "work" },
	],
	rates: {
		sent: [
			{ id: "rate_1", clientId: "c_99", driverId: "d_50", value: 5, comment: "سائق متعاون" },
			{ id: "rate_2", clientId: "c_99", driverId: "d_62", value: 4, comment: "خدمة جيدة" }
		],
		received: []
	},
	reports: {
		sent: [
			{ id: "r_01", tripId: "trip_001", driverId: "d_50", reason: "تأخر السائق عن الموعد المحدد", attachment: "https://via.placeholder.com/150" },
			{ id: "r_02", tripId: "trip_002", driverId: "d_62", reason: "السائق كان غير مهذب", attachment: "https://via.placeholder.com/150" }
		],
		received: [
			{ id: "report_1", clientId: "c_99", reason: "تأخر السائق عن الموعد المحدد", attachment: "https://via.placeholder.com/150", time: "2024-06-01 14:30" },
			{ id: "report_2", clientId: "c_99", reason: "السائق كان غير مهذب", attachment: "https://via.placeholder.com/150", time: "2024-06-01 14:30" }
		]
	}
};

// authSlice يضم reducers التي تأتي بياناتها من dispatch داخل صفحات العميل أو السائق.
const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		// updateClientInfo يستقبل كائن بيانات كامل من صفحة تعديل الملف الشخصي أو تسجيل الدخول.
		updateClientInfo: (state, action) => {
			Object.assign(state, action.payload)
		},
		// addFavorite يستقبل favorite من الواجهة ويضيفه إلى قائمة favorites.
		addFavorite: (state, action) => {
			state.favorites.push({ id: `fav_${Date.now()}`, ...action.payload })
		},
		// removeFavorite يستقبل id من الواجهة ويحذف المفضلة المطابقة.
		removeFavorite: (state, action) => {
			state.favorites = state.favorites.filter(f => f.id !== action.payload)
		},
		// updateFavorite يستقبل object يحتوي id وباقي الحقول من شاشة تعديل المفضلة.
		updateFavorite: (state, action) => {
			state.favorites = state.favorites.map(f => f.id === action.payload.id ? { ...f, ...action.payload } : f)
		},
		// Rate Management
		// addRate يستقبل rate من الواجهة ويضيفه إلى sent لأن مرسله هو العميل.
		addRate: (state, action) => {
			state.rates.sent.push({ id: `rate_${Date.now()}`, ...action.payload })
		},
		// receiveRate يستقبل rate من السائق أو من مزامنة خارجية ويضيفه إلى received.
		receiveRate: (state, action) => {
			state.rates.received.push({ id: `rate_${Date.now()}`, ...action.payload })
		},
		// Report Management
		// addReport يستقبل report من الواجهة ويضيفه إلى التقارير المرسلة من العميل.
		addReport: (state, action) => {
			state.reports.sent.push({ id: `r_${Date.now()}`, ...action.payload })
		},
		// receiveReport يستقبل تقريرًا واردًا ويخزنه داخل received.
		receiveReport: (state, action) => {
			state.reports.received.push({ id: `report_${Date.now()}`, ...action.payload })
		},
		// Sync rates and reports from driver slice
		// syncRatesFromDriver يستقبل rates object جاهز من driverSlice ويحدث نسخة auth منه.
		syncRatesFromDriver: (state, action) => {
			state.rates = { ...state.rates, ...action.payload }
		},
		// syncReportsFromDriver يستقبل reports object جاهز من driverSlice ويحدث نسخة auth منه.
		syncReportsFromDriver: (state, action) => {
			state.reports = { ...state.reports, ...action.payload }
		}
	}
});
export const { 
	updateClientInfo, 
	addFavorite, 
	removeFavorite, 
	updateFavorite,
	addRate,
	receiveRate,
	addReport,
	receiveReport,
	syncRatesFromDriver,
	syncReportsFromDriver
} = authSlice.actions;
export default authSlice.reducer;