# Enable TypeScript Strict Mode Gradually

## Overview
Enable TypeScript strict mode incrementally to improve type safety without breaking the codebase. This will be done in phases, starting with the least disruptive options.

## Current State
- `strict: false` in `tsconfig.app.json`
- `noImplicitAny: false`
- `strictNullChecks: false`
- `noUnusedLocals: false`
- `noUnusedParameters: false`

## Phased Approach

### Phase 1: Enable Individual Strict Checks (Least Disruptive)
1. Enable `noImplicitAny: true` - Requires explicit types for `any`
2. Enable `strictNullChecks: true` - Requires null/undefined handling
3. Enable `noUnusedLocals: true` - Warns about unused variables
4. Enable `noUnusedParameters: true` - Warns about unused function parameters

### Phase 2: Enable Full Strict Mode
- Set `strict: true` (enables all strict checks)
- Fix remaining type errors

## Steps

1. **Enable `noImplicitAny`**
   - Update `tsconfig.app.json`
   - Run `npx tsc --noEmit` to check for errors
   - Fix any implicit `any` types found
   - Test the application

2. **Enable `strictNullChecks`**
   - Update `tsconfig.app.json`
   - Run type check
   - Add null checks and optional chaining where needed
   - Fix null/undefined handling issues
   - Test the application

3. **Enable `noUnusedLocals` and `noUnusedParameters`**
   - Update `tsconfig.app.json`
   - Run type check
   - Remove or prefix unused variables/parameters with `_`
   - Test the application

4. **Enable full `strict: true`**
   - Update `tsconfig.app.json` to set `strict: true`
   - Remove individual strict flags (they're included in `strict`)
   - Run comprehensive type check
   - Fix any remaining type errors
   - Test thoroughly

## Notes
- Each phase should be tested before moving to the next
- Some errors may require refactoring
- Use `// @ts-ignore` or `// @ts-expect-error` sparingly and only when necessary
- Consider using type assertions (`as`) when types are known but TypeScript can't infer them


