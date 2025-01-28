// import { render, screen } from '@testing-library/react';

// test('should render chatbox component', () => {
//     expect(1).toBe(1);
// });


import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { ChannelsProvider } from '../contexts/ChannelContext';
import Sidebar from './Sidebar';

jest.mock('../contexts/ChannelContext', () => ({
  useChannels: jest.fn(),
}));

// Mock for socket.io
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
};

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn((key) => {
      if (key === 'token') return 'mock-token';
      if (key === 'user') return JSON.stringify({ id: 'mock-user-id', username: 'mockuser' });
      return null;
    }),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

describe('Sidebar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Sidebar with the correct UI elements', () => {
    render(
      <MemoryRouter>
        <ChannelsProvider value={{ setCurrentChannel: jest.fn() }}>
          <ToastContainer />
          <Sidebar socket={mockSocket} />
        </ChannelsProvider>
      </MemoryRouter>
    );

    // Check for title
    expect(screen.getByText('🐕 CHAT-ON')).toBeInTheDocument();

    // Check for + New Group button
    const newGroupButton = screen.getByText('+ New Group');
    expect(newGroupButton).toBeInTheDocument();

    // Check for search input
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  test('opens group modal when + New Group button is clicked', () => {
    render(
      <MemoryRouter>
        <ChannelsProvider value={{ setCurrentChannel: jest.fn() }}>
          <ToastContainer />
          <Sidebar socket={mockSocket} />
        </ChannelsProvider>
      </MemoryRouter>
    );

    const newGroupButton = screen.getByText('+ New Group');
    fireEvent.click(newGroupButton);

    // Check if modal appears
    expect(screen.getByText(/create a new group/i)).toBeInTheDocument();
  });

  test('fetches users and groups on component mount', async () => {
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([]),
    });

    render(
      <MemoryRouter>
        <ChannelsProvider value={{ setCurrentChannel: jest.fn() }}>
          <ToastContainer />
          <Sidebar socket={mockSocket} />
        </ChannelsProvider>
      </MemoryRouter>
    );

    // Wait for fetch to complete
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2); // fetchAllUsers and fetchGroups
    });

    global.fetch.mockRestore();
  });

  test('displays toast message when group creation fails', async () => {
    // Mock validation error
    const mockValidationError = new Error('Validation failed');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(require('yup'), 'object').mockReturnValue({
      validate: jest.fn().mockRejectedValue(mockValidationError),
    });

    render(
      <MemoryRouter>
        <ChannelsProvider value={{ setCurrentChannel: jest.fn() }}>
          <ToastContainer />
          <Sidebar socket={mockSocket} />
        </ChannelsProvider>
      </MemoryRouter>
    );

    const newGroupButton = screen.getByText('+ New Group');
    fireEvent.click(newGroupButton);

    // Submit group form with invalid data
    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);

    // Wait for toast to appear
    await waitFor(() => {
      expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
    });

    console.error.mockRestore();
  });

  test('handles friend request actions correctly', async () => {
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    render(
      <MemoryRouter>
        <ChannelsProvider value={{ setCurrentChannel: jest.fn() }}>
          <ToastContainer />
          <Sidebar socket={mockSocket} />
        </ChannelsProvider>
      </MemoryRouter>
    );

    // Trigger friend request action
    const user = { id: 'test-user-id', username: 'testuser' };
    const sendFriendRequestButton = screen.getByText(/send friend request/i);

    fireEvent.click(sendFriendRequestButton);

    // Wait for fetch to complete
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:3003/users/${user.id}/friend-requests`,
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    global.fetch.mockRestore();
  });
});
