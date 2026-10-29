import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { AppProvider } from '../data/store';
import { useRosterSocket } from './useRosterSocket';
import apiClient, { api } from '../services/api';

// Mock socket.io-client
const mockSocket = {
  connected: false,
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

vi.mock('../services/api', () => ({
  default: {
    getToken: vi.fn(() => 'mock-jwt-token'),
    post: vi.fn(),
  },
  api: {
    reservations: {
      checkIn: vi.fn(),
    },
  },
}));

describe('useRosterSocket', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppProvider>{children}</AppProvider>
  );

  const eventHandlers: Record<string, Function> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;
    mockSocket.on.mockImplementation((event: string, handler: Function) => {
      eventHandlers[event] = handler;
      return mockSocket;
    });
    mockSocket.off.mockImplementation((event: string) => {
      delete eventHandlers[event];
      return mockSocket;
    });
  });

  afterEach(() => {
    Object.keys(eventHandlers).forEach((key) => delete eventHandlers[key]);
  });

  it('initializes socket and sets up event listeners when experienceId is present', () => {
    const { result } = renderHook(() => useRosterSocket('exp-123'), { wrapper });

    expect(result.current.isConnected).toBe(false);
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('server:roster_snapshot', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('server:roster_updated', expect.any(Function));

    // Simulate connect
    act(() => {
      mockSocket.connected = true;
      eventHandlers['connect']?.();
    });

    expect(result.current.isConnected).toBe(true);
    expect(mockSocket.emit).toHaveBeenCalledWith('client:join_roster', { experienceId: 'exp-123' });
  });

  it('receives roster snapshot and updates roster state', () => {
    const { result } = renderHook(() => useRosterSocket('exp-123'), { wrapper });

    const mockSnapshot = [
      { id: 'res-1', state: 'confirmed', attendee_name: 'Ahmed' },
      { id: 'res-2', state: 'confirmed', attendee_name: 'Sara' },
    ];

    act(() => {
      eventHandlers['server:roster_snapshot']?.({
        experienceId: 'exp-123',
        roster: mockSnapshot,
      });
    });

    expect(result.current.roster).toEqual(mockSnapshot);
  });

  it('updates roster on server:roster_updated', () => {
    const { result } = renderHook(() => useRosterSocket('exp-123'), { wrapper });

    act(() => {
      eventHandlers['server:roster_snapshot']?.({
        experienceId: 'exp-123',
        roster: [{ id: 'res-1', state: 'confirmed' }],
      });
    });

    act(() => {
      eventHandlers['server:roster_updated']?.({
        experienceId: 'exp-123',
        reservationId: 'res-1',
        state: 'checked_in',
        checkedInAt: '2026-10-30T10:00:00Z',
      });
    });

    expect(result.current.roster[0].state).toBe('checked_in');
    expect(result.current.roster[0].checked_in_at).toBe('2026-10-30T10:00:00Z');
  });

  it('falls back to HTTP check-in when socket is disconnected', async () => {
    mockSocket.connected = false;
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: { reservation: { id: 'res-1', state: 'checked_in' } },
    });

    const { result } = renderHook(() => useRosterSocket('exp-123'), { wrapper });

    let checkInResult;
    await act(async () => {
      checkInResult = await result.current.checkInAttendee('1234');
    });

    expect(checkInResult).toEqual({ success: true });
    expect(apiClient.post).toHaveBeenCalledWith('/host/experiences/exp-123/verify-pin', { pin: '1234' });
  });

  it('disconnects on unmount', () => {
    const { unmount } = renderHook(() => useRosterSocket('exp-123'), { wrapper });
    unmount();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
