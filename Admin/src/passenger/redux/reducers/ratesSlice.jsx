/*
 * ملف ratesSlice مسؤول عن قائمة التقييمات الخاصة بالتطبيق، سواء كانت صادرة
 * من السائق أو العميل.
 */
import { createSlice } from '@reduxjs/toolkit'


// initialState يوفّر قائمة تقييمات تجريبية يتم عرضها في الواجهات المرتبطة بالتقييمات.
const initialState = {
  ratesList: [
    {
      id: "r-1",
      rateerName: "الكابتن أحمد السويركي",
      rateerdId: "c_1", 
      tripId: "trip-101",
      date: "2026-06-21"
    },
    {
      id: "r-2",
      rateerName: "الكابتن محمد شتية",
      rateerdId: "c_1", 
      tripId: "trip-204",
      date: "2026-06-19"
    },
    {
      id: "r-3",
      rateerName: "الكابتن إبراهيم علي",
      rateerdId: "c_2", 
      tripId: "trip-300",
      comment: "العميل كان يتحدث بحدة.",
      date: "2026-06-15"
    }
  ]
}
console.log( new Date().toISOString().split('T')[0])

// ratesSlice يضيف أو يحذف تقييمات من ratesList بناءً على actions المرسلة من الواجهة.
const ratesSlice = createSlice({
  name: 'rates',
  initialState,
  reducers: {
	// addrate يستقبل بيانات التقييم من صفحة أو نموذج إدخال ويضيفها مع id وتاريخ جديدين.
    addrate: (state, action) => {
      const newrate = {
        id: `r_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        ...action.payload
      }
      state.ratesList.push(newrate)
    },
	// deleterate يستقبل id من الواجهة ويحذف التقييم المطابق من القائمة.
    deleterate: (state, action) => {
      state.ratesList = state.ratesList.filter(rate => rate.id !== action.payload)
    }
  }
})

export const { addrate, deleterate } = ratesSlice.actions
export default ratesSlice.reducer