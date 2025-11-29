# Onboarding Component Architecture

## Overview

This document details the component architecture for the multi-step onboarding process that replaces the existing simple authentication page. The design follows the visual specifications from `docs/onboarding.html` while integrating with the existing Supabase backend.

## Component Hierarchy

```
src/app/auth/page.tsx
└── components/
    ├── AuthFlow.tsx (Main orchestrator)
    ├── ProgressIndicator.tsx
    ├── SignInForm.tsx
    └── SignUpSteps/
        ├── Step1Email.tsx
        ├── EmailInput.tsx
        └── PasswordInput.tsx
        ├── Step2Name.tsx
        └── DisplayNameInput.tsx
        ├── Step3Role.tsx
        └── RoleSelector.tsx
        ├── Step4Location.tsx
        └── LocationSelector.tsx
        ├── Step5Diet.tsx
        └── DietSelector.tsx
        ├── Step6Avatar.tsx
        ├── AvatarPicker.tsx
        └── ImageUpload.tsx
        └── CompletionScreen.tsx
```

## Detailed Component Specifications

### 1. AuthFlow.tsx (Main Orchestrator)

**Purpose**: Manages the overall authentication flow, switching between sign in and sign up modes.

**Props**:
```typescript
interface AuthFlowProps {
  redirectTo?: string
  mode?: 'signin' | 'signup'
}
```

**State Management**:
```typescript
interface AuthFlowState {
  mode: 'signin' | 'signup'
  currentStep: number
  isTransitioning: boolean
  formData: SignUpFormData
  isLoading: boolean
  error: string | null
}
```

**Key Features**:
- Mode switching between sign in/sign up
- Step progression logic
- Form data aggregation
- Error handling and display
- Loading state management

### 2. ProgressIndicator.tsx

**Purpose**: Shows user's progress through the onboarding steps.

**Props**:
```typescript
interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  mode: 'signin' | 'signup'
}
```

**Visual Design**:
- Matches design from `docs/onboarding.html`
- Shows "Step X of Y" text
- Progress bar with fill percentage
- Smooth transitions between steps

### 3. SignInForm.tsx

**Purpose**: Handles existing user sign in with email/password.

**Props**:
```typescript
interface SignInFormProps {
  onSubmit: (credentials: SignInCredentials) => Promise<void>
  onSwitchToSignUp: () => void
  isLoading: boolean
  error: string | null
}
```

**Features**:
- Email and password inputs
- Remember me checkbox
- Forgot password link
- Sign in button
- Link to sign up

### 4. Sign Up Steps

#### Step1Email.tsx
- Email input with validation
- Password input with strength indicator
- Password confirmation field
- Next button (disabled until valid)

#### Step2Name.tsx
- Display name input
- Character limit and validation
- Real-time availability check
- Next/Back navigation

#### Step3Role.tsx
- Role selection (Trainee/Employee)
- Visual cards with icons
- Single selection required
- Next/Back navigation

#### Step4Location.tsx
- Zone selection dropdown
- Options: GEC 2, ECC, Hostel Blocks, SDB Blocks
- Map integration (optional)
- Next/Back navigation

#### Step5Diet.tsx
- Dietary preference selection
- Visual cards (Vegetarian/Non-Veg)
- Icons and colors matching design
- Next/Back navigation

#### Step6Avatar.tsx
- Avatar upload or selection
- Default avatar options
- Camera integration
- Optional step (can skip)
- Complete setup button

## Form Data Structure

```typescript
interface SignUpFormData {
  email: string
  password: string
  confirmPassword: string
  displayName: string
  role: 'trainee' | 'employee'
  baseLocation: string
  dietaryPreference: 'vegetarian' | 'non-veg'
  avatarUrl?: string
  rememberMe: boolean
}

interface SignInCredentials {
  email: string
  password: string
  rememberMe: boolean
}
```

## Validation Strategy

### Email Validation
```typescript
const validateEmail = (email: string): ValidationResult => {
  if (!email) return { isValid: false, error: 'Email is required' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { isValid: false, error: 'Please enter a valid email' }
  }
  return { isValid: true }
}
```

### Password Validation
```typescript
const validatePassword = (password: string): ValidationResult => {
  if (!password) return { isValid: false, error: 'Password is required' }
  if (password.length < 8) return { isValid: false, error: 'Password must be at least 8 characters' }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { isValid: false, error: 'Password must contain uppercase, lowercase, and numbers' }
  }
  return { isValid: true }
}
```

### Display Name Validation
```typescript
const validateDisplayName = (name: string): ValidationResult => {
  if (!name) return { isValid: false, error: 'Display name is required' }
  if (name.length < 2) return { isValid: false, error: 'Name must be at least 2 characters' }
  if (name.length > 50) return { isValid: false, error: 'Name must be less than 50 characters' }
  return { isValid: true }
}
```

## State Management Hook

### useAuthFlow.ts

```typescript
const useAuthFlow = (initialMode: 'signin' | 'signup' = 'signin') => {
  const [state, setState] = useState<AuthFlowState>({
    mode: initialMode,
    currentStep: 0,
    isTransitioning: false,
    formData: getDefaultFormData(),
    isLoading: false,
    error: null
  })

  const updateFormData = (field: string, value: any) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value }
    }))
  }

  const nextStep = async () => {
    // Validate current step
    const isValid = await validateStep(state.currentStep, state.formData)
    if (!isValid) return

    setState(prev => ({
      ...prev,
      isTransitioning: true,
      currentStep: prev.currentStep + 1
    }))

    setTimeout(() => {
      setState(prev => ({ ...prev, isTransitioning: false }))
    }, 300)
  }

  const prevStep = () => {
    setState(prev => ({
      ...prev,
      isTransitioning: true,
      currentStep: Math.max(0, prev.currentStep - 1)
    }))

    setTimeout(() => {
      setState(prev => ({ ...prev, isTransitioning: false }))
    }, 300)
  }

  const submitForm = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      if (state.mode === 'signin') {
        await signIn(state.formData.email, state.formData.password)
      } else {
        await signUp(state.formData)
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }))
    }
  }

  return {
    ...state,
    setState,
    updateFormData,
    nextStep,
    prevStep,
    submitForm,
    clearError: () => setState(prev => ({ ...prev, error: null }))
  }
}
```

## Integration with Existing Components

### BottomNav Updates

```typescript
// Enhanced BottomNav component
const BottomNav = () => {
  const { isAuthenticated, user } = useAuth()
  
  return (
    <div className="bottom-nav-container">
      <div className="bottom-nav">
        <Link href="/" className="nav-item">
          <i className="ri-home-4-fill"></i>
          <span className="nav-label">Home</span>
        </Link>
        
        {isAuthenticated ? (
          <Link href="/upload" className="nav-upload">
            <i className="ri-camera-fill"></i>
            <span className="nav-label">Scan</span>
          </Link>
        ) : (
          <Link href="/auth" className="nav-upload" style={{ backgroundColor: '#FEF3C7' }}>
            <i className="ri-lock-line" style={{ color: '#92400E' }}></i>
            <span className="nav-label" style={{ color: '#92400E' }}>Sign In</span>
          </Link>
        )}

        {isAuthenticated ? (
          <div className="nav-item" onClick={handleSignOut}>
            <i className="ri-logout-box-r-line"></i>
            <span className="nav-label">Sign Out</span>
          </div>
        ) : (
          <Link href="/auth" className="nav-item">
            <i className="ri-user-line"></i>
            <span className="nav-label">Profile</span>
          </Link>
        )}
      </div>
    </div>
  )
}
```

### Upload Page Integration

```typescript
// Enhanced Upload page
const UploadPage = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth?redirectTo=/upload')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <LoadingSpinner message="Checking authentication..." />
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  // Rest of upload component
  return (
    <div className="upload-container">
      {/* Upload functionality */}
    </div>
  )
}
```

## Styling Considerations

### CSS Variables from Design
```css
:root {
  --bg-body: #FDFDE8;
  --bg-card: #FFFFFF;
  --primary-dark: #2C3E2E;
  --primary-light: #4A5D4C;
  --accent-lime: #DCEB66;
  --text-main: #1F291F;
  --text-muted: #889287;
  --shadow-soft: 0 8px 24px rgba(44, 62, 46, 0.08);
  --shadow-float: 0 10px 30px rgba(44, 62, 46, 0.25);
}
```

### Component-Specific Styles
- Consistent border radius (20px for inputs, 24px for cards)
- Smooth transitions (300ms ease-in-out)
- Hover states with color changes
- Active states with accent color
- Loading states with spinner animations

## Error Handling

### Form-Level Errors
- Real-time validation feedback
- Field-specific error messages
- Step-level validation before progression
- Clear error states on input change

### Network-Level Errors
- Retry mechanisms for failed requests
- Graceful degradation for offline scenarios
- User-friendly error messages
- Recovery options (forgot password, etc.)

### UI Error States
- Error message display with clear styling
- Dismissible error notifications
- Loading indicators during async operations
- Disabled states during processing

## Accessibility Features

### Keyboard Navigation
- Tab order management
- Enter key submission
- Escape key cancellation
- Arrow key navigation for selections

### Screen Reader Support
- ARIA labels for all inputs
- Live regions for error messages
- Progress announcements for step changes
- Semantic HTML structure

### Visual Accessibility
- High contrast mode support
- Focus indicators
- Reduced motion preferences
- Text scaling compatibility

## Performance Optimizations

### Component Optimization
- React.memo for pure components
- useMemo for expensive calculations
- useCallback for event handlers
- Lazy loading of step components

### Bundle Optimization
- Code splitting for auth components
- Dynamic imports for heavy dependencies
- Tree shaking for unused exports
- Minification and compression

## Testing Strategy

### Unit Tests
- Component rendering tests
- Validation function tests
- Hook behavior tests
- Error handling tests

### Integration Tests
- Full auth flow tests
- Navigation between steps
- Form submission tests
- Error scenario tests

### E2E Tests
- Complete user journeys
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility compliance

This component architecture provides a comprehensive, user-friendly onboarding experience that matches the design specifications while integrating seamlessly with the existing foodosys application.