import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { TOUR_IDS } from './tourConstants';
import { useTour } from './TourContext';

type TourBootstrapProps = {
	enabled: boolean;
};

export const TourBootstrap = ({ enabled }: TourBootstrapProps) => {
	const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
	const isPhoneVerified = useSelector((state: any) => state.auth.isPhoneVerified);
	const { ready, startTour, isTourSeen, activeTourId } = useTour();

	useEffect(() => {
		if (!enabled || !ready || !isAuthenticated || !isPhoneVerified) return;
		if (activeTourId || isTourSeen(TOUR_IDS.APP_GLOBAL)) return;
		const timer = setTimeout(() => {
			startTour(TOUR_IDS.APP_GLOBAL);
		}, 900);
		return () => clearTimeout(timer);
	}, [activeTourId, enabled, isAuthenticated, isPhoneVerified, isTourSeen, ready, startTour]);

	return null;
};
