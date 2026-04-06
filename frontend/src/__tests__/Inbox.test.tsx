import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Inbox from '../pages/Inbox';
import * as api from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    getInboxPage: vi.fn(),
    getCurrentEmployee: vi.fn(),
    getMessageThread: vi.fn(),
    getUnreadCount: vi.fn(),
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Inbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getCurrentEmployee).mockResolvedValue({ data: { employeeId: 1, roleName: 'EMPLOYEE' } } as any);
    vi.mocked(api.getUnreadCount).mockResolvedValue({ data: { unreadCount: 5 } } as any);
  });

  it('renders messages from the inbox', async () => {
    vi.mocked(api.getInboxPage).mockResolvedValue({
      data: {
        items: [
          { messageId: 101, title: 'Test Message', message: 'Hello World', senderName: 'Admin', priority: 'HIGH', createdAt: new Date().toISOString(), isRead: false }
        ],
        totalPages: 1,
        totalCount: 1,
      }
    } as any);

    render(<Inbox />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Message')).toBeDefined();
      expect(screen.getByText('Admin')).toBeDefined();
    });
  });

  it('shows empty state when no messages are found', async () => {
    vi.mocked(api.getInboxPage).mockResolvedValue({
      data: { items: [], totalPages: 0, totalCount: 0 }
    } as any);

    render(<Inbox />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('لا توجد رسائل'))).toBeDefined();
    });
  });

  it('opens message thread when a message is clicked', async () => {
    vi.mocked(api.getInboxPage).mockResolvedValue({
      data: {
        items: [
          { messageId: 101, title: 'Open Me', message: 'Content', senderName: 'Admin', priority: 'MEDIUM', createdAt: new Date().toISOString() }
        ],
        totalPages: 1,
        totalCount: 1,
      }
    } as any);

    vi.mocked(api.getMessageThread).mockResolvedValue({
      data: [
        { messageId: 101, title: 'Open Me', message: 'Content', senderName: 'Admin', createdAt: new Date().toISOString() }
      ]
    } as any);

    render(<Inbox />, { wrapper: createWrapper() });

    await waitFor(() => {
      const messageItem = screen.getByText('Open Me');
      fireEvent.click(messageItem);
    });

    await waitFor(() => {
      expect(api.getMessageThread).toHaveBeenCalledWith(101);
    });
  });
});
