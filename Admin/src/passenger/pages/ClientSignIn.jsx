import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'


function ClientSignIn() {
	const navigate = useNavigate()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	/*
	 * ملف ClientSignIn يعرض نموذج تسجيل دخول العميل ويجهز قيم البريد وكلمة المرور محليًا.
	 */
	const handleSubmit = async (e) => {
		e.preventDefault()
		setLoading(true)
		setError('')

		try {
			console.log('Client Sign In:', { email, password })
		// handleSubmit يستقبل حدث submit من الفورم ويستخدم email/password من حالة المكوّن.
		} catch (err) {
			setError('فشل تسجيل الدخول. يرجى التحقق من البيانات.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-500 to-blue-600 p-4'>
			<div className='bg-white rounded-lg shadow-lg p-8 w-full max-w-md'>
				<button
					onClick={() => navigate('/sign')}
					className='text-gray-600 hover:text-gray-800 mb-6 flex items-center'
				>
					← رجوع
				</button>

				<h1 className='text-3xl font-bold text-center text-gray-800 mb-2'>
					تسجيل دخول 
				</h1>
				<p className='text-center text-gray-600 mb-8'>
					مرحبًا بعودتك! يرجى تسجيل الدخول إلى حسابك
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
							className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
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
							className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
							placeholder='يجب أن تتكون من 8 أحرف على الأقل'
							required
						/>
					</div>

					<button
						type='submit'
						disabled={loading}
						className='w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200'
					>
						{loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
					</button>
				</form>

				<div className='mt-6 text-center'>
					<p className='text-gray-600'>
						ليس لديك حساب؟{' '}
						<button
							onClick={() => navigate('/client/sign-up')}
							className='text-blue-500 hover:text-blue-600 font-bold'
						>
							إنشاء حساب
						</button>
					</p>
				</div>

				<div className='mt-4 text-center'>
					<button className='text-sm text-blue-500 hover:text-blue-600'>
						نسيت كلمة المرور؟
					</button>
				</div>
			</div>
		</div>
	)
}

export default ClientSignIn
