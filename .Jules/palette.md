## 2024-05-13 - Enhance A11y and UX for Settings UI Form Components
**Learning:** React fragments or loose `<span>` elements around form controls severely harm screen reader accessibility. By explicitly adding unique generated IDs via `React.useId()` and tying them to `<button>` through `aria-labelledby` and `aria-describedby` (as well as adding standard `<label htmlFor="...">`), standard form fields become significantly easier to use. Similarly, mobile focus outlines often require high-contrast color shifts (`focus-visible:ring-offset-2`) since background darkness levels can vary randomly depending on user/system app themes.
**Action:** When creating modular generic input wrappers (Toggle/Select/Action), inject automatic ID generation and explicitly pair titles, descriptions, and controls. Always test focus rings with dual offset properties to ensure visibility across dynamic backgrounds.


## 2025-05-25 - Enhance A11y and UX for MiniPlayer
**Learning:** The MiniPlayer lacked keyboard support (Enter/Space to expand) and proper ARIA labels for screen readers. Using `role="button"` and `tabIndex={0}` makes `div` containers accessible.
**Action:** Add keyboard event handlers (`onKeyDown`) alongside `onClick` for custom interactive elements. Ensure ARIA labels dynamically reflect the component state (e.g., currently playing track or play/pause button state).
