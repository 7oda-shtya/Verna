/**
 * Verna theme tokens
 *
 * Every theme exposes the same semantic contract. Components should consume
 * these names instead of checking whether the current theme is light or dark.
 */

const spacing = Object.freeze({
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	xxl: 32,
})

const radius = Object.freeze({
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	pill: 999,
})

// One subtle border system is shared by every theme. Only its semantic color
// changes, keeping cards and dividers visually consistent throughout the app.
const borderWidths = Object.freeze({
	none: 0,
	subtle: 1,
	focused: 1,
})

export const typography = Object.freeze({
	display: Object.freeze({ fontSize: 28, fontWeight: '800' }),
	title: Object.freeze({ fontSize: 20, fontWeight: '700' }),
	subtitle: Object.freeze({ fontSize: 15, fontWeight: '600' }),
	body: Object.freeze({ fontSize: 14, fontWeight: '400' }),
	caption: Object.freeze({ fontSize: 12, fontWeight: '500' }),
	tiny: Object.freeze({ fontSize: 11, fontWeight: '600' }),
})

const darkShadows = Object.freeze({
	card: Object.freeze({
		shadowColor: '#000000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.22,
		shadowRadius: 10,
		elevation: 5,
	}),
	floating: Object.freeze({
		shadowColor: '#000000',
		shadowOffset: { width: 0, height: 5 },
		shadowOpacity: 0.3,
		shadowRadius: 12,
		elevation: 8,
	}),
})

const lightShadows = Object.freeze({
	card: Object.freeze({
		shadowColor: '#000000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
		elevation: 4,
	}),
	floating: Object.freeze({
		shadowColor: '#0F172A',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 14,
		elevation: 4,
	}),
})

const makeComponentStyles = (palette, shadows) => Object.freeze({
	screen: Object.freeze({
		flex: 1,
		backgroundColor: palette.background,
	}),
	card: Object.freeze({
		backgroundColor: palette.surface,
		borderColor: palette.border,
		borderWidth: borderWidths.subtle,
		borderRadius: radius.lg,
		...shadows.card,
	}),
	cardElevated: Object.freeze({
		backgroundColor: palette.surfaceElevated,
		borderColor: palette.border,
		borderWidth: borderWidths.subtle,
		borderRadius: radius.lg,
		...shadows.card,
	}),
	avatar: Object.freeze({
		borderColor: palette.primary,
		borderWidth: 2,
		borderRadius: radius.pill,
	}),
	avatarSubtle: Object.freeze({
		borderColor: palette.border,
		borderWidth: borderWidths.subtle,
		borderRadius: radius.pill,
	}),
	modal: Object.freeze({
		backgroundColor: palette.surfaceElevated,
		borderColor: palette.border,
		borderWidth: borderWidths.subtle,
		borderRadius: radius.xl,
		...shadows.floating,
	}),
	bottomSheet: Object.freeze({
		backgroundColor: palette.surface,
		borderTopColor: palette.border,
		borderTopWidth: borderWidths.subtle,
		borderTopLeftRadius: radius.xl,
		borderTopRightRadius: radius.xl,
		...shadows.floating,
	}),
	input: Object.freeze({
		backgroundColor: palette.inputBackground,
		borderColor: palette.border,
		borderWidth: borderWidths.subtle,
		borderRadius: radius.md,
		color: palette.textPrimary,
		paddingHorizontal: spacing.lg,
	}),
	inputFocused: Object.freeze({
		backgroundColor: palette.inputBackground,
		borderColor: palette.borderFocused,
		borderWidth: borderWidths.focused,
		borderRadius: radius.md,
		color: palette.textPrimary,
		paddingHorizontal: spacing.lg,
	}),
	divider: Object.freeze({
		backgroundColor: palette.divider,
		height: borderWidths.subtle,
	}),
	primaryButton: Object.freeze({
		backgroundColor: palette.primary,
		borderColor: palette.primary,
		borderWidth: borderWidths.subtle,
		borderRadius: radius.lg,
	}),
	primaryButtonText: Object.freeze({
		color: palette.onPrimary,
		fontWeight: '700',
	}),
	secondaryButton: Object.freeze({
		backgroundColor: palette.primaryMuted,
		borderColor: palette.border,
		borderWidth: borderWidths.subtle,
		borderRadius: radius.lg,
	}),
	secondaryButtonText: Object.freeze({
		color: palette.primary,
		fontWeight: '700',
	}),
	bottomNavigation: Object.freeze({
		backgroundColor: palette.navigationBackground,
		borderColor: palette.border,
		borderWidth: borderWidths.subtle,
		borderRadius: radius.pill,
		...shadows.floating,
	}),
	floatingControl: Object.freeze({
		backgroundColor: palette.overlay,
		borderColor: palette.border,
		borderWidth: borderWidths.subtle,
		borderRadius: radius.pill,
		...shadows.floating,
	}),
})

const createTheme = ({ name, mode, palette, shadows }) => Object.freeze({
	name,
	mode,
	colors: Object.freeze(palette),
	spacing,
	radius,
	borderWidths,
	typography,
	shadows,
	components: makeComponentStyles(palette, shadows),
})

export const VernaDark = createTheme({
	name: 'VernaDark',
	mode: 'dark',
	shadows: darkShadows,
	palette: {
		background: '#121212',
		surface: '#1E1E1E',
		surfaceElevated: '#2C2C2C',
		inputBackground: '#242424',
		navigationBackground: 'rgba(30, 30, 30, 0.96)',
		overlay: 'rgba(30, 30, 30, 0.88)',
		backdrop: 'rgba(0, 0, 0, 0.58)',

		primary: '#00C853',
		primaryPressed: '#00A844',
		primaryMuted: 'rgba(0, 200, 83, 0.14)',
		onPrimary: '#052E16',

		textPrimary: '#F5F5F5',
		textSecondary: '#B3B3B3',
		textMuted: '#A0A0A0',
		textDisabled: '#737373',
		placeholder: '#8A8A8A',

		border: 'rgba(255, 255, 255, 0.08)',
		borderFocused: 'rgba(0, 200, 83, 0.72)',
		divider: 'rgba(255, 255, 255, 0.07)',

		iconActive: '#00C853',
		iconInactive: '#B3B3B3',
		iconOnPrimary: '#052E16',

		success: '#39D98A',
		info: '#5AC8FA',
		error: '#FF5C5C',
		errorMuted: 'rgba(255, 92, 92, 0.14)',
		warning: '#F6C453',
		warningMuted: 'rgba(246, 196, 83, 0.14)',
		rating: '#F6C453',
		danger: '#FF5C5C',
	},
})

export const VernaLight = createTheme({
	name: 'VernaLight',
	mode: 'light',
	shadows: lightShadows,
	palette: {
		background: '#F1F5F9',
		surface: '#FFFFFF',
		surfaceElevated: '#FFFFFF',
		inputBackground: '#FFFFFF',
		navigationBackground: 'rgba(255, 255, 255, 0.95)',
		overlay: 'rgba(255, 255, 255, 0.92)',
		backdrop: 'rgba(15, 23, 42, 0.32)',

		primary: '#059669',
		primaryPressed: '#047857',
		primaryMuted: '#ECFDF5',
		onPrimary: '#FFFFFF',

		textPrimary: '#0F172A',
		textSecondary: '#475569',
		textMuted: '#64748B',
		textDisabled: '#94A3B8',
		placeholder: '#94A3B8',

		border: '#E2E8F0',
		borderFocused: '#059669',
		divider: '#F1F5F9',

		iconActive: '#059669',
		iconInactive: '#64748B',
		iconOnPrimary: '#FFFFFF',

		success: '#087A3E',
		info: '#176B87',
		error: '#C83349',
		errorMuted: '#FBE8EB',
		warning: '#9A5B00',
		warningMuted: '#FFF2D6',
		rating: '#9A5B00',
		danger: '#C83349',
	},
})

export const NightRide = createTheme({
	name: 'NightRide',
	mode: 'dark',
	shadows: darkShadows,
	palette: {
		background: '#08131F',
		surface: '#102235',
		surfaceElevated: '#183149',
		inputBackground: '#132A40',
		navigationBackground: 'rgba(16, 34, 53, 0.96)',
		overlay: 'rgba(16, 34, 53, 0.9)',
		backdrop: 'rgba(2, 8, 23, 0.64)',

		primary: '#55E6D3',
		primaryPressed: '#36CDBA',
		primaryMuted: 'rgba(85, 230, 211, 0.14)',
		onPrimary: '#052D2D',

		textPrimary: '#F2F8FC',
		textSecondary: '#AEC1CF',
		textMuted: '#91A9BA',
		textDisabled: '#647D90',
		placeholder: '#8299AA',

		border: 'rgba(174, 193, 207, 0.1)',
		borderFocused: 'rgba(85, 230, 211, 0.7)',
		divider: 'rgba(174, 193, 207, 0.08)',

		iconActive: '#55E6D3',
		iconInactive: '#AEC1CF',
		iconOnPrimary: '#052D2D',

		success: '#66E3A4',
		info: '#66C7F4',
		error: '#FF6B7A',
		errorMuted: 'rgba(255, 107, 122, 0.14)',
		warning: '#F5C968',
		warningMuted: 'rgba(245, 201, 104, 0.14)',
		rating: '#F5C968',
		danger: '#FF6B7A',
	},
})

export const DesertMocha = createTheme({
	name: 'DesertMocha',
	mode: 'dark',
	shadows: darkShadows,
	palette: {
		background: '#1B1411',
		surface: '#2A211D',
		surfaceElevated: '#382C26',
		inputBackground: '#312620',
		navigationBackground: 'rgba(42, 33, 29, 0.96)',
		overlay: 'rgba(56, 44, 38, 0.9)',
		backdrop: 'rgba(20, 13, 10, 0.64)',

		primary: '#E8B86D',
		primaryPressed: '#D29D50',
		primaryMuted: 'rgba(232, 184, 109, 0.14)',
		onPrimary: '#3A2208',

		textPrimary: '#FAF2E8',
		textSecondary: '#D1C0B2',
		textMuted: '#B9A596',
		textDisabled: '#806F64',
		placeholder: '#A58F80',

		border: 'rgba(250, 242, 232, 0.09)',
		borderFocused: 'rgba(232, 184, 109, 0.7)',
		divider: 'rgba(250, 242, 232, 0.07)',

		iconActive: '#E8B86D',
		iconInactive: '#D1C0B2',
		iconOnPrimary: '#3A2208',

		success: '#8DCC94',
		info: '#82BFD1',
		error: '#FF766D',
		errorMuted: 'rgba(255, 118, 109, 0.14)',
		warning: '#E8B86D',
		warningMuted: 'rgba(232, 184, 109, 0.14)',
		rating: '#E8B86D',
		danger: '#FF766D',
	},
})

export const themes = Object.freeze({
	VernaDark,
	VernaLight,
	NightRide,
	DesertMocha,
})

export const DEFAULT_THEME_NAME = 'VernaDark'
export const defaultTheme = VernaDark

// Backward-compatible aliases for components that have not moved to the
// ThemeProvider yet.
export const colors = VernaDark.colors
export const elevation = VernaDark.shadows

export default themes
