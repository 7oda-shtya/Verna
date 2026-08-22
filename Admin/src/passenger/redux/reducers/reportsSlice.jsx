/*
 * ملف reportsSlice مسؤول عن قائمة البلاغات داخل التطبيق، ويضيف بلاغات جديدة
 * أو يعرض البلاغات الحالية في الواجهات الإدارية أو التشغيلية.
 */
import { createSlice } from '@reduxjs/toolkit'

// initialState يوفّر بلاغات تجريبية جاهزة للعرض في الصفحات التي تعتمد على reportsList.
const initialState = {
	reportsList: [
		{
			id: "rep-1",
			reporterId: "d_50",
			reportedId: "c_01",
			tripId: "trip-101",
			reason: "تأخير شديد عند الاستلام",
			date: "2026-06-21",
			attachment: "https://via.placeholder.com/150",
			status: "pending",
		},
		{
			id: "rep-2",
			reporterId: "d_50",
			reportedId: "c_01",
			tripId: "trip-204",
			reason: "إلغاء الرحلة بعد الوصول",
			date: "2026-06-19",
			attachment: "https://via.placeholder.com/150",
			status: "pending",
		},
		{
			id: "rep-3",
			reporterId: "d_50",
			reportedId: "c_02",
			tripId: "trip-300",
			reason: "سلوك غير لائق",
			date: "2026-06-15",
			attachment: "https://via.placeholder.com/150",
			status: "pending",
		}
	]
}

// reportsSlice يجمّع reducers الخاصة بإضافة البلاغات إلى reportsList.
const reportsSlice = createSlice({
	name: 'reports',
	initialState,
	reducers: {
		// addReport يستقبل report من الواجهة ويضيفه مع id وتاريخ جديدين.
		addReport: (state, action) => {
			const newReport = {
				id: `rep-${Date.now()}`,
				date: new Date().toISOString().split('T')[0],
				...action.payload
			}
			state.reportsList.push(newReport)
		},
	}
})

export const { addReport, deleteReport } = reportsSlice.actions
export default reportsSlice.reducer