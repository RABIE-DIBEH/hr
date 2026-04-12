import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Inbox from '../pages/Inbox';
import * as api from '../services/api';
import type { PaginatedList, InboxMessage } from '../services/api';

const mockPaginated = <T,>(items: T[]): PaginatedList<T> => ({
  items,
  totalCount: items.length,
  page: 0,
  pageSize: 20,
  totalPages: 1,
  hasNext: false,
});

const mockMessage = (overrides: Partial<InboxMessage>): InboxMessage => ({
  messageId: 1,
  title: 'Test',
  message: 'Content',
  senderName: 'Admin',
  targetRole: 'ALL',
  priority: 'MEDIUM',
  createdAt: new Date().toISOString(),
  archived: false,
  ...overrides,
});

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
    vi.mocked(api.getCurrentEmployee).mockResolvedValue({
      data: { employeeId: 1, roleName: 'EMPLOYEE' }
    } as Awaited<ReturnType<typeof api.getCurrentEmployee>>);
    vi.mocked(api.getUnreadCount).mockResolvedValue({
      data: { unreadCount: 5 }
    } as Awaited<ReturnType<typeof api.getUnreadCount>>);
  });

  it('renders messages from the inbox', async () => {
    vi.mocked(api.getInboxPage).mockResolvedValue({
      data: mockPaginated([
        mockMessage({ messageId: 101, title: 'Test Message', message: 'Hello World', senderName: 'Admin', priority: 'HIGH', isRead: false })
      ])
    } as Awaited<ReturnType<typeof api.getInboxPage>>);

    render(<Inbox />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Message')).toBeDefined();
      expect(screen.getByText('Admin')).toBeDefined();
    });
  });

  it('shows empty state when no messages are found', async () => {
    vi.mocked(api.getInboxPage).mockResolvedValue({
      data: mockPaginated([])
    } as Awaited<ReturnType<typeof api.getInboxPage>>);

    render(<Inbox />, { wrapper: createWrapper() });

    await waitFor(() => {
      // i18n is not initialized in tests, so t() returns raw key
      expect(screen.getByText('inbox.status.noMessages')).toBeDefined();
    });
  });

  it('opens message thread when a message is clicked', async () => {
    vi.mocked(api.getInboxPage).mockResolvedValue({
      data: mockPaginated([
        mockMessage({ messageId: 101, title: 'Open Me', message: 'Content', senderName: 'Admin', priority: 'MEDIUM' })
      ])
    } as Awaited<ReturnType<typeof api.getInboxPage>>);

    vi.mocked(api.getMessageThread).mockResolvedValue({
      data: [
        mockMessage({ messageId: 101, title: 'Open Me', message: 'Content', senderName: 'Admin' })
      ]
    } as Awaited<ReturnType<typeof api.getMessageThread>>);

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
