## 2024-05-16 - Reduce App Lag via Hardware Acceleration
**Learning:** Heavy CSS properties like `backdrop-blur` and large `blur` filters on `absolute`/`fixed` positioned elements force constant repaints on the main thread (CPU), resulting in significant UI lag on lower-end mobile devices and WebViews.
**Action:** Always append GPU acceleration utilities (`transform-gpu will-change-transform`) to computationally expensive visual elements (blurs, fixed headers, nav bars) to offload rendering to the device's GPU, immediately dropping latency without altering visual fidelity.

## 2026-05-25 - Optimize useLocalStorage hook
**Learning:** The custom 'local-storage' event mechanism previously used a global, payload-less event, causing every component using `useLocalStorage` to re-parse JSON and potentially re-render regardless of which key changed. This created an O(N) event storm.
**Action:** Always dispatch custom storage events as a `CustomEvent` with a `detail.key` payload, and add an early return in the listener (`if (event.detail.key !== key) return`) to ensure only the specific hook tracking the changed key executes.
