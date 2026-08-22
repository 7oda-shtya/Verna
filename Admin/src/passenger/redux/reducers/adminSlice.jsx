/*
 * ملف adminSlice يمثل بيانات المسؤول الافتراضية داخل Redux.
 */
import { createSlice } from "@reduxjs/toolkit";

// initialState يوفّر بيانات مسؤول افتراضية تستخدمها الواجهة عند الحاجة.
const initialState = {
	name: "عبدالعزيز محمد",
	phone: "01098765432",
	username: "admin_aziz",
	E_mail:"admin@example.com",
	officeAddress: "شارع التحرير - القاهرة",
	password: "********",
};
// adminSlice حاليًا مجرد حاوية بيانات، لذلك reducers فارغة إلى أن تُضاف وظائف إدراة.
const adminSlice = createSlice({
	name: "admin",
	initialState,
	reducers: {

	}
});
export default adminSlice.reducer;