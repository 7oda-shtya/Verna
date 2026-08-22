import React from 'react'
import { FontAwesome} from '@fortawesome/react-fontawesome'
import { faTimes, faMap, faSatellite, faMountain, faMoon, faCheck } from '@fortawesome/free-solid-svg-icons'

/*
 * ملف MapDesignModal يعرض نافذة اختيار تصميم الخريطة ويرسل الاختيار إلى الصفحة الأب.
 */
const MapDesignModal = ({ isOpen, onClose, onSelectDesign, currentDesign }) => {
  if (!isOpen) return null

  const designs = [
    {
      id: 'standard',
      name: 'الخريطة العادية',
      icon: faMap,
      description: 'خريطة OpenStreetMap العادية',
      color: 'bg-blue-500'
    },
    {
      id: 'satellite',
      name: 'قمر صناعي',
      icon: faSatellite,
      description: 'صور قمرية فضائية',
      color: 'bg-purple-500'
    },
    {
      id: 'terrain',
      name: 'تضاريس',
      icon: faMountain,
      description: 'خريطة التضاريس والارتفاعات',
      color: 'bg-green-500'
    },
    {
      id: 'dark',
      name: 'الوضع الداكن',
      icon: faMoon,
      description: 'خريطة داكنة للرؤية الليلية',
      color: 'bg-gray-800'
    }
  ]

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4" dir="rtl">
      <div className="bg-zinc-900 border border-zinc-700/50 rounded-3xl shadow-2xl max-w-sm w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-700/40">
          <h2 className="text-base font-bold text-white">اختر تصميم الخريطة</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition"
          >
            <FontAwesomeicon={faTimes} />
          </button>
        </div>

        {/* Design Options */}
        <div className="p-4 space-y-2.5">
          {designs.map((design) => (
            <button
              key={design.id}
              onClick={() => {
                onSelectDesign(design.id)
                onClose()
              }}
              className={`w-full p-3 rounded-2xl border transition flex items-center gap-3 ${
                currentDesign === design.id
                  ? 'border-emerald-500/60 bg-emerald-500/10'
                  : 'border-zinc-700/40 hover:border-zinc-600'
              }`}
            >
              {/* Icon */}
              <div className={`${design.color} text-white p-3 rounded-xl flex items-center justify-center w-11 h-11 shrink-0`}>
                <FontAwesomeicon={design.icon} />
              </div>

              {/* Text */}
              <div className="text-right flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">{design.name}</h3>
                <p className="text-[11px] text-zinc-400 truncate">{design.description}</p>
              </div>

              {/* Checkmark */}
              {currentDesign === design.id && (
                <FontAwesomeicon={faCheck} className="text-emerald-400 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MapDesignModal
