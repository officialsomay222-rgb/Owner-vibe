## 2024-05-13 - Enhance A11y and UX for Settings UI Form Components
**Learning:** React fragments or loose `<span>` elements around form controls severely harm screen reader accessibility. By explicitly adding unique generated IDs via `React.useId()` and tying them to `<button>` through `aria-labelledby` and `aria-describedby` (as well as adding standard `<label htmlFor="...">`), standard form fields become significantly easier to use. Similarly, mobile focus outlines often require high-contrast color shifts (`focus-visible:ring-offset-2`) since background darkness levels can vary randomly depending on user/system app themes.
**Action:** When creating modular generic input wrappers (Toggle/Select/Action), inject automatic ID generation and explicitly pair titles, descriptions, and controls. Always test focus rings with dual offset properties to ensure visibility across dynamic backgrounds.


## 2026-05-26 - Dynamic ARIA labels in media players
**Learning:** When adding ARIA labels to playback controls (like Play/Pause or Favorites), the labels must be strictly dynamic and tightly bound to the same React state driving the visual UI changes (e.g., `isPlaying ? "Pause" : "Play"`). Static labels on toggle buttons confuse screen readers.
**Action:** Always check the surrounding state variables of an icon-only button to see if it acts as a toggle before applying a static `aria-label`.
