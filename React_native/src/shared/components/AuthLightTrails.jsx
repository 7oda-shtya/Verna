import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
	Easing,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const STREAKS = [
	{ top: 0.09, width: 0.55, duration: 4800, delay: 0, color: '#2EE6FF' },
	{ top: 0.15, width: 0.4, duration: 5600, delay: 1800, color: '#38BDF8' },
	{ top: 0.21, width: 0.68, duration: 6100, delay: 2150, color: '#60A5FA' },
	{ top: 0.27, width: 0.32, duration: 4300, delay: 4700, color: '#0EA5E9' },
	{ top: 0.12, width: 0.48, duration: 6700, delay: 6500, color: '#22D3EE' },
	{ top: 0.24, width: 0.52, duration: 5900, delay: 6850, color: '#3B82F6' },
];

function Streak({ config, screenWidth, screenHeight, index }) {
	const progress = useSharedValue(0);
	const streakWidth = screenWidth * config.width;

	React.useEffect(() => {
		progress.value = withDelay(
			config.delay,
			withRepeat(
				withTiming(1, { duration: config.duration, easing: Easing.out(Easing.quad) }),
				-1,
				false,
			),
		);
	}, []);

	const animatedStyle = useAnimatedStyle(() => {
		const x = interpolate(
			progress.value,
			[0, 1],
			[-streakWidth, screenWidth + streakWidth],
		);
		const opacity = interpolate(
			progress.value,
			[0, 0.08, 0.85, 1],
			[0, 0.9, 0.7, 0],
		);
		return {
			opacity,
			transform: [{ translateX: x }],
		};
	});

	return (
		<Animated.View
			style={[
				{
					position: 'absolute',
					top: screenHeight * config.top,
					width: streakWidth,
					height: 8,
				},
				animatedStyle,
			]}>
			<Svg width='100%' height='8' viewBox='0 0 100 8' preserveAspectRatio='none'>
				<Defs>
					<LinearGradient id={`trail-${index}`} x1='0' y1='0' x2='1' y2='0'>
						<Stop offset='0' stopColor={config.color} stopOpacity='0' />
						<Stop offset='0.28' stopColor={config.color} stopOpacity='0.04' />
						<Stop offset='0.58' stopColor={config.color} stopOpacity='0.18' />
						<Stop offset='0.82' stopColor={config.color} stopOpacity='0.48' />
						<Stop offset='0.96' stopColor={config.color} stopOpacity='0.9' />
						<Stop offset='1' stopColor='#F8FEFF' stopOpacity='1' />
					</LinearGradient>
				</Defs>

				<Path
					d='M0 4 C38 3.95 72 3.55 97.8 3.05 L100 4 L97.8 4.95 C72 4.45 38 4.05 0 4 Z'
					fill={`url(#trail-${index})`}
				/>
				<Circle cx='98.8' cy='4' r='2.1' fill={config.color} opacity={0.12} />
				<Circle cx='98.8' cy='4' r='1.15' fill='#FFFFFF' opacity={0.95} />
			</Svg>
		</Animated.View>
	);
}

export default function AuthLightTrails() {
	const { width, height } = useWindowDimensions();

	return (
		<View
			pointerEvents='none'
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				overflow: 'hidden',
				direction: 'ltr',
				zIndex: 1,
			}}>
			{STREAKS.map((config, index) => (
				<Streak
					key={`streak-${index}`}
					config={config}
					screenWidth={width}
					screenHeight={height}
					index={index}
				/>
			))}
		</View>
	);
}
