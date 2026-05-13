## 2025-05-13 - [MiniPlayer Accessibility]
**Learning:** Found an accessibility issue pattern where custom clickable `div`s lack the necessary ARIA attributes, tab indices, and keyboard event handlers. Also noted missing `aria-label`s on icon-only buttons.
**Action:** Applied `role="button"`, `tabIndex={0}`, `onKeyDown` and `focus-visible` to interactive `div`s. Provided dynamic and static `aria-label`s to icon-only buttons, alongside visible focus states. Ensure to proactively implement these on future interactive elements.
