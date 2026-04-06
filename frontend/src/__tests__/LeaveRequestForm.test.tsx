import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import LeaveRequestForm from '../components/LeaveRequestForm';

const mockOnClose = vi.fn();
const mockOnSuccess = vi.fn();

const renderForm = () => {
  return render(
    <LeaveRequestForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
  );
};

describe('LeaveRequestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with essential elements', () => {
    renderForm();

    // Check form title exists
    expect(screen.getByText(/نموذج طلب إجازة/)).toBeInTheDocument();
    
    // Check submit button exists
    expect(screen.getByRole('button', { name: /إرسال الطلب للمدير/ })).toBeInTheDocument();
    
    // Check cancel button exists
    expect(screen.getByRole('button', { name: /إلغاء/ })).toBeInTheDocument();
  });
});
