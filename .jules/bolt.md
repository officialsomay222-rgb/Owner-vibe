## 2024-05-16 - Reduce App Lag via Hardware Acceleration
**Learning:** Heavy CSS properties like `backdrop-blur` and large `blur` filters on `absolute`/`fixed` positioned elements force constant repaints on the main thread (CPU), resulting in significant UI lag on lower-end mobile devices and WebViews.
**Action:** Always append GPU acceleration utilities (`transform-gpu will-change-transform`) to computationally expensive visual elements (blurs, fixed headers, nav bars) to offload rendering to the device's GPU, immediately dropping latency without altering visual fidelity.

## 2024-05-21 - Optimize useLocalStorage hook
**Learning:** The useLocalStorage hook can cause global performance issues and re-rendering loops if it relies on a generic `local-storage` event, parsing JSON for every key change even unrelated ones. Additionally, passing inline initial objects (e.g. `[]`) directly into the useEffect dependency array triggers infinite listener attachment loops.
**Action:** Utilize `useRef` for `initialValue` to stabilize the useEffect dependencies, and dispatch `CustomEvent` with a `detail.key` payload to filter updates strictly to the relevant keys.
