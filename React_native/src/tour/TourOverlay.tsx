import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTour } from './TourContext';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

const formatStepNumber = (value: number) => new Intl.NumberFormat('ar-EG').format(value);

export const TourOverlay = () => {
	const { width: screenWidth, height: screenHeight } = useWindowDimensions();
	const { activeTourId, currentStepIndex, steps, currentStep, currentRect, nextStep, skipTour } = useTour();
	const holeX = useSharedValue(0);
	const holeY = useSharedValue(0);
	const holeWidth = useSharedValue(0);
	const holeHeight = useSharedValue(0);
	const spotlightOpacity = useSharedValue(0);
	const [tooltipSize, setTooltipSize] = useState({ width: 300, height: 180 });

	useEffect(() => {
		if (!currentRect) {
			spotlightOpacity.value = withTiming(0, { duration: 180 });
			return;
		}

		holeX.value = withTiming(currentRect.x - 10, { duration: 260 });
		holeY.value = withTiming(currentRect.y - 10, { duration: 260 });
		holeWidth.value = withTiming(currentRect.width + 20, { duration: 260 });
		holeHeight.value = withTiming(currentRect.height + 20, { duration: 260 });
		spotlightOpacity.value = withTiming(1, { duration: 200 });
	}, [currentRect, holeHeight, holeWidth, holeX, holeY, spotlightOpacity]);

	const animatedHoleProps = useAnimatedProps(() => ({
		x: holeX.value,
		y: holeY.value,
		width: holeWidth.value,
		height: holeHeight.value,
		rx: 22,
		ry: 22,
	}));

	const tooltipPlacement = useMemo(() => {
		if (!currentRect || !currentStep) return null;
		const margin = 16;
		const desiredWidth = clamp(screenWidth - 32, 260, 340);
		const centerX = currentRect.x + currentRect.width / 2;
		const left = clamp(centerX - desiredWidth / 2, margin, screenWidth - desiredWidth - margin);
		const needsTopPlacement = currentRect.y + currentRect.height + tooltipSize.height + 28 > screenHeight;
		const top = needsTopPlacement
			? clamp(currentRect.y - tooltipSize.height - 20, margin, screenHeight - tooltipSize.height - margin)
			: clamp(currentRect.y + currentRect.height + 20, margin, screenHeight - tooltipSize.height - margin);
		return { left, top, width: desiredWidth, above: needsTopPlacement };
	}, [currentRect, currentStep, screenHeight, screenWidth, tooltipSize.height]);

	const tooltipStyle = useAnimatedStyle(() => ({
		opacity: spotlightOpacity.value,
		transform: [{ translateY: 0 }],
	}));

	if (!activeTourId || !currentStep || !currentRect) return null;

	const totalSteps = steps.length;
	const isLastStep = currentStepIndex >= totalSteps - 1;

	return (
		<Modal transparent visible statusBarTranslucent animationType='fade' onRequestClose={skipTour}>
			<View style={{ flex: 1 }}>
				<Svg width={screenWidth} height={screenHeight} style={{ position: 'absolute', top: 0, left: 0 }}>
					<Defs>
						<Mask id='tourMask' x='0' y='0' width={screenWidth} height={screenHeight}>
							<Rect x='0' y='0' width={screenWidth} height={screenHeight} fill='white' />
							<AnimatedRect animatedProps={animatedHoleProps} fill='black' />
						</Mask>
					</Defs>
					<Rect x='0' y='0' width={screenWidth} height={screenHeight} fill='rgba(0, 0, 0, 0.74)' mask='url(#tourMask)' />
					<AnimatedRect animatedProps={animatedHoleProps} fill='none' stroke='rgba(255,255,255,0.9)' strokeWidth={2} />
				</Svg>

				<Pressable style={{ flex: 1 }} onPress={() => {}}>
					<Animated.View
						onLayout={event => setTooltipSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
						style={[
							{
								position: 'absolute',
								left: tooltipPlacement?.left ?? 16,
								top: tooltipPlacement?.top ?? 16,
								width: tooltipPlacement?.width ?? 300,
								backgroundColor: 'rgba(15, 23, 42, 0.96)',
								borderRadius: 20,
								padding: 16,
								borderWidth: 1,
								borderColor: 'rgba(255,255,255,0.14)',
								elevation: 18,
							},
							tooltipStyle,
						]}
					>
						<Text style={{ color: '#F8FAFC', fontSize: 18, fontWeight: '800', textAlign: 'right' }}>{currentStep.title}</Text>
						<Text style={{ color: 'rgba(248,250,252,0.82)', fontSize: 13, lineHeight: 22, textAlign: 'right', marginTop: 8 }}>{currentStep.description}</Text>

						<View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
							<Text style={{ color: 'rgba(248,250,252,0.66)', fontSize: 12, fontWeight: '700' }}>
								{formatStepNumber(currentStepIndex + 1)} من {formatStepNumber(totalSteps)}
							</Text>
							<View style={{ flexDirection: 'row-reverse', gap: 8 }}>
								<Pressable onPress={skipTour} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)' }}>
									<Text style={{ color: '#F8FAFC', fontSize: 13, fontWeight: '700' }}>تخطي</Text>
								</Pressable>
								<Pressable onPress={nextStep} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: '#A3E635' }}>
									<Text style={{ color: '#052E16', fontSize: 13, fontWeight: '800' }}>{isLastStep ? 'إنهاء' : 'التالي'}</Text>
								</Pressable>
							</View>
						</View>
					</Animated.View>
				</Pressable>
			</View>
		</Modal>
	);
};
