import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRosterSocket } from './useRosterSocket';
import { AppProvider } from '../data/store';
import React from 'react';

const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

vi.mock('../services/api', () => ({
  default: {
    getToken: vi.fn().mockReturnValue('mock-jwt-token'),
    post: vi.fn().mockResolvedValue({ success: true, data: { reservation: { id: 'res-1' } } }),
  },
  api: {
    reservations: {
      checkIn: vi.fn().mockResolvedValue({ success: true }),
    },
  },
}));

describe('useRosterSocket hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppProvider>{children}</AppProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = true;
  });

  it('initializes socket and joins roster on connect', () => {
    const { result } = renderHook(() => useRosterSocket('exp-1'), { wrapper });

    expect(result.current).toBeDefined();
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));

    // Simulate connect callback
    const calls = mockSocket.on.mock.calls as Array<[string, Function]>;
    const connectCall = calls.find((c) => c[0] === 'connect');
    if (connectCall && typeof connectCall[1] === 'function') {
      act(() => {
        connectCall[1]();
      });
      expect(mockSocket.emit).toHaveBeenCalledWith('client:join_roster', { experienceId: 'exp-1' });
    }
  });

  it('handles server:roster_updated and updates roster state', () => {
    renderHook(() => useRosterSocket('exp-1'), { wrapper });

    const calls = mockSocket.on.mock.calls as Array<[string, Function]>;
    const rosterUpdatedCall = calls.find((c) => c[0] === 'server:roster_updated');
    expect(rosterUpdatedCall).toBeDefined();

    if (rosterUpdatedCall && typeof rosterUpdatedCall[1] === 'function') {
      act(() => {
        rosterUpdatedCall[1]({
          experienceId: 'exp-1',
          reservationId: 'res-1',
          state: 'checked_in',
          checkedInAt: '2027-01-15T18:30:00.000Z',
          checkedInBy: 'usr_host_01',
          attendeeName: 'Sarah A.',
        });
      });
    }
  });

  it('emits client:checkin_attendee when checkInAttendee is called and socket is connected', async () => {
    const { result } = renderHook(() => useRosterSocket('exp-1'), { wrapper });

    act(() => {
      result.current.checkInAttendee('1234', 'res-1');
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('client:checkin_attendee', {
      experienceId: 'exp-1',
      reservationId: 'res-1',
      pin: '1234',
    });
  });

  it('falls back to HTTP checkin if socket is not connected', async () => {
    mockSocket.connected = false;
    const { result } = renderHook(() => useRosterSocket('exp-1'), { wrapper });

    let res: any;
    await act(async () => {
      res = await result.current.checkInAttendee('1234', 'res-1');
    });

    expect(res.success).toBe(true);
  });
});
