/*
 * ملف clientSlice يمثل بيانات العملاء الافتراضية داخل Redux، ويُستخدم كحاوية
 * لبيانات الحسابات أو الحالات المتعلقة بالعميل.
 */
import { createSlice } from "@reduxjs/toolkit";

// initialState عبارة عن مصفوفة عملاء تجريبية تستخدمها الواجهة عند الحاجة لعرض بيانات جاهزة.
const initialState = [
	{
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
			sent: [],
			received: []
		},
		reports: {
			sent: [
				{ id: "r_01", tripId: "trip_001", driverId: "d_50", reason: "تأخر السائق عن الموعد المحدد", attachment: "https://via.placeholder.com/150" },
				{ id: "r_02", tripId: "trip_002", driverId: "d_62", reason: "السائق كان غير مهذب", attachment: "https://via.placeholder.com/150" }
			],
			received: []
		},
	},
];
// clientSlice هنا مجرد هيكل بيانات حاليًا، لذلك reducers فارغة لأن التعديل يتم من slices أخرى.
const clientSlice = createSlice({
	name: "client",
	initialState,
	reducers: {

	}
});
export const { updateClientInfo, addFavorite, removeFavorite, updateFavorite } = clientSlice.actions;
export default clientSlice.reducer;