import React, { isValidElement, cloneElement, useCallback, useEffect, useRef } from 'react';
import { View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import type { TourId } from './tourConstants';
import { useTour } from './TourContext';

type TourTargetProps = {
	tourId: TourId;
	targetId: string;
	children: React.ReactElement;
	asChild?: boolean;
	style?: ViewStyle;
};

export const useTourTarget = (tourId: TourId, targetId: string) => {
	const ref = useRef<View | null>(null);
	const { registerTarget, unregisterTarget } = useTour();

	const measure = useCallback(() => {
		const node = ref.current;
		if (!node) return;
		requestAnimationFrame(() => {
			node.measureInWindow((x, y, width, height) => {
				if (width > 0 && height > 0) {
					registerTarget(tourId, targetId, { x, y, width, height });
				}
			});
		});
	}, [registerTarget, targetId, tourId]);

	useEffect(() => {
		measure();
		return () => unregisterTarget(tourId, targetId);
	}, [measure, targetId, tourId, unregisterTarget]);

	const onLayout = useCallback((_event: LayoutChangeEvent) => {
		measure();
	}, [measure]);

	return { ref, onLayout };
};

const mergeRefs = (...refs: Array<React.Ref<any> | undefined>) => (instance: any) => {
	refs.forEach(ref => {
		if (!ref) return;
		if (typeof ref === 'function') {
			ref(instance);
			return;
		}
		(ref as React.MutableRefObject<any>).current = instance;
	});
};

export const TourTarget = ({ tourId, targetId, children, asChild = false, style }: TourTargetProps) => {
	const { ref, onLayout } = useTourTarget(tourId, targetId);

	if (asChild && isValidElement(children)) {
		return cloneElement(children, {
			ref: mergeRefs((children as any).ref, ref),
			onLayout: (event: LayoutChangeEvent) => {
				children.props?.onLayout?.(event);
				onLayout(event);
			},
			collapsable: false,
			style: [children.props.style, style],
		});
	}

	return (
		<View ref={ref} collapsable={false} onLayout={onLayout} style={style}>
			{children}
		</View>
	);
};
