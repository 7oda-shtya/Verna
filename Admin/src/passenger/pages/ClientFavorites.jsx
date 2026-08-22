import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FontAwesome} from '@fortawesome/react-fontawesome'
import { faChevronRight, faHouse, faBriefcase, faLocationDot, faTrash, faPlus, faPen } from '@fortawesome/free-solid-svg-icons'
import { addFavorite, removeFavorite, updateFavorite } from '../redux/reducers/authSlice'
import Navigation from '../components/Navigation'

/*
 * ملف ClientFavorites يدير قائمة المفضلات: إضافة، تعديل، وحذف الأماكن المحفوظة.
 */
// typeIcon يستقبل type من عنصر المفضلة ويحوّله إلى أيقونة مناسبة.
const typeIcon = (type) => (type === 'home' ? faHouse : type === 'work' ? faBriefcase : faLocationDot)

// Favorites يقرأ المفضلات من Redux ثم يربطها بنماذج الإضافة والتعديل والحذف.
const Favorites = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const favorites = useSelector((state) => state.auth?.favorites || [])
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', address: '' })
  const [editForm, setEditForm] = useState({ name: '', address: '' })
  const [editingId, setEditingId] = useState(null)
  const [deleteData, setDeleteData] = useState({ id: null, name: '' })

  // handleAdd يستقبل القيم من addForm الداخلية ثم يرسل favorite جديدًا إلى Redux.
  const handleAdd = () => {
    if (!addForm.name.trim() || !addForm.address.trim()) return
    dispatch(addFavorite({ ...addForm, type: 'custom' }))
    resetAddForm()
  }

  // handleUpdate يستقبل editForm و editingId من حالة المكوّن ثم يحدّث العنصر في Redux.
  const handleUpdate = () => {
    if (!editForm.name.trim() || !editForm.address.trim() || !editingId) return
    dispatch(updateFavorite({ id: editingId, ...editForm, type: 'custom' }))
    resetEditForm()
  }

  // openDeleteConfirm يستقبل id و name من بطاقة المفضلة المراد حذفها لفتح نافذة التأكيد.
  const openDeleteConfirm = (id, name) => {
    setDeleteData({ id, name })
    setShowDeleteConfirm(true)
  }

  // handleConfirmDelete يستخدم deleteData المخزن محليًا ثم يحذف المفضلة من Redux.
  const handleConfirmDelete = () => {
    if (deleteData.id) {
      dispatch(removeFavorite(deleteData.id))
      setShowDeleteConfirm(false)
      setDeleteData({ id: null, name: '' })
    }
  }

  // resetAddForm يعيد نموذج الإضافة لوضعه الافتراضي ويغلقه.
  const resetAddForm = () => {
    setAddForm({ name: '', address: '' })
    setShowAddForm(false)
  }

  // resetEditForm يعيد نموذج التعديل لوضعه الافتراضي ويغلقه.
  const resetEditForm = () => {
    setEditForm({ name: '', address: '' })
    setEditingId(null)
    setShowEditForm(false)
  }

  return (
    <div className='min-h-screen w-full bg-gradient-to-b from-gray-800 to-gray-900 text-white relative flex flex-col p-4 pt-20 pb-28' dir='rtl'>
      <header className='fixed top-0 left-0 right-0 p-4 z-40 flex items-center gap-4 bg-gray-800/80 backdrop-blur-md'>
        <button onClick={() => navigate(-1)} className='w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center'>
          <FontAwesomeicon={faChevronRight} />
        </button>
        <h1 className='text-lg font-bold'>المفضلة</h1>
      </header>

      <div className='flex flex-col gap-3 mt-2'>
        {favorites.length === 0 ? (
          <p className='text-zinc-400 text-sm text-center py-10'>لا توجد مفضلات حتى الآن</p>
        ) : (
          favorites.map((fav) => (
            <div key={fav.id} className='flex items-center gap-3 bg-zinc-800/70 border border-zinc-700/40 rounded-2xl p-4'>
              <div className='w-11 h-11 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0'>
                <FontAwesomeicon={typeIcon(fav.type)} />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='font-semibold'>{fav.name}</p>
                <p className='text-xs text-zinc-400 truncate'>{fav.address}</p>
              </div>
              
              <button
                onClick={() => openDeleteConfirm(fav.id, fav.name)}
                className='w-9 h-9 rounded-full bg-red-950/40 text-red-400 flex items-center justify-center active:scale-95 transition-all shrink-0'
              >
                <FontAwesomeicon={faTrash} className='text-xs' />
              </button>
              
              <button
                onClick={() => {
                  setEditForm({ name: fav.name, address: fav.address })
                  setEditingId(fav.id)
                  setShowEditForm(true)
                }}
                className='w-9 h-9 rounded-full bg-emerald-950/40 text-emerald-400 flex items-center justify-center active:scale-95 transition-all shrink-0'
              >
                <FontAwesomeicon={faPen} className='text-xs' />
              </button>
            </div>
          ))
        )}

        {showAddForm && (
          <div className='bg-zinc-800/70 border border-zinc-700/40 rounded-2xl p-4 flex flex-col gap-3'>
            <h3 className='text-xs font-semibold text-zinc-400 px-1'>إضافة مكان جديد</h3>
            <input
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              placeholder='اسم المكان (مثال: النادي)'
              className='bg-zinc-900 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500'
            />
            <input
              value={addForm.address}
              onChange={(e) => setAddForm((f) => ({ ...f, address: e.target.value }))}
              placeholder='العنوان بالتفصيل'
              className='bg-zinc-900 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500'
            />
            <div className='flex gap-2'>
              <button 
                onClick={handleAdd} 
                className='flex-1 bg-emerald-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-emerald-500 transition-colors'
              >
                حفظ
              </button>
              <button onClick={resetAddForm} className='flex-1 bg-zinc-700 rounded-xl py-2.5 text-sm hover:bg-zinc-600 transition-colors'>
                إلغاء
              </button>
            </div>
          </div>
        )}

        {showEditForm && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
            <div className='bg-zinc-800 rounded-2xl p-6 flex flex-col gap-4 w-11/12 max-w-sm'>
              <h3 className='text-lg font-semibold'>تعديل بيانات المكان</h3>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder='اسم المكان (مثال: النادي)'
                className='bg-zinc-900 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500'
              />
              <input
                value={editForm.address}
                onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                placeholder='العنوان بالتفصيل'
                className='bg-zinc-900 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500'
              />
              <div className='flex gap-2'>
                <button 
                  onClick={handleUpdate} 
                  className='flex-1 bg-emerald-600 rounded-xl py-3 text-sm font-semibold hover:bg-emerald-500 transition-colors'
                >
                  تعديل المكان
                </button>
                <button onClick={resetEditForm} className='flex-1 bg-zinc-700 rounded-xl py-3 text-sm hover:bg-zinc-600 transition-colors'>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
            <div className='bg-zinc-800 rounded-2xl p-6 flex flex-col gap-4 w-11/12 max-w-sm'>
              <h3 className='text-lg font-semibold'>تأكيد الحذف</h3>
              <p className='text-sm text-zinc-400'>هل أنت متأكد من حذف <span className='text-red-400 font-semibold'>"{deleteData.name}"</span> من المفضلة؟</p>
              <div className='flex gap-2'>
                <button 
                  onClick={handleConfirmDelete} 
                  className='flex-1 bg-red-600 rounded-xl py-3 text-sm font-semibold hover:bg-red-500 transition-colors'
                >
                  حذف
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)} 
                  className='flex-1 bg-zinc-700 rounded-xl py-3 text-sm hover:bg-zinc-600 transition-colors'
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {!showAddForm && !showEditForm && (
          <button
            onClick={() => {
              setAddForm({ name: '', address: '' })
              setShowAddForm(true)
            }}
            className='flex items-center justify-center gap-2 border-2 border-dashed border-zinc-700 text-zinc-400 rounded-2xl py-4 mt-1 active:scale-[0.99] transition-all'
          >
            <FontAwesomeicon={faPlus} />
            <span className='text-sm font-medium'>إضافة مكان جديد للمفضلة</span>
          </button>
        )}
      </div>

      <Navigation />
    </div>
  )
}

export default Favorites