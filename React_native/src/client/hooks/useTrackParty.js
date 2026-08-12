import { useEffect, useState } from 'react';
import { emit, on } from '../services/socket.service';

export default function useTrackParty(tripId, active = true) {
  const [partyLocation, setPartyLocation] = useState(null);
  const [partyLocations, setPartyLocations] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tripId || !active) return undefined;
    let unsubscribe;
    let cancelled = false;

    const subscribe = async () => {
      try {
        emit('trip:join', tripId, response => {
          if (!response?.success && !cancelled) setError(response?.message || 'Could not join trip');
        });
        unsubscribe = await on('location:update', location => {
          if (location.tripId === tripId && !cancelled) {
            setPartyLocation(location);
            if (location.userId) setPartyLocations(current => ({ ...current, [location.userId]: location }));
          }
        });
      } catch (socketError) {
        if (!cancelled) setError(socketError.message);
      }
    };

    subscribe();
    return () => {
      cancelled = true;
      unsubscribe?.();
      emit('trip:leave', tripId).catch(() => {});
    };
  }, [tripId, active]);

  return { partyLocation, partyLocations, error };
}
