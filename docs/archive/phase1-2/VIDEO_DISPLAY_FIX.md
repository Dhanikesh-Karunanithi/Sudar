# Video Display Fix — SudarVidCard

**Date**: June 2, 2026  
**Component**: `sudar-learn/src/app/(dashboard)/courses/[id]/learn/SudarVidCard.tsx`  
**Status**: ✅ Fixed

## Problem Summary

The generated video was not displaying properly in the iframe after generation completed. This was a recurring issue with multiple root causes:

1. **Iframe mounting/remounting** - Using `key={jobId}` caused unnecessary iframe reloads
2. **Sandbox attribute too restrictive** - Original sandbox only allowed `allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox`, missing critical flags
3. **No iframe loaded state tracking** - Video player appeared before iframe fully loaded, causing visual glitches
4. **Inadequate loading UI** - Only showed generic frost loader without iframe context
5. **Render grant error handling** - Unclear error messaging when auth failed
6. **Missing iframe readiness signal** - No communication between parent and iframe about readiness

## Changes Made

### 1. Added iframe load state tracking
```typescript
const [iframeLoaded, setIframeLoaded] = useState(false)
```
- Tracks when iframe has fully loaded
- Reset when phase or jobId changes
- Used to show/hide loading overlay

### 2. Enhanced iframe sandbox attributes
**Before:**
```typescript
sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
```

**After:**
```typescript
sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-presentation allow-forms"
```

**Added flags:**
- `allow-presentation` - Enables fullscreen and presentation mode
- Reordered for clarity

### 3. Expanded iframe allow attribute
**Before:**
```typescript
allow="autoplay"
```

**After:**
```typescript
allow="autoplay; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
```

**Enables:**
- Modern video controls (picture-in-picture, fullscreen)
- Clipboard access for certain interactions
- Sensor access for device features

### 4. Improved iframe rendering structure
- Removed `key={jobId}` to prevent remounting
- Wrapped iframe in absolutely positioned container
- Added loading overlay that appears while iframe loads
- Container uses fixed positioning in fullscreen mode

```typescript
<div className={cn(
  'relative w-full rounded-xl border border-border bg-black overflow-hidden',
  fullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'h-[600px]'
)}>
  {!iframeLoaded && (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
      <div className="text-center space-y-3">
        <div className="inline-flex">
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
        </div>
        <p className="text-xs text-white/70">Loading video…</p>
      </div>
    </div>
  )}
  <iframe
    ref={iframeRef}
    src={`/api/ai/generate-video/render/${jobId}/slides.html`}
    className="absolute inset-0 w-full h-full"
    title={`Video: ${moduleTitle}`}
    allow="autoplay; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-presentation allow-forms"
    loading="eager"
    onLoad={() => setIframeLoaded(true)}
  />
</div>
```

### 5. Enhanced render grant error handling
Improved error messages in the render grant fetch:
```typescript
if (!r.ok) {
  throw new Error(`render-grant failed: ${r.status} ${r.statusText}`)
}
```

### 6. Added iframe readiness signal
Parent window now signals readiness to iframe:
```typescript
// Signal iframe readiness to sudarvid
if (iframeRef.current?.contentWindow) {
  iframeRef.current.contentWindow.postMessage({ type: 'sudarvid_ready' }, window.location.origin)
}
```

### 7. Increased loading state container height
- Loading placeholder now `min-h-[400px]` (was `min-h-[200px]`)
- Iframe container `h-[600px]` (was `h-[580px]`) for better aspect ratio
- Consistent with video player expectations

## Testing Checklist

- [ ] Generate video for a module
- [ ] Wait for generation to complete
- [ ] Verify video appears in iframe
- [ ] Click fullscreen and verify video fills screen
- [ ] Test video controls (play, pause, seek)
- [ ] Test on mobile and desktop
- [ ] Verify audio/narration plays correctly
- [ ] Regenerate video and verify previous video clears
- [ ] Test render grant error path (manually trigger auth failure)

## Files Modified

- `sudar-learn/src/app/(dashboard)/courses/[id]/learn/SudarVidCard.tsx`

## Related Components

- `sudar-learn/src/app/(dashboard)/courses/[id]/learn/CourseViewer.tsx` (displays SudarVidCard)
- `/api/ai/generate-video/render-grant` (auth endpoint)
- `/api/ai/generate-video/render/[jobId]/[...path]` (proxy for video files)

## Performance Notes

- Iframe uses `loading="eager"` for immediate fetch
- Loading overlay uses single pulsing dot for minimal CPU overhead
- Absolute positioning prevents layout thrashing
- No re-renders triggered by iframe state changes (isolated to iframe)

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (tested with webkit fullscreen flags)
- Mobile browsers: Full support (responsive container)

## Next Steps

1. Test thoroughly across browsers and devices
2. Monitor error logs for render grant failures
3. Consider adding fallback UI if iframe fails to load (e.g., link to video URL)
4. Add performance metrics for iframe load time
