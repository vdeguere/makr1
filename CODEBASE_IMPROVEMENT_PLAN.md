# Codebase Improvement Action Plan

## Overview
This document outlines a prioritized action plan to address issues identified in the codebase review. Each item includes specific steps, file references, and implementation guidance.

---

## Priority 1: Critical Issues (Week 1-2)

### 1.1 Enable TypeScript Strict Mode
**Priority:** Critical  
**Impact:** Type safety, bug prevention  
**Effort:** Medium (2-3 days)

#### Steps:
1. **Gradually enable strict checks** in `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true
     }
   }
   ```

2. **Fix type errors incrementally**:
   - Start with `src/lib/` utilities (lowest risk)
   - Move to `src/hooks/` 
   - Then `src/components/`
   - Finally `src/pages/`

3. **Files to update first**:
   - `src/integrations/supabase/client.ts` - Add null checks for env vars
   - `src/hooks/useAuth.tsx` - Add proper error types
   - `src/contexts/RoleContext.tsx` - Fix type assertions

4. **Create type definitions** for:
   - API response types
   - Form data types (some exist, ensure consistency)
   - Error types

**Files to modify:**
- `tsconfig.json`
- All TypeScript files (incremental fixes)

---

### 1.2 Remove/Guard Console Statements
**Priority:** Critical  
**Impact:** Performance, security  
**Effort:** Low (1 day)

#### Steps:
1. **Create a logging utility** (`src/lib/logger.ts`):
   ```typescript
   const isDev = import.meta.env.DEV;
   
   export const logger = {
     log: (...args: any[]) => isDev && console.log(...args),
     error: (...args: any[]) => console.error(...args), // Always log errors
     warn: (...args: any[]) => isDev && console.warn(...args),
     debug: (...args: any[]) => isDev && console.debug(...args),
   };
   ```

2. **Replace all console statements**:
   - Search: `console.log` → Replace: `logger.log`
   - Search: `console.debug` → Replace: `logger.debug`
   - Search: `console.warn` → Replace: `logger.warn`
   - Keep `console.error` or replace with `logger.error`

3. **Priority files** (most console statements):
   - `src/components/patients/ttm/TTMPatientProfileTab.tsx`
   - `src/pages/admin/ContactSubmissions.tsx`
   - `src/pages/Contact.tsx`
   - `src/components/patients/PatientFormDialog.tsx`
   - All files in `src/pages/` directory

**Files to create:**
- `src/lib/logger.ts`

**Files to modify:**
- ~89 files with console statements

---

### 1.3 Split Large Components
**Priority:** Critical  
**Impact:** Maintainability, performance  
**Effort:** High (3-5 days)

#### Component: TTMPatientProfileTab.tsx (949 lines)

**Breakdown:**
1. **Extract calculation utilities** → `src/lib/ttmCalculations.ts`
   - `calculateAge`
   - `calculateDayOfWeekBorn`
   - `getDayOfWeekIndex`
   - `calculateThaiLunarDay`
   - Numerology functions

2. **Extract form sections** into separate components:
   - `TTMBasicInfoForm.tsx` - Basic patient info
   - `TTMConstitutionForm.tsx` - Constitution fields
   - `TTMLifestyleForm.tsx` - Lifestyle assessment
   - `TTMHistoryView.tsx` - History display

3. **Extract hooks**:
   - `useTTMProfile.ts` - Data fetching and mutations
   - `useTTMCalculations.ts` - Calculation logic

**Target structure:**
```
src/components/patients/ttm/
├── TTMPatientProfileTab.tsx (main, ~200 lines)
├── TTMBasicInfoForm.tsx
├── TTMConstitutionForm.tsx
├── TTMLifestyleForm.tsx
├── TTMHistoryView.tsx
└── hooks/
    ├── useTTMProfile.ts
    └── useTTMCalculations.ts
```

#### Component: RecommendationFormDialog.tsx (659 lines)

**Breakdown:**
1. **Extract form sections**:
   - `RecommendationBasicInfo.tsx` - Title, patient, notes
   - `RecommendationItemsList.tsx` - Items management
   - `RecommendationItemForm.tsx` - Individual item form

2. **Extract hooks**:
   - `useRecommendationForm.ts` - Form state and validation
   - `useRecommendationItems.ts` - Items management

#### Component: HerbFormDialog.tsx (819 lines)

**Breakdown:**
1. **Extract form sections**:
   - `HerbBasicInfo.tsx` - Name, description
   - `HerbPricing.tsx` - Pricing fields
   - `HerbInventory.tsx` - Stock management
   - `HerbImages.tsx` - Image upload

2. **Extract hooks**:
   - `useHerbForm.ts` - Form state
   - `useHerbImages.ts` - Image handling

**Files to create:**
- Multiple new component files (see breakdown above)
- Hook files for extracted logic

**Files to modify:**
- `src/components/patients/ttm/TTMPatientProfileTab.tsx`
- `src/components/recommendations/RecommendationFormDialog.tsx`
- `src/components/herbs/HerbFormDialog.tsx`

---

## Priority 2: High Priority Issues (Week 3-4)

### 2.1 Enhance Error Handling
**Priority:** High  
**Impact:** User experience, debugging  
**Effort:** Medium (2-3 days)

#### Steps:
1. **Create error handling utilities** (`src/lib/errorHandler.ts`):
   ```typescript
   export class AppError extends Error {
     constructor(
       message: string,
       public code: string,
       public statusCode?: number
     ) {
       super(message);
       this.name = 'AppError';
     }
   }
   
   export const handleError = (error: unknown, context?: string) => {
     // Log to error tracking service
     // Show user-friendly message
   };
   ```

2. **Update ErrorBoundary** to log to error tracking:
   - Add Sentry or similar integration
   - Include context (user, route, etc.)

3. **Add error handling to async operations**:
   - Wrap Supabase queries in try-catch
   - Provide user-friendly error messages
   - Log errors appropriately

4. **Files to update**:
   - `src/components/ErrorBoundary.tsx`
   - All async functions in `src/hooks/`
   - All data fetching in `src/pages/`

**Files to create:**
- `src/lib/errorHandler.ts`
- `src/lib/errorTracking.ts` (Sentry integration)

**Files to modify:**
- `src/components/ErrorBoundary.tsx`
- Multiple files with async operations

---

### 2.2 Add Error Tracking Service
**Priority:** High  
**Impact:** Production debugging  
**Effort:** Low (1 day)

#### Steps:
1. **Install Sentry**:
   ```bash
   npm install @sentry/react @sentry/tracing
   ```

2. **Initialize Sentry** in `src/main.tsx`:
   ```typescript
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: import.meta.env.VITE_SENTRY_DSN,
     environment: import.meta.env.MODE,
     integrations: [new Sentry.BrowserTracing()],
     tracesSampleRate: 0.1,
   });
   ```

3. **Update ErrorBoundary** to use Sentry
4. **Add error context** in key operations

**Files to create:**
- `src/lib/errorTracking.ts`

**Files to modify:**
- `src/main.tsx`
- `src/components/ErrorBoundary.tsx`
- `package.json`

---

### 2.3 Performance Optimizations
**Priority:** High  
**Impact:** User experience  
**Effort:** Medium (2-3 days)

#### Steps:
1. **Add React.memo** to expensive components:
   - List components (PatientsList, OrdersList)
   - Form components that don't change often

2. **Optimize useEffect dependencies**:
   - Review all useEffect hooks
   - Use useCallback for functions passed as dependencies
   - Use useMemo for expensive calculations

3. **Implement code splitting**:
   - Lazy load admin pages
   - Lazy load heavy components (charts, editors)

4. **Optimize database queries**:
   - Review Supabase queries for N+1 problems
   - Add pagination where missing
   - Use select() to limit fields

**Files to modify:**
- Multiple component files
- `src/App.tsx` (add lazy loading)
- Query files in `src/pages/`

---

## Priority 3: Medium Priority (Week 5-6)

### 3.1 Add Unit Tests
**Priority:** Medium  
**Impact:** Code quality, regression prevention  
**Effort:** High (ongoing)

#### Steps:
1. **Setup testing framework**:
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom
   ```

2. **Create test utilities** (`src/test-utils.tsx`)

3. **Priority test areas**:
   - Utility functions (`src/lib/`)
   - Validation schemas (`src/lib/validations/`)
   - Custom hooks (`src/hooks/`)
   - Complex calculations (TTM calculations)

4. **Target coverage**: Start with 60% for critical paths

**Files to create:**
- `vitest.config.ts`
- `src/test-utils.tsx`
- Test files for utilities and hooks

---

### 3.2 Improve Documentation
**Priority:** Medium  
**Impact:** Maintainability  
**Effort:** Medium (ongoing)

#### Steps:
1. **Add JSDoc comments** to:
   - Public functions in `src/lib/`
   - Custom hooks
   - Complex components
   - API functions

2. **Create component documentation**:
   - Document props interfaces
   - Add usage examples

3. **Update README.md** with:
   - Architecture overview
   - Setup instructions
   - Development guidelines

**Files to modify:**
- All files in `src/lib/`
- All hook files
- `README.md`

---

### 3.3 Code Quality Improvements
**Priority:** Medium  
**Impact:** Maintainability  
**Effort:** Low-Medium (ongoing)

#### Steps:
1. **Remove hardcoded values**:
   - Extract magic numbers to constants
   - Move configuration to env vars

2. **Standardize naming conventions**:
   - Review component naming
   - Ensure consistent file naming

3. **Add ESLint rules**:
   - Enable more strict rules
   - Add import ordering
   - Add unused import detection

**Files to modify:**
- `eslint.config.js`
- Multiple component files

---

## Implementation Timeline

### Week 1-2: Critical Issues
- [ ] Enable TypeScript strict mode (gradually)
- [ ] Create and implement logger utility
- [ ] Remove/guard console statements
- [ ] Start splitting large components

### Week 3-4: High Priority
- [ ] Complete component splitting
- [ ] Enhance error handling
- [ ] Add error tracking (Sentry)
- [ ] Begin performance optimizations

### Week 5-6: Medium Priority
- [ ] Setup testing framework
- [ ] Add unit tests for critical paths
- [ ] Improve documentation
- [ ] Code quality improvements

### Ongoing
- [ ] Continue adding tests
- [ ] Monitor and optimize performance
- [ ] Refactor as needed

---

## Success Metrics

1. **TypeScript**: 100% strict mode compliance
2. **Console statements**: 0 in production builds
3. **Component size**: Max 300 lines per component
4. **Test coverage**: 60%+ for critical paths
5. **Error tracking**: All errors logged and tracked
6. **Performance**: Lighthouse score > 90

---

## Notes

- All changes should be made incrementally
- Test thoroughly after each major change
- Consider creating feature branches for each priority
- Review and merge changes with team before deployment
- Monitor error rates after deploying changes

