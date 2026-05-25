## 2024-05-16 - Reduce App Lag via Hardware Acceleration
**Learning:** Heavy CSS properties like `backdrop-blur` and large `blur` filters on `absolute`/`fixed` positioned elements force constant repaints on the main thread (CPU), resulting in significant UI lag on lower-end mobile devices and WebViews.
**Action:** Always append GPU acceleration utilities (`transform-gpu will-change-transform`) to computationally expensive visual elements (blurs, fixed headers, nav bars) to offload rendering to the device's GPU, immediately dropping latency without altering visual fidelity.

## 2024-05-25 - Prevent useLocalStorage Re-renders
**Learning:** The previous `useLocalStorage` hook was causing excessive re-renders because inline array/object initialization (e.g. `useLocalStorage("key", [])`) would trigger the `useEffect` on every render since its reference changed, removing/adding event listeners. Additionally, dispatching generic `local-storage` events triggered re-renders across all hook instances simultaneously.
**Action:** Wraps `initialValue` in a `useRef` to maintain stability, dispatches a `CustomEvent` with `{ detail: { key } }` payload to update only the specific subscriber, and uses a `stateRef` for the latest value inside `useCallback` to avoid dependency loops.
