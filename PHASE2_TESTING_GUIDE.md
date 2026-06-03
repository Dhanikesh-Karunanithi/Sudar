# 🧪 PHASE 2 TESTING GUIDE

**Date**: June 1, 2026  
**Objective**: Verify Phase 2 implementation works correctly  
**Estimated Time**: 20-30 minutes  

---

## Pre-Test Checklist

- [ ] Sudar Learn running on localhost:3001
- [ ] Sudar Studio running on localhost:3000
- [ ] Browser console open (F12)
- [ ] No existing test courses to interfere

### Start Services

```bash
# Terminal 1 - Studio
cd sudar-studio
npm run dev

# Terminal 2 - Learn
cd sudar-learn
npm run dev
```

---

## Test Plan

### Test 1: Type Safety Check (5 min)

**Goal**: Verify TypeScript recognizes new component types

```bash
# In sudar-learn directory
npm run type-check

# Expected: ✅ No errors
```

**What to verify:**
- ✅ content.ts compiles
- ✅ RichModuleContent.tsx compiles
- ✅ No type errors

**If errors occur:**
- Check import paths
- Verify file locations
- Check type exports

---

### Test 2: Visual Inspection (2 min)

**Goal**: Verify no console errors on startup

**Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to Learn app (localhost:3001)
4. Look for red errors

**Expected:**
- ✅ No red console errors
- ⚠️ Warnings are OK
- ℹ️ Info logs are fine

**What to check:**
- Missing imports
- Type errors
- Component not found errors

---

### Test 3: Generate Test Course (10 min)

**Goal**: Create a real course using Phase 2 system

**Steps:**

1. **Open Studio** (localhost:3000)
2. **Login** if needed
3. **Create New Course**
   - Title: `"Test Phase 2 - Programming"`
   - Description: `"Testing new pedagogical components"`
   - Course Type: `Programming`
4. **Generate Course**
   - Click "Generate"
   - Wait for completion
5. **Note the Course ID** (from URL or course list)

**What to verify:**
- ✅ Course generates without errors
- ✅ Shows new component types in structure
- ✅ Quality score displays (if wired)

---

### Test 4: Open Course in Learn (5 min)

**Goal**: Verify components render correctly

**Steps:**

1. **Go to Learn app** (localhost:3001)
2. **Find test course**
   - Search for "Test Phase 2"
   - Or browse from home
3. **Open first module**
4. **Scroll through content**

**What to look for:**

#### Theme
- ✅ Colors apply (not default gray)
- ✅ Fonts load correctly
- ✅ Layout looks professional

#### Components
Look for these rendered blocks (should see at least 2-3):
- ✅ **Case Study Block** — Company name, challenge, solution visible
- ✅ **Framework Grid** — 2-column layout with content
- ✅ **Highlight Box** — Callout box with icon and text
- ✅ **Key Takeaways** — Checklist with bullet points
- ✅ **Expert Voice** — Quote with attribution
- ✅ **Scenario Challenge** — Interactive scenario + quiz
- ✅ **Real World Example** — Concrete example with explanation

#### Console
- ✅ No red errors
- ✅ No warnings about missing components

---

### Test 5: Component Interaction (3 min)

**Goal**: Verify interactive components work

**Steps:**

1. **Find Scenario Challenge block**
2. **Click the scenario** (if interactive)
3. **Check for errors**
4. **Try to interact** (answer quiz, etc.)

**What to verify:**
- ✅ Clicks work
- ✅ No console errors
- ✅ Interactions respond

---

### Test 6: Theme Application (3 min)

**Goal**: Verify theme CSS is working

**Steps:**

1. **Open DevTools** (F12)
2. **Go to Elements/Inspector tab**
3. **Right-click on module content**
4. **Click "Inspect"**
5. **Look for CSS classes**

**What to verify in DevTools:**
- ✅ `theme-wrapper` class present
- ✅ `theme-calora-editorial` class applied
- ✅ CSS variables set (--primary-color, etc.)

**Example in DevTools:**
```html
<div class="theme-wrapper theme-calora-editorial">
  <div class="course-theme-provider">
    <!-- Content here -->
  </div>
</div>
```

---

### Test 7: Responsive Design (3 min)

**Goal**: Verify mobile responsiveness

**Steps:**

1. **Open DevTools**
2. **Click device toggle** (mobile view)
3. **Switch to mobile size** (iPhone 12, 375px)
4. **Scroll through content**

**What to verify:**
- ✅ Components stack vertically
- ✅ Text readable
- ✅ No horizontal scroll
- ✅ Buttons clickable

**Test sizes:**
- 375px (iPhone)
- 768px (Tablet)
- 1024px (Desktop)

---

### Test 8: Multiple Courses (Optional, 5 min)

**Goal**: Verify consistency across domains

**Create test courses for other domains:**

1. **Test Course - Product Strategy**
   - Course Type: Product Strategy
   - Verify different SME context applied

2. **Test Course - Data Science**
   - Course Type: Data Science
   - Verify different examples/context

**What to verify:**
- ✅ Each renders correctly
- ✅ SME contexts are different
- ✅ Components render in all courses

---

## Troubleshooting Issues

### Issue: Type Errors
```
Error: 'case_study' is not a valid type
```

**Solution:**
1. Check `content.ts` has all new types
2. Verify imports in RichModuleContent.tsx
3. Ensure PedagogicalComponents.tsx exports are correct

### Issue: Components Don't Render
```
Nothing renders where component should be
```

**Solution:**
1. Check DevTools console for errors
2. Verify component data structure
3. Check component import paths
4. Verify type matches exactly

### Issue: Theme Doesn't Apply
```
Colors are still gray/default
```

**Solution:**
1. Check CourseThemeProvider is wrapping content
2. Verify theme CSS file exists
3. Check CSS variables are set
4. Clear browser cache (Ctrl+Shift+Delete)

### Issue: Console Errors
```
Cannot find module 'PedagogicalComponents'
Cannot read property 'data' of undefined
```

**Solution:**
1. Verify all files are saved
2. Check file paths match exactly
3. Verify imports use correct casing
4. Restart dev server

---

## Expected Test Results

### Type Check
```
✅ No errors
✅ All imports resolved
✅ All types recognized
```

### Course Generation
```
✅ Course created successfully
✅ Shows new component types
✅ No generation errors
```

### Course Rendering
```
✅ Theme applies (Calora Editorial)
✅ All components render
✅ No console errors
✅ Responsive on all sizes
✅ Interactive elements work
```

### Quality Assessment
- If error-free → **READY TO DEPLOY** ✅
- If minor issues → **FIX & RETEST** ⚠️
- If major issues → **INVESTIGATE** ❌

---

## Sign-Off Checklist

Use this to confirm readiness:

### Code Quality
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] No console errors
- [ ] Responsive on mobile

### Functionality
- [ ] Course generates
- [ ] Components render
- [ ] Theme applies
- [ ] Interactive elements work

### Content Quality
- [ ] SME context visible in generated content
- [ ] Multiple pedagogical components used
- [ ] Professional appearance

### Performance
- [ ] Page loads quickly
- [ ] No lag when scrolling
- [ ] No memory leaks

---

## Pass/Fail Criteria

### PASS ✅ (Ready to Deploy)
- All type checks pass
- Course generates successfully
- All components render correctly
- No console errors
- Theme applies properly
- Responsive design works
- Interactive elements respond

### FAIL ❌ (Don't Deploy Yet)
- Type errors present
- Components won't render
- Persistent console errors
- Theme not applying
- Broken responsive design

---

## Testing Report Template

After testing, fill this out:

```
TEST DATE: ___________
TESTER: ___________

TYPE CHECK:        ✅ / ❌
CONSOLE ERRORS:    ✅ / ❌
COURSE GENERATION: ✅ / ❌
COMPONENT RENDER:  ✅ / ❌
THEME APPLICATION: ✅ / ❌
RESPONSIVENESS:    ✅ / ❌
INTERACTIONS:      ✅ / ❌

OVERALL RESULT: PASS ✅ / FAIL ❌

Issues Found:
1. _________________
2. _________________
3. _________________

Comments:
_________________

Ready to Deploy: YES / NO
```

---

## Next Steps After Testing

### If All Tests Pass ✅
1. Review test results
2. Approve deployment
3. Merge to main
4. Deploy to production

### If Issues Found ❌
1. Document issues
2. Investigate root cause
3. Fix issues
4. Retest (go back to Test 1)

---

## Support During Testing

**If you encounter issues:**
1. Check console for exact error message
2. Screenshot the error
3. Note which test it failed on
4. Share error details

---

**Ready to start testing?** 🧪

Next: Run the tests and report back!
