/*
 * ملف tripSlice مسؤول عن إدارة حالة الرحلة الحالية، الرحلات المحفوظة،
 * سجل الرحلات، واقتراح أسماء المناطق داخل Redux.
 */
import { createSlice } from '@reduxjs/toolkit';
import { distanceMeters } from '../../utils/geo';

// الحالات اللي تعتبر "رحلة شغالة" - تُستخدم داخل الواجهات لمنع بدء رحلة جديدة أثناء وجود رحلة فعالة.
export const ACTIVE_TRIP_STATUSES = ['pending', 'ongoing'];

// نطاق المنطقة المسماة - يُستخدم مع findNamedArea لتجميع النقاط القريبة تحت نفس الاسم.
export const NAMED_AREA_RADIUS_M = 20;

// يبحث في namedAreas عن منطقة قريبة من الإحداثيات القادمة من الخريطة أو من reverse geocode.
export const findNamedArea = (namedAreas, lat, lng) => namedAreas.find(area => distanceMeters(area, { lat, lng }) <= area.radiusM) || null;

// ينشئ شكل الرحلة الفارغ الذي تعتمد عليه الواجهات عند بدء الطلب أو عند مسح الرحلة الحالية.
const emptyTrip = () => ({
  id: null,
  clientId: null,
  driverId: null,
  driverName: null,
  car: null,
  startPin: null,
  endPin: null,
  waypoints: [],
  route: null, // { coordinates, distanceKm, durationMin, price } - جاي من OSRM
  status: 'idle', // idle | pending | ongoing | completed | cancelled
  price: 0,
  ridersCount: 1,
  createdAt: null,
  startTime: null,
});

// يحول بيانات الرحلة الحالية إلى عنصر تاريخي، ويُستدعى من cancelTrip و completeTrip داخل نفس السلايس.
const toHistoryEntry = (trip, status) => ({
  id: trip.id || `trip_${Date.now()}`,
  clientId: trip.clientId,
  startPin: trip.startPin,
  endPin: trip.endPin,
  waypoints: trip.waypoints,
  driverName: trip.driverName,
  car: trip.car,
  price: trip.price,
  distanceKm: trip.route?.distanceKm,
  durationMin: trip.route?.durationMin,
  date: new Date().toLocaleDateString('ar-EG'),
  time: new Date().toLocaleTimeString('ar-EG'),
  status,
});

// الحالة الابتدائية للسلايس، وتُستخدم مباشرة عند تحميل التطبيق لأول مرة قبل أي dispatch.
const initialState = {
  currentTrip: emptyTrip(),
  savedTrips: [
    // هنا سيتم حفظ الرحلات
  ],
  // أسماء المناطق المقترحة من اليوزرز - لحد ما يبقى فيه لوحة أدمن تدير اللستة دي رسميًا
  namedAreas: [
    // { id, lat, lng, radiusM: 20, name, suggestions: [{ name, at }] }
  ],
  offers: [
    { id: 'o_1', driverId: 'd_50', driverName: 'أحمد منصور', price: 50, rate: 4.8, car: 'فيرنا فيراني', timeToReach: '4 دقائق', startTime: '3:05 PM' },
    { id: 'o_2', driverId: 'd_62', driverName: 'إسلام علوان', price: 55, rate: 4.9, car: 'لانوس بيضاء', timeToReach: '6 دقائق', startTime: '3:15 PM' },
  ],
  history: [
    { id: 'trip_098', clientId: 'a_01', startPin: { name: 'ميدان رمسيس', lat: 30.0444, lng: 31.2357 }, endPin: { name: 'مدينة نصر', lat: 30.1211, lng: 31.3452 }, waypoints: [], driverName: 'أحمد منصور', car: 'فيرنا فيراني', price: 45, date: '2024-06-12', time: '3:30 PM', status: 'completed' },
    { id: 'trip_095', clientId: 'a_01', startPin: { name: 'المعادي', lat: 29.9561, lng: 31.22 }, endPin: { name: 'وسط البلد', lat: 30.0611, lng: 31.2446 }, waypoints: [], driverName: 'إسلام علوان', car: 'لانوس بيضاء', price: 38, date: '2024-06-09', time: '11:10 AM', status: 'completed' },
    { id: 'trip_090', clientId: 'a_01', startPin: { name: 'الدقي', lat: 30.0794, lng: 31.1997 }, endPin: { name: 'مدينة نصر', lat: 30.1211, lng: 31.3452 }, waypoints: [], driverName: 'محمود سعيد', car: 'تويوتا كورولا', price: 0, date: '2024-06-02', time: '8:00 PM', status: 'cancelled' },
  ],
};

// tripSlice يجمع reducers التي تستقبل action.payload من dispatch في الواجهة وتحدث حالة الرحلة.
const tripSlice = createSlice({
  name: 'trip',
  initialState,
  reducers: {
    // updateStartPin يستقبل pin من dispatch(updateStartPin(pin)) ويخزن نقطة البداية في currentTrip.
    updateStartPin: (state, action) => {
      state.currentTrip.startPin = action.payload;
    },
    // updateEndPin يستقبل pin من dispatch(updateEndPin(pin)) ويخزن نقطة النهاية في currentTrip.
    updateEndPin: (state, action) => {
      state.currentTrip.endPin = action.payload;
    },
    // addWaypoint يستقبل pin من dispatch(addWaypoint(pin)) ويضيفه إلى waypoints.
    addWaypoint: (state, action) => {
      state.currentTrip.waypoints.push(action.payload);
    },
    // updateWaypoint يستقبل { index, pin } من dispatch(updateWaypoint(...)) ليبدّل محطة محددة.
    updateWaypoint: (state, action) => {
      const { index, pin } = action.payload;
      state.currentTrip.waypoints[index] = pin;
    },
    // removeWaypoint يستقبل index من dispatch(removeWaypoint(index)) ويحذف المحطة المقابلة.
    removeWaypoint: (state, action) => {
      state.currentTrip.waypoints.splice(action.payload, 1);
    },
    // clearWaypoints لا يستقبل بارامز ويصفّر قائمة المحطات بالكامل.
    clearWaypoints: state => {
      state.currentTrip.waypoints = [];
    },
    // setRoute يستقبل route object من fetchRouteOptions في الواجهة ويحفظه داخل currentTrip.
    setRoute: (state, action) => {
      state.currentTrip.route = action.payload;
    },
    // saveTrip يستقبل trip data من الواجهة ثم يحولها إلى سجل محفوظ داخل savedTrips.
    saveTrip: (state, action) => {
      const newTrip = {
        ...action.payload,
        id: `saved_${Date.now()}`,
        createdAt: new Date().toLocaleString('ar-EG'),
        status: 'saved',
      };
      state.savedTrips.unshift(newTrip);
    },
    // removeSavedTrip يستقبل id من الواجهة ليحذف الرحلة المطابقة من savedTrips.
    removeSavedTrip: (state, action) => {
      state.savedTrips = state.savedTrips.filter(t => t.id !== action.payload);
    },
    // loadSavedTrip يستقبل trip كاملة من الواجهة ويعيد نسخها إلى currentTrip.
    loadSavedTrip: (state, action) => {
      const saved = action.payload;
      state.currentTrip.startPin = saved.startPin;
      state.currentTrip.endPin = saved.endPin;
      state.currentTrip.waypoints = saved.waypoints || [];
      state.currentTrip.route = null;
    },
    // suggestAreaName يستقبل { lat, lng, name } من الواجهة أو reverse geocode لتسجيل اسم منطقة مقترح.
    suggestAreaName: (state, action) => {
      const { lat, lng, name } = action.payload;
      const trimmedName = name.trim();
      if (!trimmedName) return;
      const existing = findNamedArea(state.namedAreas, lat, lng);
      if (existing) {
        existing.suggestions.push({ name: trimmedName, at: new Date().toLocaleString('ar-EG') });
        if (!existing.name) existing.name = trimmedName;
      } else {
        state.namedAreas.push({
          id: `area_${Date.now()}`,
          lat,
          lng,
          radiusM: NAMED_AREA_RADIUS_M,
          name: trimmedName,
          suggestions: [{ name: trimmedName, at: new Date().toLocaleString('ar-EG') }],
        });
      }
    },

    /*
     * requestTrip reducer
      * يتلقى بيانات الطلب من الـ UI عبر dispatch(requestTrip(payload)) ويحوّل currentTrip إلى pending.
     * ويخزن حقولًا إضافية مهمة:
     * - scheduledTime: حقل ISO datetime لو المستخدم حدد موعد لاحق
     * - customerNote: ملاحظات للمسؤول/السائق
     * - passengerCount: عدد الركاب المطلوب
     */
    requestTrip: (state, action) => {
      const { clientId, price, startTime, pickupDistanceM, farFromPickupNote, scheduledTime, customerNote, passengerCount } = action.payload;

      state.currentTrip = {
        ...state.currentTrip,
        status: 'pending',
        id: `TRIP_${Date.now()}`,
        clientId: clientId,
        price: price,
        // وقت الطلب (نص الوقت المعروض) ووقت الإنشاء بصيغة ISO
        requestedStartTime: startTime || new Date().toLocaleTimeString('ar-EG'),
        createdAt: new Date().toISOString(),
        pickupDistanceM: pickupDistanceM,
        farFromPickupNote: farFromPickupNote,
        scheduledTime: scheduledTime || null,
        customerNote: customerNote || null,
        passengerCount: passengerCount || state.currentTrip.ridersCount || 1,
      };

      // تفريغ العروض القديمة استعدادًا لطلبات العروض الجديدة
      state.offers = [];
    },

    // acceptOffer يستقبل offer من شاشة العروض ويربط بيانات السائق بالرحلة الحالية.
    acceptOffer: (state, action) => {
      const offer = action.payload;
      state.currentTrip = {
        ...state.currentTrip,
        driverId: offer.driverId,
        driverName: offer.driverName,
        car: offer.car,
        price: offer.price,
        status: 'ongoing',
      };
    },

    /*
     * cancelTrip reducer
      * يُستدعى من الواجهة عند الإلغاء بدون بارامز، ويضيف الرحلة الحالية إلى history كـ cancelled.
     * ثم نعيد `currentTrip` إلى القيمة الفارغة (emptyTrip)
     */
    cancelTrip: state => {
      if (state.currentTrip.startPin) {
        state.history.unshift(toHistoryEntry(state.currentTrip, 'cancelled'));
      }
      state.currentTrip = emptyTrip();
    },

    // completeTrip لا يستقبل بارامز ويحوّل الرحلة الحالية إلى completed ثم يفرغ currentTrip.
    completeTrip: state => {
      state.history.unshift(toHistoryEntry(state.currentTrip, 'completed'));
      state.currentTrip = emptyTrip();
    },

    // addTripToHistory يستقبل عنصر history جاهز من خارج السلايس ويضيفه مباشرة في البداية.
    addTripToHistory: (state, action) => {
      state.history.unshift(action.payload);
    },

    // clearCurrentTrip لا يستقبل بارامز ويعيد currentTrip إلى الشكل الفارغ.
    clearCurrentTrip: state => {
      state.currentTrip = emptyTrip();
    },
  },
});

export const { updateStartPin, updateEndPin, addWaypoint, updateWaypoint, removeWaypoint, clearWaypoints, setRoute, saveTrip, removeSavedTrip, loadSavedTrip, suggestAreaName, requestTrip, acceptOffer, cancelTrip, completeTrip, addTripToHistory, clearCurrentTrip } = tripSlice.actions;

export default tripSlice.reducer;
