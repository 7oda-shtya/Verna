import React from 'react'
import { FontAwesome} from '@fortawesome/react-fontawesome'
import { faLocationCrosshairs, faTriangleExclamation, faSpinner } from '@fortawesome/free-solid-svg-icons'

/*
 * ملف ShareLocationModal يعرض طلب السماح بالموقع أو تخطيه قبل بدء رحلة جديدة.
 */
const ShareLocationModal = ({ status, onAllow, onSkip, onClose }) => {
  // status يأتي من Navigation ويحدد ما إذا كان الطلب جارٍ أو مرفوضًا.
  const isRequesting = status === 'requesting'
  const isDenied = status === 'denied'

  return (
    <div className='fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-fade-in' dir='rtl'>
      <div className='w-full max-w-sm bg-zinc-900 border border-zinc-700/50 rounded-3xl p-6 flex flex-col items-center gap-4 shadow-2xl'>
        <div
          className={`h-16 w-16 rounded-full flex items-center justify-center shadow-[0_0_25px_-5px] ${
            isDenied ? 'bg-red-500/15 text-red-400 shadow-red-500/40' : 'bg-emerald-500/15 text-emerald-400 shadow-emerald-500/40'
          }`}
        >
          <FontAwesomeicon={isDenied ? faTriangleExclamation : faLocationCrosshairs} className='text-2xl' />
        </div>

        <div className='text-center'>
          <h2 className='text-base font-bold mb-1'>{isDenied ? 'تعذر الوصول لموقعك' : 'شارك موقعك الحالي'}</h2>
          <p className='text-sm text-zinc-400 leading-relaxed'>
            {isDenied
              ? 'تم رفض صلاحية الموقع. فعّلها من إعدادات المتصفح لتحديد نقطة انطلاقك بدقة، أو استمر بدون تحديد الموقع.'
              : 'نحتاج إلى صلاحية الموقع لتحديد نقطة انطلاق رحلتك بدقة وعرض أقرب السائقين إليك.'}
          </p>
        </div>

        <button
          onClick={onAllow}
          disabled={isRequesting}
          className='w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 rounded-2xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors'
        >
          <FontAwesomeicon={isRequesting ? faSpinner : faLocationCrosshairs} className={isRequesting ? 'animate-spin' : ''} />
          {isRequesting ? 'جارِ تحديد الموقع...' : isDenied ? 'حاول مرة أخرى' : 'تفعيل الموقع'}
        </button>

        <button
          onClick={onSkip}
          disabled={isRequesting}
          className='w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-60 rounded-2xl py-3 text-sm font-medium text-zinc-300 transition-colors'
        >
          الاستمرار بدون تحديد الموقع
        </button>

        <button onClick={onClose} className='text-xs text-zinc-500 hover:text-zinc-300 mt-1'>
          إلغاء
        </button>
      </div>
    </div>
  )
}

export default ShareLocationModal
