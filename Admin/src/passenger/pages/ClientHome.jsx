import React from 'react';
import { useSelector, useDispatch } from 'react-redux'; // Hook عشان نقرأ الداتا من الستور و Hook عشان ننفذ الأكشنز
import { useNavigate } from 'react-router-dom'; // للتنقل بين الصفحات
import { FontAwesome} from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { cancelTrip } from '../redux/reducers/tripSlice'; // أكشن الإلغاء
import Navigation from '../components/Navigation'; // نافيجيشن بار
import Header from '../components/Header'; // الهيدر

/*
 * ملف ClientHome هو الصفحة الرئيسية للعميل، ويعرض حالة الرحلة الحالية
 * وزر إنشاء رحلة جديدة مع شريط التنقل السفلي.
 */
const ClientHome = () => {
  const dispatch = useDispatch(); // بنستخدمه عشان نبعت أمر "إلغاء الرحلة"
  const navigate = useNavigate(); // بنستخدمه عشان ننقل اليوزر لصفحة الخريطة

  // بنسحب بيانات الرحلة من الـ Redux
  const { currentTrip } = useSelector((state) => state.trip);
  
  // بنحدد هل فيه رحلة شغالة؟ (حالتها pending يعني لسه بتدور، أو ongoing يعني السواق ركب)
  const isTripActive = ["pending", "ongoing"].includes(currentTrip?.status);

  return (
    // min-h-screen بتخلي الصفحة واخدة طول الشاشة كله
    // flex flex-col بتخلي العناصر فوق بعض بالترتيب
    <div className="flex flex-col min-h-screen text-white">
      <Header />

      {/* الجزء ده بيمثل محتوى الصفحة اللي في النص */}
      {/* flex-1 بتخليه ياخد كل المساحة المتبقية بين الهيدر والنافيجيشن */}
      <main className="flex-1 flex flex-col p-4 pt-20">
        
        {isTripActive ? (
          // لو في رحلة شغالة، اعرض كارت الرحلة (قابل للضغط للانتقال لتفاصيل الرحلة)
          <div onClick={() => navigate('/request-trip')} className="bg-zinc-900 border border-emerald-500/30 rounded-3xl p-4 shadow-lg w-full cursor-pointer">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-bold">
                {currentTrip.status === "pending" ? "جاري البحث عن كابتن..." : "رحلتك الحالية"}
              </h2>
              <div className='flex items-center gap-2'>
                <button 
                  onClick={(e) => { e.stopPropagation(); dispatch(cancelTrip()); }} // وقف بابلينج عشان ميعملش ناڤيجيت
                  className="text-red-400 text-xs bg-red-950/30 px-3 py-1 rounded-full"
                >
                  إلغاء
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/request-trip', { state: { editing: true } }); }}
                  className='text-emerald-400 text-xs bg-emerald-950/10 px-3 py-1 rounded-full'
                >
                  تعديل
                </button>
              </div>
            </div>
            {/* ... بقية كود الرحلة ... */}
          </div>
        ) : (
          // لو مفيش رحلات، استخدمنا flex-1 مع items-center و justify-center عشان نجيب الرسالة والزرار في النص بالظبط
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <p className="text-zinc-500 text-sm">لا توجد رحلات نشطة حالياً</p>
            
            {/* زرار طلب رحلة جديدة - وده اللي كان غالباً ناقص عندك عشان اليوزر يعرف يبدأ */}
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    pos => navigate('/request-trip', { state: { coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } } }),
                    () => navigate('/request-trip'),
                    { enableHighAccuracy: true, timeout: 8000 },
                  );
                } else {
                  navigate('/request-trip');
                }
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-2xl font-bold transition-all"
            >
              <FontAwesomeicon={faPlus} />
              اطلب رحلة جديدة
            </button>
          </div>
        )}
      </main>

      <Navigation />
    </div>
  );
};

export default ClientHome;