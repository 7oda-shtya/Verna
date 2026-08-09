import {
	DEFAULT_THEME_NAME,
	DesertMocha,
	NightRide,
	VernaDark,
	VernaLight,
} from './colors'

export const THEME_IDS = Object.freeze({
	VERNA_DARK: 'VernaDark',
	VERNA_LIGHT: 'VernaLight',
	NIGHT_RIDE: 'NightRide',
	DESERT_MOCHA: 'DesertMocha',
})

const withDisplayMetadata = (theme, label) => Object.freeze({
	...theme,
	id: theme.name,
	label,
	isDark: theme.mode === 'dark',
	statusBarStyle: theme.mode === 'dark' ? 'light' : 'dark',
})

export const THEMES = Object.freeze({
	[THEME_IDS.VERNA_DARK]: withDisplayMetadata(VernaDark, 'الوضع الداكن'),
	[THEME_IDS.VERNA_LIGHT]: withDisplayMetadata(VernaLight, 'الوضع الفاتح'),
	[THEME_IDS.NIGHT_RIDE]: withDisplayMetadata(NightRide, 'الوضع الليلي'),
	[THEME_IDS.DESERT_MOCHA]: withDisplayMetadata(DesertMocha, 'الوضع الصحراوي'),
})

export const THEME_LIST = Object.freeze([
	THEMES[THEME_IDS.VERNA_DARK],
	THEMES[THEME_IDS.VERNA_LIGHT],
	THEMES[THEME_IDS.NIGHT_RIDE],
	THEMES[THEME_IDS.DESERT_MOCHA],
])

export const DEFAULT_THEME_ID = DEFAULT_THEME_NAME

export default THEMES
