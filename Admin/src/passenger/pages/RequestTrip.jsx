import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesome} from '@fortawesome/react-fontawesome';
import { faPalette, faTriangleExclamation, faChevronRight, faCheck } from '@fortawesome/free-solid-svg-icons';
import MapComponent from '../components/MapComponent';
import MapDesignModal from '../popups/MapDesignModal';
import TripPlannerPanel from '../components/trip/TripPlannerPanel';
import TripStatusPanel from '../components/trip/TripStatusPanel';
import { ACTIVE_TRIP_STATUSES, findNamedArea, updateStartPin, updateEndPin, addWaypoint, updateWaypoint, removeWaypoint, setRoute, saveTrip, removeSavedTrip, loadSavedTrip, requestTrip, acceptOffer, cancelTrip, completeTrip } from '../redux/reducers/tripSlice';
import { reverseGeocode, fetchRouteOptions, estimateFare, distanceMeters } from '../utils/geo';

/*
 * ملف RequestTrip مسؤول عن شاشة طلب الرحلة: اختيار البداية والنهاية،
 * حساب المسار، حفظ الرحلة، وإرسال الطلب إلى Redux.
 */
// PROXIMITY_LIMIT_M هو حد المسافة الذي عند تجاوزه نطلب من المستخدم توضيح سبب البعد عن نقطة البداية.
const PROXIMITY_LIMIT_M = 20;

/**
 * RequestTrip page
 * تستقبل بيانات التنقل من react-router (`useLocation`) وبيانات الرحلة من Redux (`useSelector`)
 * ثم تربطها مع الخريطة ولوحات التخطيط والحالة.
 */
const RequestTrip = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentTrip = useSelector(s => s.trip.currentTrip);
  const offers = useSelector(s => s.trip.offers);
  const namedAreas = useSelector(s => s.trip.namedAreas);
  const savedTrips = useSelector(s => s.trip.savedTrips);

  const [mapStyle, setMapStyle] = useState('dark');
  const [showMapDesign, setShowMapDesign] = useState(false);
  const [pickTarget, setPickTarget] = useState('start');
  const [resolving, setResolving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [routeOptions, setRouteOptions] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  const [proximity, setProximity] = useState({ distanceM: null, checking: false, failed: false, note: '' });
  const [showProximityNote, setShowProximityNote] = useState(false);
  const [showTooFarModal, setShowTooFarModal] = useState(false);

  // isActive يوضح لو في رحلة شغالة، ويتم اشتقاقه من Redux state ومن بارامز التنقل state?.editing.
  const isActive = ACTIVE_TRIP_STATUSES.includes(currentTrip.status) && !state?.editing;
  const coords = state?.coords;

  // isTripSaved يشتق من savedTrips داخل Redux لمعرفة هل الرحلة الحالية سبق حفظها أم لا.
  const isTripSaved = savedTrips?.some(saved => saved.startPin?.lat === currentTrip.startPin?.lat && saved.startPin?.lng === currentTrip.startPin?.lng && saved.endPin?.lat === currentTrip.endPin?.lat && saved.endPin?.lng === currentTrip.endPin?.lng);

  // resolvePinName تأخذ lat/lng من نقرة الخريطة أو coords القادمة من الصفحة السابقة ثم تحاول إيجاد اسم مناسب.
  const resolvePinName = useCallback(
    async (lat, lng) => {
      const area = findNamedArea(namedAreas, lat, lng);
      if (area?.name) return { name: area.name, unknown: false };
      const { localName } = await reverseGeocode(lat, lng);
      if (localName) return { name: localName, unknown: false };
      return { name: 'موقع محدد على الخريطة', unknown: true };
    },
    [namedAreas],
  );

  // لو الصفحة اتفتحت مع coords (جت من الـ Home بعد الضغط على اطلب رحلة جديدة) نعبي نقطة البداية تلقائياً
  // عند فتح الصفحة مع coords القادمة من صفحة Home نملأ نقطة البداية تلقائياً من تلك الإحداثيات.
  useEffect(() => {
    if (isActive || currentTrip.startPin || !coords) return;
    let active = true;
    resolvePinName(coords.lat, coords.lng).then(({ name }) => {
      if (active) {
        dispatch(updateStartPin({ lat: coords.lat, lng: coords.lng, name }));
      }
    });
    return () => {
      active = false;
    };
  }, [isActive, currentTrip.startPin, coords, dispatch, resolvePinName]);

  // عند وجود startPin و endPin نجلب route options من الخدمة الخارجية ونخزن أول خيار داخل Redux.
  useEffect(() => {
    if (isActive || !currentTrip.startPin || !currentTrip.endPin) return;
    const points = [currentTrip.startPin, ...currentTrip.waypoints, currentTrip.endPin];
    let active = true;
    setResolving(true);
    fetchRouteOptions(points).then(options => {
      if (!active) return;
      setRouteOptions(options);
      setSelectedRouteIndex(0);
      if (options[0]) dispatch(setRoute({ ...options[0], price: estimateFare(options[0].distanceKm) }));
      setResolving(false);
    });
    return () => {
      active = false;
    };
  }, [currentTrip.startPin, currentTrip.endPin, currentTrip.waypoints, isActive, dispatch]);

  // هذا الـ effect يقيس المسافة بين موقع الجهاز ونقطة الانطلاق اعتمادًا على geolocation في المتصفح.
  useEffect(() => {
    if (isActive || !currentTrip.startPin) {
      setProximity({ distanceM: null, checking: false, failed: false, note: '' });
      return;
    }
    if (!navigator.geolocation) {
      setProximity(p => ({ ...p, distanceM: null, checking: false, failed: true }));
      return;
    }
    let active = true;
    setProximity(p => ({ ...p, checking: true, failed: false }));
    navigator.geolocation.getCurrentPosition(
      pos => {
        if (!active) return;
        const d = distanceMeters({ lat: pos.coords.latitude, lng: pos.coords.longitude }, currentTrip.startPin);
        setProximity(p => ({ ...p, distanceM: d, checking: false, failed: false }));
      },
      () => {
        if (!active) return;
        setProximity(p => ({ ...p, distanceM: null, checking: false, failed: true }));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
    return () => {
      active = false;
    };
  }, [currentTrip.startPin, isActive]);

  // handlePick تستقبل latlng من MapComponent عند النقر على الخريطة ثم تحدد هل النقطة بداية أو نهاية أو waypoint.
  const handlePick = useCallback(
    async latlng => {
      if (!pickTarget) return;
      const target = pickTarget;
      const { name } = await resolvePinName(latlng.lat, latlng.lng);
      const pin = { lat: latlng.lat, lng: latlng.lng, name };

      if (target === 'start') {
        dispatch(updateStartPin(pin));
      } else if (target === 'end') {
        dispatch(updateEndPin(pin));
      } else if (target?.waypoint) {
        if (typeof target.index === 'number') {
          dispatch(updateWaypoint({ index: target.index, pin }));
        } else {
          dispatch(addWaypoint(pin));
        }
      }
    },
    [pickTarget, dispatch, resolvePinName],
  );
  // handleSelectPlace تستقبل target ('start' | 'end' | waypoint target) و pin جاهز من نتيجة البحث
  const handleSelectPlace = (target, pin) => {
    if (target === 'start') dispatch(updateStartPin(pin));
    else if (target === 'end') dispatch(updateEndPin(pin));
    else if (target?.waypoint) {
      if (typeof target.index === 'number') dispatch(updateWaypoint({ index: target.index, pin }));
      else dispatch(addWaypoint(pin));
    }
  };

  // اختيار خيار المسار من اللستة
  // handleSelectRouteOption يستقبل index من TripPlannerPanel ويبدل route المختار من القائمة المحلية routeOptions.
  const handleSelectRouteOption = index => {
    setSelectedRouteIndex(index);
    const chosen = routeOptions[index];
    if (chosen) dispatch(setRoute({ ...chosen, price: estimateFare(chosen.distanceKm) }));
  };

  // حفظ أو حذف رحلة محفوظة
  // handleToggleSaveTrip لا يستقبل بارامز مباشرة، ويعتمد على currentTrip و savedTrips من Redux لتحديد الحفظ أو الحذف.
  const handleToggleSaveTrip = () => {
    if (isTripSaved) {
      const savedTrip = savedTrips.find(t => t.startPin.lat === currentTrip.startPin.lat && t.endPin.lat === currentTrip.endPin.lat);
      if (savedTrip) dispatch(removeSavedTrip(savedTrip.id));
    } else {
      dispatch(saveTrip({ startPin: currentTrip.startPin, endPin: currentTrip.endPin, waypoints: currentTrip.waypoints }));
    }
  };

  const shortestRouteIndex = routeOptions.length > 1 ? routeOptions.reduce((minI, opt, i, arr) => (opt.distanceKm < arr[minI].distanceKm ? i : minI), 0) : 0;
  const showRouteOptions = routeOptions.length > 1 && shortestRouteIndex !== 0;

  const isFarFromPickup = proximity.distanceM !== null && proximity.distanceM > PROXIMITY_LIMIT_M;
  const proximityNeedsNote = isFarFromPickup || proximity.failed;

  // handleConfirmRequest تستقبل opts من TripPlannerPanel عند الضغط على زر تأكيد الطلب.
  const handleConfirmRequest = (opts = {}) => {
    // 1. فحص النقط
    console.log('Current Trip State:', currentTrip);

    if (!currentTrip.startPin || !currentTrip.endPin) {
      console.error('خطأ: النقاط ناقصة!');
      alert('برجاء تحديد نقطة البداية ونقطة الوصول أولاً!');
      return;
    }

    // 2. فحص المسافة (Proximity)
    if (proximityNeedsNote && !showProximityNote) {
      console.log('يجب كتابة ملاحظة للمسافة');
      setShowProximityNote(true);
      return;
    }

    if (proximityNeedsNote && showProximityNote && !proximity.note.trim()) {
      console.error('خطأ: يجب كتابة سبب للمسافة');
      alert('من فضلك اكتب سبباً لوجودك بعيداً عن نقطة البداية!');
      return;
    }

    // 3. الطلب
    console.log('جاري طلب الرحلة...');
    setRequesting(true);

    // تمرير بيانات الجدولة، الملاحظات، وعدد الركاب إلى الريدوكس
    dispatch(
      requestTrip({
        ...currentTrip,
        scheduledTime: opts.scheduledTime || null,
        customerNote: opts.customerNote || null,
        passengerCount: opts.passengerCount || 1,
      }),
    );

    setRequesting(false);

    // 4. إظهار بوبوب النجاح — الاستمرار لغاية ضغط العميل على "اذهب للرئيسية"
    setShowRequestSuccess(true);
  };

  // حالة عرض بوبوب نجاح الطلب
  const [showRequestSuccess, setShowRequestSuccess] = useState(false);

  return (
    <div className='w-full h-screen flex flex-col bg-zinc-950 relative overflow-hidden'>
      {showTooFarModal && (
        <div className='fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-fade-in' dir='rtl'>
          <div className='w-full max-w-sm bg-zinc-900 border border-zinc-700/50 rounded-3xl p-6 flex flex-col items-center gap-4 text-center'>
            <div className='w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-3xl mb-2'>
              <FontAwesomeicon={faTriangleExclamation} />
            </div>
            <h3 className='text-lg font-bold text-white'>نقطة الانطلاق بعيدة جداً!</h3>
            <p className='text-sm text-zinc-400'>عذراً، نقطة الانطلاق التي حددتها تبعد عن موقعك الحالي بأكثر من 1000 كيلومتر. لا يمكنك طلب رحلة من هذه المسافة.</p>
            <button onClick={() => setShowTooFarModal(false)} className='w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl py-3 mt-2 transition-colors'>
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}

      {showRequestSuccess && (
        <div className='fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-fade-in' dir='rtl'>
          <div className='w-full max-w-sm bg-zinc-900 border border-zinc-700/50 rounded-3xl p-6 flex flex-col items-center gap-4 text-center'>
            <div className='w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl mb-2'>
              <FontAwesomeicon={faCheck} />
            </div>
            <h3 className='text-lg font-bold text-white'>تم إرسال طلب الرحلة</h3>
            <p className='text-sm text-zinc-400'>طلبك اتعرض على السواقين القريبين منك وسيتم التواصل لاحقًا.</p>
            <div className='flex gap-2 w-full'>
              <button
                onClick={() => {
                  setShowRequestSuccess(false);
                  navigate('/');
                }}
                className='flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 mt-2 transition-colors'>
                اذهب للرئيسية
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='flex-1 relative'>
        <MapComponent startPin={currentTrip.startPin} endPin={currentTrip.endPin} waypoints={currentTrip.waypoints} routeCoords={currentTrip.route?.coordinates} pickTarget={isActive ? null : pickTarget} onPick={handlePick} mapStyle={mapStyle} />

        <button onClick={() => navigate(-1)} className='absolute top-4 left-4 z-30 w-11 h-11 rounded-full bg-zinc-900 border border-zinc-700/50 text-white hover:bg-zinc-800 flex items-center justify-center shadow-lg transition-colors'>
          <FontAwesomeicon={faChevronRight} className='rotate-180' />
        </button>

        <button onClick={() => setShowMapDesign(true)} className='absolute top-4 right-4 z-30 w-11 h-11 rounded-full bg-zinc-900 border border-zinc-700/50 text-emerald-400 hover:bg-zinc-800 flex items-center justify-center shadow-lg transition-colors'>
          <FontAwesomeicon={faPalette} />
        </button>

        <MapDesignModal isOpen={showMapDesign} onClose={() => setShowMapDesign(false)} onSelectDesign={setMapStyle} currentDesign={mapStyle} />

        {!isActive ? <TripPlannerPanel onSelectPlace={handleSelectPlace} trip={currentTrip} pickTarget={pickTarget} onSetPickTarget={setPickTarget} onRemoveWaypoint={i => dispatch(removeWaypoint(i))} onConfirm={handleConfirmRequest} resolving={resolving} requesting={requesting} routeOptions={routeOptions} selectedRouteIndex={selectedRouteIndex} shortestRouteIndex={shortestRouteIndex} showRouteOptions={showRouteOptions} onSelectRouteOption={handleSelectRouteOption} proximity={proximity} showProximityNote={showProximityNote} onProximityNoteChange={note => setProximity(p => ({ ...p, note }))} savedTrips={savedTrips} isTripSaved={isTripSaved} onToggleSaveTrip={handleToggleSaveTrip} onLoadSavedTrip={saved => dispatch(loadSavedTrip(saved))} onRemoveSavedTrip={id => dispatch(removeSavedTrip(id))} /> : <TripStatusPanel trip={currentTrip} offers={currentTrip.status === 'pending' ? offers : []} onAccept={offer => dispatch(acceptOffer(offer))} onCancel={() => dispatch(cancelTrip())} onFinish={() => dispatch(completeTrip())} />}
      </div>
    </div>
  );
};

export default RequestTrip;
