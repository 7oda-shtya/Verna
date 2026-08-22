import React from 'react'
import { useNavigate } from 'react-router-dom'

/*
 * ملف DriverSignUp يوضح للسائق أن التقديم يتم عبر المكتب الإداري وليس من داخل التطبيق.
 */
function DriverSignUpMessage() {
	// navigate يأتي من react-router ويستخدم للانتقال إلى الشاشات المرتبطة بالتسجيل.
	const navigate = useNavigate()
	return (
		<div className='flex flex-col items-center justify-center h-screen bg-gradient-to-b from-green-500 to-green-600 p-4'>
			<div className='bg-white rounded-lg shadow-lg p-8 w-full max-w-md'>
				<button
					onClick={() => navigate('/driver/sign-in')}
					className='text-gray-600 hover:text-gray-800 mb-6 flex items-center'
				>
					← رجوع
				</button>

				<div className='text-center'>
					<div className='text-6xl mb-4'>🚕</div>

					<h1 className='text-3xl font-bold text-gray-800 mb-4'>
						التقديم كسائق
					</h1>

					<div className='bg-blue-50 border-l-4 border-blue-500 p-4 mb-6'>
						<p className='text-gray-700 font-semibold mb-2'>
							⚠️ معلومات مهمة
						</p>
						<p className='text-gray-600 text-sm leading-relaxed'>
							لتصبح سائقًا على منصتنا، يجب عليك زيارة المكتب الإداري شخصيًا.
							سيقوم فريق الإدارة بمراجعة طلبك ووثائقك للتحقق من أهليتك وضمان
							سلامة المنصة.
						</p>
					</div>

					<div className='bg-green-50 border-l-4 border-green-500 p-4 mb-6'>
						<p className='text-gray-700 font-semibold mb-2'>
							✓ المستندات المطلوبة
						</p>
						<ul className='text-gray-600 text-sm text-left space-y-2'>
							<li>• رخصة قيادة سارية</li>
							<li>• تسجيل المركبة</li>
							<li>• وثيقة التأمين</li>
							<li>• بطاقة هوية سارية</li>
							<li>• معلومات الاتصال</li>
						</ul>
					</div>

					<div className='space-y-3'>
						<button
							onClick={() => navigate('/')}
							className='w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200'
						>
							عرض مواقع المكتب الإداري
						</button>

						<button
							onClick={() => navigate('/driver/sign-in')}
							className='w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-4 rounded-lg transition duration-200'
						>
							العودة إلى تسجيل الدخول
						</button>
					</div>

					<p className='text-xs text-gray-500 mt-6'>
						بعد الموافقة على طلبك في المكتب الإداري، ستتلقى
						رسالة بالبريد الإلكتروني تحتوي على بيانات الدخول للوصول
						إلى لوحة تحكم السائق.
					</p>
				</div>
			</div>
		</div>
	)
}

export default DriverSignUpMessage
