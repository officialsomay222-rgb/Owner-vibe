

## 2026-05-25 - Missing Accessible Labels on Core Media Controls
**Learning:** Core interactive elements like play, pause, shuffle, and next track buttons frequently use icon-only designs without `aria-label` or `title` attributes, severely harming usability for screen reader and mouse users in this app.
**Action:** Always provide dynamic `aria-label` and `title` attributes that reflect the current state (e.g., "Pause" when playing, "Disable shuffle" when active) to all icon-only buttons.
