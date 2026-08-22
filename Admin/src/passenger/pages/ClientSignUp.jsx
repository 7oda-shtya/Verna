import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/*
 * ملف ClientSignUp يعرض نموذج إنشاء حساب جديد للعميل مع التحقق الأساسي من البيانات.
 */
function ClientSignUp() {
	const navigate = useNavigate()
	const [formData, setFormData] = useState({
		fullName: '',
		email: '',
		password: '',
		confirmPassword: '',
		phone: '',
	})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState(false)

	// handleChange يستقبل حدث input change ويحدّث الحقل المقابل داخل formData.
	const handleChange = (e) => {
		const { name, value } = e.target
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}))
	}

	// handleSubmit يستقبل submit من الفورم ويقرأ formData من state للتحقق وإنشاء الحساب.
	const handleSubmit = async (e) => {
		e.preventDefault()
		setLoading(true)
		setError('')

		// Validation
		if (formData.password !== formData.confirmPassword) {
			setError('كلمات المرور غير متطابقة')
			setLoading(false)
			return
		}

		if (formData.password.length < 6) {
			setError('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل')
			setLoading(false)
			return
		}

		try {
			// Add your sign-up API call here
			// const response = await signUpClient(formData)
			console.log('Client Sign Up:', formData)
			setSuccess(true)
			// Handle successful sign-up - maybe redirect after delay
			setTimeout(() => {
				// Redirect to sign in or home page
			}, 2000)
		} catch (err) {
			setError('فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.')
		} finally {
			setLoading(false)
		}
	}

	if (success) {
		return (
			<div className='flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-500 to-blue-600 p-4'>
				<div className='bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center'>
					<div className='text-5xl mb-4'>✓</div>
					<h1 className='text-3xl font-bold text-green-600 mb-2'>
						تم إنشاء الحساب!
					</h1>
					<p className='text-gray-600 mb-6'>
						تم إنشاء حسابك بنجاح.
					</p>
					<button
						onClick={() => navigate('/client/sign-in')}
						className='w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg'
					>
						الانتقال إلى تسجيل الدخول
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className='flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-500 to-blue-600 p-4 py-8'>
			<div className='bg-white rounded-lg shadow-lg p-8 w-full max-w-md'>
				<button
					onClick={() => navigate('/sign')}
					className='text-gray-600 hover:text-gray-800 mb-6 flex items-center'
				>
					← رجوع
				</button>

				<h1 className='text-3xl font-bold text-center text-gray-800 mb-2'>
					تسجيل حساب جديد 
				</h1>
				<p className='text-center text-gray-600 mb-8'>
					أنشئ حسابك وابدأ رحلتك
				</p>

				{error && (
					<div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div>
						<label className='block text-gray-700 font-bold mb-2'>
							الاسم الكامل
						</label>
						<input
							type='text'
							name='fullName'
							value={formData.fullName}
							onChange={handleChange}
							className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
							placeholder='الاسم الكامل'
							required
						/>
					</div>

					<div>
						<label className='block text-gray-700 font-bold mb-2'>
							البريد الإلكتروني
						</label>
						<input
							type='email'
							name='email'
							value={formData.email}
							onChange={handleChange}
							className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
							placeholder='example@email.com'
							required
						/>
					</div>

					<div>
						<label className='block text-gray-700 font-bold mb-2'>
							رقم الجوال
						</label>
						<input
							type='tel'
							name='phone'
							value={formData.phone}
							onChange={handleChange}
							className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
							placeholder='+966 5xxxxxxxx'
							required
						/>
					</div>

					<div>
						<label className='block text-gray-700 font-bold mb-2'>
							كلمة المرور
						</label>
						<input
							type='password'
							name='password'
							value={formData.password}
							onChange={handleChange}
							className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
							placeholder='••••••••'
							required
						/>
					</div>

					<div>
						<label className='block text-gray-700 font-bold mb-2'>
							تأكيد كلمة المرور
						</label>
						<input
							type='password'
							name='confirmPassword'
							value={formData.confirmPassword}
							onChange={handleChange}
							className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
							placeholder='••••••••'
							required
						/>
					</div>

					<button
						type='submit'
						disabled={loading}
						className='w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200'
					>
						{loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
					</button>
				</form>

				<div className='mt-6 text-center'>
					<p className='text-gray-600'>
						هل لديك حساب بالفعل؟{' '}
						<button
							onClick={() => navigate('/client/sign-in')}
							className='text-blue-500 hover:text-blue-600 font-bold'
						>
							تسجيل الدخول
						</button>
					</p>
				</div>
			</div>
		</div>
	)
}

export default ClientSignUp
