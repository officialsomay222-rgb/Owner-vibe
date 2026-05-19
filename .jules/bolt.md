## 2024-05-16 - Reduce App Lag via Hardware Acceleration
**Learning:** Heavy CSS properties like `backdrop-blur` and large `blur` filters on `absolute`/`fixed` positioned elements force constant repaints on the main thread (CPU), resulting in significant UI lag on lower-end mobile devices and WebViews.
**Action:** Always append GPU acceleration utilities (`transform-gpu will-change-transform`) to computationally expensive visual elements (blurs, fixed headers, nav bars) to offload rendering to the device's GPU, immediately dropping latency without altering visual fidelity.

## 2025-05-19 - useLocalStorage Event Optimization
**Learning:** `useLocalStorage` generated many global re-renders because it used a generic `"local-storage"` Event without targeting a specific key. Additionally, inline array initial values (e.g. `[]`) were originally excluded from dependencies to prevent infinite loops, but using deep equality checking allows safer synchronization.
**Action:** Use `CustomEvent` and dispatch the target `key` in the `detail` payload (`e.detail.key`). Check this key in the listener to prevent executing React state updates for unrelated keys. Use deep equality checking (`JSON.stringify`) to compare the stored value vs the new value before triggering a re-render.
