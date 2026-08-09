export const TOUR_IDS = {
	APP_GLOBAL: 'appGlobalTour',
	TRIP_REQUEST: 'tripRequestTour',
	PROFILE: 'profileTour',
} as const;

export type TourId = (typeof TOUR_IDS)[keyof typeof TOUR_IDS];

export type TourStep = {
	id: string;
	order: number;
	targetId: string;
	title: string;
	description: string;
	placement?: 'auto' | 'top' | 'bottom';
};

export const TOUR_STORAGE_KEYS: Record<TourId, string> = {
	[TOUR_IDS.APP_GLOBAL]: 'hasSeenAppTour',
	[TOUR_IDS.TRIP_REQUEST]: 'hasSeenTripRequestTour',
	[TOUR_IDS.PROFILE]: 'hasSeenProfileTour',
};

export const TOUR_DEFINITIONS: Record<TourId, TourStep[]> = {
	[TOUR_IDS.APP_GLOBAL]: [
		{
			id: 'wallet',
			order: 1,
			targetId: 'wallet',
			title: 'المحفظة',
			description: 'من هنا تراجع الرصيد وتفتح شاشة الشحن أو التحويل بسرعة.',
			placement: 'auto',
		},
		{
			id: 'leaderboard',
			order: 2,
			targetId: 'leaderboard',
			title: 'النشاط الأسبوعي',
			description: 'هنا تشوف ترتيبك بين المستخدمين هذا الأسبوع من حيث عدد الرحلات المكتمله .',
			placement: 'auto',
		},
	],
	[TOUR_IDS.TRIP_REQUEST]: [
		{
			id: 'startPin',
			order: 1,
			targetId: 'startPin',
			title: 'نقطة الانطلاق',
			description: 'ابدأ باختيار المكان اللي هتتحرك منه، أو حدده مباشرة من الخريطة ويمكنك البحث باسم المكان.',
			placement: 'auto',
		},
		{
			id: 'endPin',
			order: 2,
			targetId: 'endPin',
			title: 'نقطة الوصول',
			description: 'بعدها اختار الوجهة النهائية علشان نحسب المسار كامل.',
			placement: 'auto',
		},
		{
			id: 'addWaypoint',
			order: 3,
			targetId: 'addWaypoint',
			title: 'إضافة نقطة وسيطة',
			description: 'استخدمها لو محتاج تمر على محطة إضافية قبل الوجهة.',
			placement: 'auto',
		},
		{
			id: 'mapStyle',
			order: 4,
			targetId: 'mapStyle',
			title: 'شكل الخريطة',
			description: 'من هنا تبدّل بين الخريطة العادية والقمر الصناعي والتصميمات الأخرى.',
			placement: 'auto',
		},
		{
			id: 'saveTrip',
			order: 5,
			targetId: 'saveTrip',
			title: 'حفظ الرحلة',
			description: 'احفظ المسار لو عايز ترجع له بسرعة من المفضلة لاحقًا.',
			placement: 'auto',
		},
		{
			id: 'timingNow',
			order: 6,
			targetId: 'timingNow',
			title: 'الانطلاق الآن',
			description: 'اختارها لو عايز الرحلة تبدأ فاقرب وقت ممكن.',
			placement: 'auto',
		},
		{
			id: 'timingLater',
			order: 7,
			targetId: 'timingLater',
			title: 'حجز موعد لاحق',
			description: 'اختارها لو محتاج تحجز الرحلة لوقت محدد بعدين خلال 12 ساعة.',
			placement: 'auto',
		},
		{
			id: 'vehicleCategory',
			order: 8,
			targetId: 'vehicleCategory',
			title: 'الفئة والسعر',
			description: 'اختار الفئة المناسبة وشوف السعر المبدئي قبل الإرسال.',
			placement: 'auto',
		},
		{
			id: 'confirmTrip',
			order: 9,
			targetId: 'confirmTrip',
			title: 'إرسال الطلب',
			description: 'اضغط هنا لما تخلص المراجعة عشان تبعت طلب الرحلة.',
			placement: 'auto',
		},
	],
	[TOUR_IDS.PROFILE]: [
		{
		id: 'profileEdit',
		order: 1,
		targetId: 'profileEdit',
		title: 'عدّل بياناتك',
		description: 'دوس هنا لو عايز تغيّر صورتك أو أي بيانات بتاعتك.',
		placement: 'auto',
	},
	{
		id: 'profileCard',
		order: 2,
		targetId: 'profileCard',
		title: 'دي بياناتك',
		description: 'اسمك ورقمك وإيميلك وعدد رحلاتك، كله هنا في مكان واحد.',
		placement: 'auto',
	},
	{
		id: 'profileReputation',
		order: 3,
		targetId: 'profileReputation',
		title: 'سمعتك في التطبيق',
		description: 'النسبة دي بتقولك حالتك عندنا، وبتقل لو حد بلّغ عليك وتأكد البلاغ أو لغيت رحلة كتير.',
		placement: 'auto',
	},
	{
		id: 'profileTabs',
		order: 4,
		targetId: 'profileTabs',
		title: 'كل حاجة تخصك هنا',
		description: 'من هنا تقدر توصل للبلاغات، تقييماتك، الكوبونات، وكود الدعوة بتاعك.',
		placement: 'auto',
	},
	],
};
