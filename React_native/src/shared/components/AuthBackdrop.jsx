import React, { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import AuthLightTrails from './AuthLightTrails';

export default function AuthBackdrop({ children }) {
	const { theme } = useTheme();
	const [drift] = useState(() => new Animated.Value(0));

	useEffect(() => {
		const animation = Animated.loop(
			Animated.sequence([
				Animated.timing(drift, { toValue: 1, duration: 7000, useNativeDriver: true }),
				Animated.timing(drift, { toValue: 0, duration: 7000, useNativeDriver: true }),
			]),
		);
		animation.start();
		return () => animation.stop();
	}, [drift]);

	const firstGlowTransform = {
		transform: [
			{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -28] }) },
			{ translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 22] }) },
		],
	};

	const secondGlowTransform = {
		transform: [
			{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) },
			{ translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) },
		],
	};

	return (
		<View style={{ flex: 1, overflow: 'hidden', backgroundColor: theme.colors.background }}>
			<Animated.View
				pointerEvents='none'
				style={[
					{
						position: 'absolute',
						top: -110,
						right: -95,
						width: 300,
						height: 300,
						borderRadius: 150,
						backgroundColor: theme.colors.primaryMuted,
						opacity: 0.68,
					},
					firstGlowTransform,
				]}
			/>
			<Animated.View
				pointerEvents='none'
				style={[
					{
						position: 'absolute',
						bottom: -150,
						left: -110,
						width: 340,
						height: 340,
						borderRadius: 170,
						backgroundColor: theme.colors.surfaceElevated,
						opacity: 0.62,
					},
					secondGlowTransform,
				]}
			/>
			<AuthLightTrails />
			<View style={{ flex: 1, zIndex: 2 }}>{children}</View>
		</View>
	);
}
