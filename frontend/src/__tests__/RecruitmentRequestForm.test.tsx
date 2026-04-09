import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RecruitmentRequestForm from '../components/RecruitmentRequestForm';
import * as api from '../services/api';

// Mock the API calls
vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    submitRecruitmentRequest: vi.fn(),
    getNextEmployeeId: vi.fn(() => Promise.resolve({ data: { id: 1001 } })),
    getAllDepartments: vi.fn(() => Promise.resolve([
      { departmentId: 1, departmentName: 'التقنية' },
      { departmentId: 2, departmentName: 'المالية' },
      { departmentId: 3, departmentName: 'الموارد البشرية' },
    ])),
  };
});

describe('RecruitmentRequestForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getByFlexibleText = (text: string, tagName?: string) => screen.getByText((_, element) => {
    const tagMatch = tagName ? element?.tagName.toLowerCase() === tagName.toLowerCase() : true;
    return tagMatch && element?.textContent?.includes(text) === true;
  });

  it('renders all required form fields', async () => {
    await act(async () => {
      render(<RecruitmentRequestForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    });

    expect(getByFlexibleText('طلب توظيف جديد', 'h2')).toBeDefined();
    expect(screen.getByLabelText(/الاسم الثلاثي/)).toBeDefined();
    expect(screen.getByLabelText(/البريد الإلكتروني/)).toBeDefined();
    expect(screen.getByLabelText(/رقم الهوية الوطنية/)).toBeDefined();
    expect(screen.getByLabelText(/المسمى الوظيفي/)).toBeDefined();
    expect(screen.getByLabelText(/القسم/)).toBeDefined();
    expect(screen.getByLabelText(/الراتب المتوقع/)).toBeDefined();
  });

  it('shows validation errors for empty required fields on submit', async () => {
    render(<RecruitmentRequestForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const submitButton = getByFlexibleText('إرسال للموافقة', 'button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByFlexibleText('يجب إدخال الاسم الثلاثي', 'p')).toBeDefined();
      expect(getByFlexibleText('البريد الإلكتروني مطلوب', 'p')).toBeDefined();
      expect(getByFlexibleText('رقم الهوية الوطنية مطلوب', 'p')).toBeDefined();
      expect(getByFlexibleText('المسمى الوظيفي مطلوب', 'p')).toBeDefined();
      expect(getByFlexibleText('القسم مطلوب', 'p')).toBeDefined();
      expect(getByFlexibleText('الراتب المتوقع مطلوب', 'p')).toBeDefined();
    });
  });

  it('validates email format', async () => {
    render(<RecruitmentRequestForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    // Fill invalid email (passes HTML5 validation but fails custom regex)
    const emailInput = screen.getByLabelText(/البريد الإلكتروني/);
    fireEvent.change(emailInput, { target: { value: 'test@invalid' } });
    
    const submitButton = getByFlexibleText('إرسال للموافقة', 'button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByFlexibleText('صيغة البريد الإلكتروني غير صحيحة', 'p')).toBeDefined();
    });
  });

  it('validates mobile number format', async () => {
    render(<RecruitmentRequestForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const mobileInput = screen.getByLabelText(/رقم الجوال/);
    fireEvent.change(mobileInput, { target: { value: '1234567890' } }); 
    
    const submitButton = getByFlexibleText('إرسال للموافقة', 'button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByFlexibleText('رقم الجوال يجب أن يبدأ بـ 05', 'p')).toBeDefined();
    });
  });

  it('submits the form successfully with valid data', async () => {
    vi.mocked(api.submitRecruitmentRequest).mockResolvedValue({
      data: { id: 1 }
    } as Awaited<ReturnType<typeof api.submitRecruitmentRequest>>);
    
    render(<RecruitmentRequestForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    // Wait for departments to load
    await waitFor(() => {
      expect(screen.getByText('اختر القسم')).toBeDefined();
    });
    
    fireEvent.change(screen.getByLabelText(/الاسم الثلاثي/), { target: { value: 'محمد علي حسن' } });
    fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/), { target: { value: 'm.ali@example.com' } });
    fireEvent.change(screen.getByLabelText(/رقم الهوية الوطنية/), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText(/العمر/), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText(/العنوان/), { target: { value: 'الرياض، العليا' } });
    fireEvent.change(screen.getByLabelText(/المسمى الوظيفي/), { target: { value: 'مطور واجهات' } });
    // The department select uses departmentName as value, not departmentId
    const departmentSelect = screen.getByLabelText(/القسم/);
    fireEvent.change(departmentSelect, { target: { value: 'التقنية' } });
    fireEvent.change(screen.getByLabelText(/الراتب المتوقع/), { target: { value: '15000' } });
    fireEvent.change(screen.getByLabelText(/رقم الجوال/), { target: { value: '0512345678' } });
    
    fireEvent.change(screen.getByLabelText(/الحالة الاجتماعية/), { target: { value: 'أعزب' } });
    fireEvent.change(screen.getByLabelText(/حالة الخدمة العسكرية/), { target: { value: 'أدى الخدمة' } });

    const submitButton = getByFlexibleText('إرسال للموافقة', 'button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.submitRecruitmentRequest).toHaveBeenCalled();
      expect(getByFlexibleText('تم إرسال الطلب بنجاح', 'h2')).toBeDefined();
    });
  });
});
