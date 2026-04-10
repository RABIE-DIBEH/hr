# HRMS Frontend - React TypeScript Application

## Overview
The HRMS frontend is a modern React 19 application built with TypeScript and Vite. It provides role-based dashboards for employees, managers, HR personnel, and administrators with a sleek, responsive interface.

## 🏗️ Architecture

```
frontend/
├── src/
│   ├── components/           # Reusable UI Components
│   │   ├── AdvanceRequestForm.tsx
│   │   ├── AttendanceChart.tsx
│   │   ├── CurrentDateTimePanel.tsx
│   │   ├── LeaveRequestForm.tsx
│   │   ├── PaginationControls.tsx
│   │   ├── ProfileEditModal.tsx
│   │   ├── Skeleton.tsx      # Loading skeletons
│   │   └── ... (other components)
│   ├── pages/                # Route-Level Pages
│   │   ├── AdminDashboard.tsx
│   │   ├── Attendance.tsx
│   │   ├── CEO Dashboard.tsx
│   │   ├── EmployeeDashboard.tsx      # Phase 9: Leave balance display
│   │   ├── HRDashboard.tsx
│   │   ├── LeaveBalanceReport.tsx     # Phase 9: HR leave quota report
│   │   ├── Login.tsx
│   │   ├── ManagerDashboard.tsx
│   │   ├── PayrollDashboard.tsx
│   │   └── ... (other pages)
│   ├── services/             # API Integration & Utilities
│   │   ├── api.ts           # Axios API client
│   │   ├── auth.ts          # Authentication utilities
│   │   ├── queryKeys.ts     # React Query keys
│   │   └── ... (other services)
│   ├── locales/             # Internationalization
│   │   ├── en.json          # English translations
│   │   └── ar.json          # Arabic translations
│   ├── utils/               # Helper Functions
│   │   ├── dateUtils.ts
│   │   ├── formatters.ts
│   │   └── ... (other utils)
│   ├── App.tsx              # Main application component
│   ├── i18n.ts              # Internationalization setup
│   ├── main.tsx             # Application entry point
│   └── vite-env.d.ts        # TypeScript declarations
├── public/                  # Static Assets
├── nginx.conf               # Production Nginx configuration (Phase 9 security headers)
├── Dockerfile               # Multi-stage production build
├── Dockerfile.dev           # Development Dockerfile
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
└── tailwind.config.js       # Tailwind CSS configuration
```

## 🎨 UI Design System

### Theme & Styling
- **Framework**: Tailwind CSS v4 with custom configuration
- **Colors**: Luxury dark theme with gradient accents
- **Typography**: Arabic/RTL support with proper text direction
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Lucide React icons

### Responsive Design
- **Mobile First**: Optimized for all screen sizes
- **Breakpoints**: Tailwind's default breakpoints
- **Touch-Friendly**: Large touch targets for mobile

### Component Library
- **Custom Components**: Built with Tailwind utility classes
- **Loading States**: Skeleton loaders for better UX
- **Form Components**: Consistent validation and error handling
- **Modal System**: Animated modal dialogs

## 🔑 Key Features (Phase 9)

### 1. Leave Balance Display (EmployeeDashboard)
- **Widget**: "Remaining Leave Days" hero stat card
- **Visual Indicators**: 
  - Green: Normal balance (>5 days)
  - Red: Low balance (<5 days) with warning
- **Real-time Updates**: React Query for automatic refresh
- **Localization**: Arabic/English support via i18n

### 2. Leave Balance Report (HR/Admin)
- **Page**: `LeaveBalanceReport.tsx` - Dedicated report page
- **Features**:
  - Search employees by name/email
  - Filter by department
  - Color-coded balance status
  - Export functionality (UI ready)
- **API Integration**: Uses `getLeaveBalanceReport()` from API service
- **Access Control**: HR, ADMIN, SUPER_ADMIN roles only

### 3. Security Headers (Production)
- **Nginx Configuration**: `nginx.conf` with production security headers:
  - Content-Security-Policy (CSP)
  - Strict-Transport-Security (HSTS)
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin

### 4. Internationalization
- **Languages**: English (en) and Arabic (ar)
- **Framework**: react-i18next
- **RTL Support**: Automatic text direction switching
- **Locale Files**: JSON-based translation files

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Server runs at http://localhost:5173
```

### Build for Production
```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

### Docker
```bash
# Build and run with Docker Compose
docker-compose up frontend

# Or build standalone
docker build -t hrms-frontend .
docker run -p 80:80 hrms-frontend
```

## 📱 Pages & Routing

### Role-Based Routes
| Route | Component | Required Role | Description |
|-------|-----------|---------------|-------------|
| `/` | Login.tsx | None | Authentication page |
| `/dashboard` | EmployeeDashboard.tsx | EMPLOYEE | Personal dashboard with leave balance |
| `/hr` | HRDashboard.tsx | HR | HR management dashboard |
| `/manager` | ManagerDashboard.tsx | MANAGER | Team management dashboard |
| `/admin` | AdminDashboard.tsx | ADMIN | System administration |
| `/ceo` | CEODashboard.tsx | SUPER_ADMIN | Executive overview |
| `/payroll` | PayrollDashboard.tsx | PAYROLL | Payroll processing |
| `/leaves/balance-report` | LeaveBalanceReport.tsx | HR, ADMIN, SUPER_ADMIN | Phase 9: Leave quota report |

### Public Routes
- `/login` - Authentication
- `/clock` - NFC clocking interface
- `/attendance` - Attendance records
- `/leaves` - Leave management
- `/advances` - Advance requests

## 🔌 API Integration

### Service Architecture
- **API Client**: Axios with interceptors for auth tokens
- **State Management**: React Query for server state
- **Authentication**: JWT token in Authorization header
- **Error Handling**: Centralized error handling with toast notifications

### Key Service Functions
```typescript
// api.ts
export const getLeaveBalanceReport = () => 
  api.get<LeaveBalanceReportResponse[]>('/leaves/balance-report');

export const getCurrentEmployee = () => 
  api.get<EmployeeProfileResponse>('/employees/me');

export const submitLeaveRequest = (data: LeaveRequestDto) => 
  api.post<IdResponseDto>('/leaves/request', data);
```

### React Query Integration
```typescript
// Example query in LeaveBalanceReport.tsx
const { data: employees = [], isLoading } = useQuery({
  queryKey: queryKeys.users.leaveBalanceReport,
  queryFn: async () => {
    const res = await getLeaveBalanceReport();
    return res.data;
  },
  enabled: isHighRole, // Role-based enabling
});
```

## 🎯 Phase 9 Implementation Details

### EmployeeDashboard Enhancements
```tsx
{/* Leave Balance Widget */}
<motion.div variants={item} className="bg-luxury-surface p-6 rounded-[2rem] border border-white/5 shadow-sm relative overflow-hidden group">
  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-3xl -mr-8 -mt-8" />
  <div className="relative z-10">
    <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-4 text-orange-400 group-hover:scale-110 transition-transform">
      <ArrowUpRight size={24} />
    </div>
    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{t('dashboard.leaveBalance')}</p>
    <h3 className="text-2xl font-black text-white">{me?.leaveBalanceDays?.toFixed(1) ?? 21.0} {t('common.days')}</h3>
    <div className={`mt-3 flex items-center gap-1.5 text-[10px] font-bold w-fit px-2.5 py-1 rounded-full uppercase ${
      me?.leaveBalanceDays && me.leaveBalanceDays < 5 
        ? 'text-red-400 bg-red-500/10' 
        : 'text-orange-400 bg-orange-500/10'
    }`}>
      {me?.leaveBalanceDays && me.leaveBalanceDays < 5 ? t('dashboard.lowBalance') : t('dashboard.availableBalance')}
    </div>
  </div>
</motion.div>
```

### LeaveBalanceReport Page Features
1. **Search & Filter**: Real-time employee search with department filtering
2. **Status Indicators**: Color-coded balance status (green/red)
3. **Responsive Table**: Mobile-friendly table layout
4. **Export Ready**: UI prepared for PDF/Excel export functionality
5. **Access Control**: Automatic redirect for unauthorized users

## 🧪 Testing

### Test Commands
```bash
# Run tests
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Framework
- **Testing Library**: React Testing Library
- **Test Runner**: Vitest
- **Assertions**: Vitest assertions
- **Mocking**: Vitest mocking utilities

### Test Structure
- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing
- **API Mocking**: Mock service worker for API calls

## 🔧 Configuration

### Environment Variables
Create `.env` file in frontend directory:
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=HRMS PRO
```

### Build Configuration (vite.config.ts)
- **TypeScript**: Strict type checking
- **Aliases**: Path aliases for cleaner imports
- **Optimization**: Code splitting and tree shaking
- **Assets**: Optimized image and font loading

### Tailwind Configuration
- **Custom Colors**: Luxury theme palette
- **Fonts**: Arabic font stack
- **Utilities**: Custom animations and transitions
- **Plugins**: Tailwind forms, typography

## 🐳 Docker Configuration

### Multi-Stage Build (Production)
```dockerfile
# Build stage: Node.js + npm
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage: Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Development Dockerfile
- Hot reload support
- Development server
- Volume mounting for live updates

## 📦 Dependencies

### Core Dependencies
- **React 19**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS v4**: Utility-first CSS framework
- **React Router DOM**: Client-side routing
- **React Query**: Server state management
- **Axios**: HTTP client
- **Framer Motion**: Animation library
- **React I18next**: Internationalization
- **Lucide React**: Icon library

### Development Dependencies
- **Vitest**: Testing framework
- **Testing Library**: React component testing
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking

## 🔒 Security

### Implemented Security Measures
1. **JWT Authentication**: Token-based auth with Axios interceptors
2. **Role-Based Routing**: Protected routes based on user role
3. **Input Validation**: Form validation with error messages
4. **XSS Protection**: React's built-in XSS protection
5. **CSP Headers**: Configured in nginx.conf (Phase 9)

### Security Headers (nginx.conf)
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' http://localhost:* https://localhost:*; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## 📱 Responsive Design

### Breakpoints
- **sm**: 640px (Mobile)
- **md**: 768px (Tablet)
- **lg**: 1024px (Desktop)
- **xl**: 1280px (Large desktop)
- **2xl**: 1536px (Extra large)

### Mobile Optimization
- Touch-friendly buttons and inputs
- Collapsible navigation
- Optimized table views for mobile
- Responsive grid layouts

## 🌐 Internationalization

### Supported Languages
1. **English (en)**: Default language
2. **Arabic (ar)**: RTL layout support

### Implementation
```typescript
// i18n.ts - Configuration
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: 'ar', // Default to Arabic
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Component usage
const { t } = useTranslation();
<p>{t('dashboard.leaveBalance')}</p>
```

## 🚨 Error Handling

### API Error Handling
```typescript
// Axios interceptor in api.ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### User Feedback
- **Toast Notifications**: Success/error messages
- **Form Validation**: Field-level error display
- **Loading States**: Skeleton loaders during API calls
- **Error Boundaries**: Graceful error recovery

## 🔄 Deployment

### Production Build
```bash
npm run build
# Output: dist/ directory with optimized assets
```

### Docker Deployment
```bash
# Build image
docker build -t hrms-frontend:latest .

# Run container
docker run -d \
  -p 80:80 \
  -e VITE_API_BASE_URL=https://api.yourdomain.com/api \
  --name hrms-frontend \
  hrms-frontend:latest
```

### Nginx Configuration
- **Compression**: Gzip compression for assets
- **Caching**: Long-term caching for static assets
- **Security**: Production security headers
- **Routing**: React Router support with fallback

## 🛠️ Development Guidelines

### Code Standards
1. **TypeScript**: Strict type checking enabled
2. **Component Structure**: Functional components with hooks
3. **File Naming**: PascalCase for components, camelCase for utilities
4. **Import Order**: External → Internal, CSS last
5. **Prop Types**: TypeScript interfaces for props

### State Management
- **Local State**: useState for component state
- **Server State**: React Query for API data
- **Global State**: Context API for auth/theme
- **Form State**: React Hook Form for complex forms

### Performance Optimization
- **Code Splitting**: React.lazy() for route-based splitting
- **Memoization**: React.memo, useMemo, useCallback
- **Image Optimization**: Lazy loading and responsive images
- **Bundle Analysis**: Regular bundle size monitoring

## 📞 Support & Troubleshooting

### Common Issues
1. **Build Failures**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Check TypeScript errors
   npx tsc --noEmit
   ```

2. **API Connection Issues**
   - Verify backend is running
   - Check CORS configuration
   - Validate JWT token

3. **Styling Issues**
   - Check Tailwind class conflicts
   - Verify CSS purge configuration
   - Check RTL styling for Arabic

### Development Tools
- **React DevTools**: Component inspection
- **Redux DevTools**: State management debugging
- **Network Tab**: API request monitoring
- **Console**: Error logging and debugging

## 📄 License
Proprietary software. All rights reserved.

---

*Last Updated: April 2026*  
*Version: 1.0.0-stable*  
*Phase 9: Structural & Operational Lockdown - COMPLETE*