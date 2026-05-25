

## 2025-05-25 - Fix Accessible MiniPlayer Interaction
**Learning:** Nested interactive elements (like a click handler on a div containing play/pause buttons) are an accessibility anti-pattern. Screen readers and keyboard navigation might conflict.
**Action:** Replaced the div `onClick` with a hidden `<button>` layer stretching across the component, placed via absolute positioning (`z-0 inset-0`), acting as the primary interactable background. Used `pointer-events-none` on other wrapper elements and `pointer-events-auto` on the explicit nested buttons (Play, Skip) to allow click-through while maintaining independent interactability.
