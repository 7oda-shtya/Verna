import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOUR_DEFINITIONS, TOUR_IDS, TOUR_STORAGE_KEYS, type TourId, type TourStep } from './tourConstants';

export type TourRect = {
	x: number;
	y: number;
	width: number;
	height: number;
};

type TourTargetRegistry = Partial<Record<TourId, Partial<Record<string, TourRect>>>>;

type TourContextValue = {
	ready: boolean;
	activeTourId: TourId | null;
	currentStepIndex: number;
	steps: TourStep[];
	currentStep: TourStep | null;
	currentRect: TourRect | null;
	registerTarget: (tourId: TourId, targetId: string, rect: TourRect) => void;
	unregisterTarget: (tourId: TourId, targetId: string) => void;
	startTour: (tourId: TourId) => Promise<boolean>;
	nextStep: () => Promise<void>;
	skipTour: () => Promise<void>;
	resetTourSeen: (tourId: TourId) => Promise<void>;
	markTourSeen: (tourId: TourId) => Promise<void>;
	isTourSeen: (tourId: TourId) => boolean;
};

const TourContext = createContext<TourContextValue | null>(null);

const emptyTargets = (): TourTargetRegistry => ({
	[TOUR_IDS.APP_GLOBAL]: {},
	[TOUR_IDS.TRIP_REQUEST]: {},
});

export const TourProvider = ({ children }: { children: React.ReactNode }) => {
	const [ready, setReady] = useState(false);
	const [seenTours, setSeenTours] = useState<Partial<Record<TourId, boolean>>>({});
	const [activeTourId, setActiveTourId] = useState<TourId | null>(null);
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [targets, setTargets] = useState<TourTargetRegistry>(emptyTargets);

	useEffect(() => {
		let mounted = true;
		const loadSeenTours = async () => {
			try {
				const entries = await Promise.all(
					(Object.keys(TOUR_STORAGE_KEYS) as TourId[]).map(async tourId => {
						const value = await AsyncStorage.getItem(TOUR_STORAGE_KEYS[tourId]);
						return [tourId, value === 'true'] as const;
					}),
				);
				if (!mounted) return;
				setSeenTours(Object.fromEntries(entries) as Partial<Record<TourId, boolean>>);
			} finally {
				if (mounted) setReady(true);
			}
		};

		loadSeenTours();
		return () => {
			mounted = false;
		};
	}, []);

	const isTourSeen = useCallback((tourId: TourId) => Boolean(seenTours[tourId]), [seenTours]);

	const markTourSeen = useCallback(async (tourId: TourId) => {
		// Update the in-memory flag first so isTourSeen reflects it immediately for any caller
		// re-checking on a subsequent focus/render, instead of only after the AsyncStorage write
		// resolves — that gap was the race that let a tour start more than once (see Profile.jsx).
		// The AsyncStorage write is still awaited so callers keep their existing "persisted" guarantee.
		setSeenTours(prev => ({ ...prev, [tourId]: true }));
		await AsyncStorage.setItem(TOUR_STORAGE_KEYS[tourId], 'true');
	}, []);

	const resetTourSeen = useCallback(async (tourId: TourId) => {
		await AsyncStorage.removeItem(TOUR_STORAGE_KEYS[tourId]);
		setSeenTours(prev => ({ ...prev, [tourId]: false }));
		if (activeTourId === tourId) {
			setActiveTourId(null);
			setCurrentStepIndex(0);
		}
	}, [activeTourId]);

	const finishTour = useCallback(async (tourId: TourId) => {
		await markTourSeen(tourId);
		setActiveTourId(null);
		setCurrentStepIndex(0);
	}, [markTourSeen]);

	const startTour = useCallback(async (tourId: TourId) => {
		const definition = TOUR_DEFINITIONS[tourId] ?? [];
		if (!definition.length || activeTourId) return false;
		if (seenTours[tourId]) return false;
		await markTourSeen(tourId);
		setActiveTourId(tourId);
		setCurrentStepIndex(0);
		return true;
	}, [activeTourId, markTourSeen, seenTours]);

	const nextStep = useCallback(async () => {
		if (!activeTourId) return;
		const definition = TOUR_DEFINITIONS[activeTourId] ?? [];
		const nextIndex = currentStepIndex + 1;
		if (nextIndex >= definition.length) {
			await finishTour(activeTourId);
			return;
		}
		setCurrentStepIndex(nextIndex);
	}, [activeTourId, currentStepIndex, finishTour]);

	const skipTour = useCallback(async () => {
		if (!activeTourId) return;
		await finishTour(activeTourId);
	}, [activeTourId, finishTour]);

	const registerTarget = useCallback((tourId: TourId, targetId: string, rect: TourRect) => {
		setTargets(prev => {
			const nextTargets = { ...prev };
			nextTargets[tourId] = { ...(nextTargets[tourId] || {}), [targetId]: rect };
			return nextTargets;
		});
	}, []);

	const unregisterTarget = useCallback((tourId: TourId, targetId: string) => {
		setTargets(prev => {
			const nextTourTargets = { ...(prev[tourId] || {}) };
			delete nextTourTargets[targetId];
			return { ...prev, [tourId]: nextTourTargets };
		});
	}, []);

	const currentSteps = activeTourId ? TOUR_DEFINITIONS[activeTourId] ?? [] : [];
	const currentStep = currentSteps[currentStepIndex] ?? null;
	const currentRect = activeTourId && currentStep ? targets[activeTourId]?.[currentStep.targetId] ?? null : null;

	const value = useMemo<TourContextValue>(() => ({
		ready,
		activeTourId,
		currentStepIndex,
		steps: currentSteps,
		currentStep,
		currentRect,
		registerTarget,
		unregisterTarget,
		startTour,
		nextStep,
		skipTour,
		resetTourSeen,
		markTourSeen,
		isTourSeen,
	}), [
		ready,
		activeTourId,
		currentStepIndex,
		currentSteps,
		currentStep,
		currentRect,
		registerTarget,
		unregisterTarget,
		startTour,
		nextStep,
		skipTour,
		resetTourSeen,
		markTourSeen,
		isTourSeen,
	]);

	return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export const useTour = () => {
	const context = useContext(TourContext);
	if (!context) {
		throw new Error('useTour must be used inside TourProvider');
	}
	return context;
};
