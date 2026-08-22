import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FontAwesome} from '@fortawesome/react-fontawesome'
import { faChevronRight, faCamera } from '@fortawesome/free-solid-svg-icons'
import { updateClientInfo } from '../redux/reducers/authSlice'

/*
 * ملف ClientEditProfile يتيح تعديل بيانات العميل الأساسية والصورة الشخصية.
 */
const EditProfile = () => {
	const navigate = useNavigate()
	const dispatch = useDispatch()
	const client = useSelector((state) => state.auth || {})

	const [form, setForm] = useState({
		name: client.name || '',
		phone: client.phone || '',
		email: client.email || '',
		homeAddress: client.homeAddress || '',
	})
	const [avatarPreview, setAvatarPreview] = useState(client.avatar)
	const [saved, setSaved] = useState(false)

	// handleChange يستقبل event من الحقول النصية ويحدث form محليًا بالقيم الجديدة.
	const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

	// handleAvatarChange يستقبل file input event ويحوّل الصورة إلى preview محلي.
	const handleAvatarChange = (e) => {
		const file = e.target.files?.[0]
		if (file) setAvatarPreview(URL.createObjectURL(file))
	}

	// handleSave يستقبل submit event من الفورم ثم يرسل updateClientInfo إلى Redux.
	const handleSave = (e) => {
		e.preventDefault()
		dispatch(updateClientInfo({ ...form, avatar: avatarPreview }))
		setSaved(true)
		setTimeout(() => navigate('/profile'), 800)
	}

	return (
		<div className='min-h-screen w-full bg-gradient-to-b from-gray-800 to-gray-900 text-white relative flex flex-col p-4 pt-20 pb-10' dir='rtl'>
			<header className='fixed top-0 left-0 right-0 p-4 z-40 flex items-center gap-4 bg-gray-800/80 backdrop-blur-md'>
				<button onClick={() => navigate(-1)} className='w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center'>
					<FontAwesomeicon={faChevronRight} />
				</button>
				<h1 className='text-lg font-bold'>تعديل الملف الشخصي</h1>
			</header>

			<div className='flex flex-col items-center gap-3 mt-4 mb-6'>
				<div className='relative'>
					<img className='w-24 h-24 rounded-full border-2 border-zinc-700 object-cover' src={avatarPreview} alt='avatar' />
					<label className='absolute bottom-0 right-0 bg-emerald-500 p-2.5 rounded-full text-xs shadow-md active:scale-95 transition-all cursor-pointer'>
						<FontAwesomeicon={faCamera} />
						<input type='file' accept='image/*' className='hidden' onChange={handleAvatarChange} />
					</label>
				</div>
			</div>

			<form onSubmit={handleSave} className='flex flex-col gap-4'>
				<div>
					<label className='block text-zinc-400 text-xs mb-1.5'>الاسم</label>
					<input name='name' value={form.name} onChange={handleChange} className='w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500' required />
				</div>
				<div>
					<label className='block text-zinc-400 text-xs mb-1.5'>رقم الهاتف</label>
					<input name='phone' value={form.phone} onChange={handleChange} className='w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500' required />
				</div>
				<div>
					<label className='block text-zinc-400 text-xs mb-1.5'>البريد الإلكتروني</label>
					<input type='email' name='email' value={form.email} onChange={handleChange} className='w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500' required />
				</div>
				<div>
					<label className='block text-zinc-400 text-xs mb-1.5'>العنوان</label>
					<input name='homeAddress' value={form.homeAddress} onChange={handleChange} className='w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500' />
				</div>

				<button type='submit' className='mt-2 w-full bg-emerald-600 hover:bg-emerald-500 rounded-xl py-3.5 font-bold transition-all active:scale-[0.99]'>
					{saved ? 'تم الحفظ ✓' : 'حفظ التعديلات'}
				</button>
			</form>
		</div>
	)
}

export default EditProfile