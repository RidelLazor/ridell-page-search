# Search loading page animation

## Build
- Replace the inline “Searching…” message with a centered, full-page loading state below the search bar.
- Animate the Violytra icon with a restrained pulse and orbiting progress indicator.
- Keep the loading state visible until results or an error is returned, then transition to the existing results page.
- Respect reduced-motion preferences and keep the layout usable on mobile.

## Technical details
- Reuse the existing Violytra icon and semantic theme colors.
- Implement the animation in the search page and shared stylesheet without changing search behavior.
- Verify the loading state and final results visually in the preview.
