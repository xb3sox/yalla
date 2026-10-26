import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useApp } from '../data/store';
import apiClient, { api } from '../services/api';

interface RosterUpdatePayload {
  experienceId: string;
  reservationId: string;
  state: 'checked_in' | 'attended' | string;
  checkedInAt: string;
  checkedInBy?: string;
  attendeeName?: string;
}

interface UseRosterSocketOptions {
  token?: string;
  autoConnect?: boolean;
}

export function useRosterSocket(experienceId?: string, options?: UseRosterSocketOptions) {
  const { state, dispatch } = useApp();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const getBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return envUrl.replace(/\/api\/v1\/?$/, '');
  };

  const fallbackHttpCheckIn = useCallback(
    async (pin: string, reservationId?: string): Promise<{ success: boolean; error?: string }> => {
      try {
        if (reservationId) {
          await api.reservations.checkIn(reservationId);
          dispatch({ type: 'CHECK_IN_RESERVATION', payload: reservationId });
          return { success: true };
        } else if (experienceId) {
          const res = (await apiClient.post(`/host/experiences/${experienceId}/verify-pin`, { pin })) as any;
          if (res.success && res.data?.reservation) {
            dispatch({
              type: 'UPDATE_RESERVATION',
              payload: { id: res.data.reservation.id, state: 'checked_in' },
            });
            return { success: true };
          }
          return { success: false, error: res.error?.message || 'Invalid PIN' };
        }
        return { success: false, error: 'Missing reservationId or experienceId' };
      } catch (err: any) {
        return { success: false, error: err.message || 'HTTP check-in failed' };
      }
    },
    [experienceId, dispatch]
  );

  const connect = useCallback(() => {
    if (!experienceId) return;

    const token = options?.token || apiClient.getToken();
    const baseUrl = getBaseUrl();

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: options?.autoConnect !== false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      if (experienceId) {
        socket.emit('client:join_roster', { experienceId });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      setIsConnected(false);
      setError(err.message || 'WebSocket connection error');
    });

    socket.on('server:error', (err: { message?: string; code?: number | string }) => {
      setError(err.message || 'Server error occurred');
    });

    socket.on('server:roster_snapshot', (data: { experienceId: string; roster: any[] }) => {
      if (data.experienceId === experienceId) {
        setRoster(data.roster);
      }
    });

    socket.on('server:roster_updated', (data: RosterUpdatePayload) => {
      if (data.experienceId === experienceId) {
        setRoster((prev) =>
          prev.map((item) =>
            item.id === data.reservationId
              ? { ...item, state: data.state, checked_in_at: data.checkedInAt }
              : item
          )
        );

        // Synchronize with global application store so Host Portal / UI updates badge automatically
        dispatch({
          type: 'UPDATE_RESERVATION',
          payload: { id: data.reservationId, state: data.state as any },
        });
      }
    });
  }, [experienceId, options?.token, options?.autoConnect, dispatch]);

  const joinRoster = useCallback(
    (expId?: string) => {
      const targetExpId = expId || experienceId;
      if (socketRef.current && socketRef.current.connected && targetExpId) {
        socketRef.current.emit('client:join_roster', { experienceId: targetExpId });
      }
    },
    [experienceId]
  );

  const checkInAttendee = useCallback(
    async (pin: string, reservationId?: string): Promise<{ success: boolean; error?: string }> => {
      if (!experienceId) {
        return { success: false, error: 'experienceId is required' };
      }

      // Try WebSocket check-in first if connected
      const currentSocket = socketRef.current;
      if (currentSocket && currentSocket.connected) {
        return new Promise((resolve) => {
          let timeoutId: any;

          const errorHandler = (err: { message?: string; code?: number | string }) => {
            clearTimeout(timeoutId);
            cleanup();
            resolve({ success: false, error: err.message || 'Check-in failed' });
          };

          const updateHandler = (data: RosterUpdatePayload) => {
            if (data.experienceId === experienceId && (!reservationId || data.reservationId === reservationId)) {
              clearTimeout(timeoutId);
              cleanup();
              resolve({ success: true });
            }
          };

          const cleanup = () => {
            currentSocket.off('server:error', errorHandler);
            currentSocket.off('server:roster_updated', updateHandler);
          };

          timeoutId = setTimeout(() => {
            cleanup();
            // Fallback to HTTP check-in if WS response times out
            fallbackHttpCheckIn(pin, reservationId).then(resolve);
          }, 3000);

          currentSocket.on('server:error', errorHandler);
          currentSocket.on('server:roster_updated', updateHandler);

          currentSocket.emit('client:checkin_attendee', {
            experienceId,
            reservationId,
            pin,
          });
        });
      }

      // Fallback gracefully to HTTP polling / HTTP POST if WS is disconnected
      return fallbackHttpCheckIn(pin, reservationId);
    },
    [experienceId, fallbackHttpCheckIn]
  );

  useEffect(() => {
    if (experienceId) {
      connect();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [experienceId, connect]);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    roster,
    joinRoster,
    checkInAttendee,
  };
}
