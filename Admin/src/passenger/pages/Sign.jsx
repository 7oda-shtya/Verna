import React from 'react'
import { useNavigate } from 'react-router-dom'

/*
 * ملف Sign هو شاشة اختيار الدور الأولى بين العميل والسائق قبل الدخول إلى التطبيق.
 */
function Sign() {
	// navigate يأتي من react-router ويستخدم للانتقال إلى صفحات تسجيل الدخول المناسبة.
	const navigate = useNavigate()
	return (
		<div className='flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-500 to-blue-600 p-4'>
			<div className='bg-white rounded-lg shadow-lg p-8 w-full max-w-md'>
				<h1 className='text-3xl font-bold text-center text-gray-800 mb-2'>
					مرحبًا بك في تطبيق تاكسي العاصمة
				</h1>
				<p className='text-center text-gray-600 mb-8'>
					يرجى اختيار دورك للمتابعة
				</p>

				<div className='space-y-4'>
					<button
						onClick={() => navigate('/client/sign-in')}
						className='w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-105'
					>
						🚗 أنا عميل
					</button>

					<button
						onClick={() => navigate('/driver/sign-in')}
						className='w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-105'
					>
						🚕 أنا سائق
					</button>
				</div>

				<p className='text-xs text-gray-500 text-center mt-6'>
					رحلتك تبدأ من هنا
				</p>
			</div>
		</div>
	)
}

export default Sign