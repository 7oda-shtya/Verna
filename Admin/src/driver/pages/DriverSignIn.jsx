import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/*
 * ملف DriverSignIn يعرض نموذج تسجيل دخول السائق ويجهز قيم البريد وكلمة المرور محليًا.
 */
function DriverSignIn() {
	const navigate = useNavigate()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	// handleSubmit يستقبل submit من الفورم ويستخدم email/password من حالة المكوّن.
	const handleSubmit = async (e) => {
		e.preventDefault()
		setLoading(true)
		setError('')

		try {
			// Add your driver sign-in API call here
			// const response = await signInDriver({ email, password })
			console.log('Driver Sign In:', { email, password })
			// Handle successful sign-in
		} catch (err) {
			setError('فشل تسجيل دخول السائق. يرجى التحقق من البيانات.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='flex flex-col items-center justify-center h-screen bg-gradient-to-b from-green-500 to-green-600 p-4'>
			<div className='bg-white rounded-lg shadow-lg p-8 w-full max-w-md'>
				<button
					onClick={() => navigate('/sign')}
					className='text-gray-600 hover:text-gray-800 mb-6 flex items-center'
				>
					← رجوع
				</button>

				<h1 className='text-3xl font-bold text-center text-gray-800 mb-2'>
					تسجيل دخول السائق
				</h1>
				<p className='text-center text-gray-600 mb-8'>
					مرحبًا! يرجى تسجيل الدخول إلى حساب السائق
				</p>

				{error && (
					<div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div>
						<label className='block text-gray-700 font-bold mb-2'>
							البريد الإلكتروني
						</label>
						<input
							type='email'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500'
							placeholder='example@email.com'
							required
						/>
					</div>

					<div>
						<label className='block text-gray-700 font-bold mb-2'>
							كلمة المرور
						</label>
						<input
							type='password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500'
							placeholder='••••••••'
							required
						/>
					</div>

					<button
						type='submit'
						disabled={loading}
						className='w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200'
					>
						{loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
					</button>
				</form>

				<div className='mt-6 text-center'>
					<p className='text-gray-600 mb-4'>
						ليس لديك حساب سائق؟
					</p>
					<button
						onClick={() => navigate('/driver/sign-up')}
						className='w-full bg-green-100 hover:bg-green-200 text-green-700 font-bold py-2 px-4 rounded-lg transition duration-200'
					>
						التقديم كسائق
					</button>
				</div>

				<div className='mt-4 text-center'>
					<button className='text-sm text-green-600 hover:text-green-700'>
						نسيت كلمة المرور؟
					</button>
				</div>
			</div>
		</div>
	)
}

export default DriverSignIn
