## 2024-05-16 - Reduce App Lag via Hardware Acceleration
**Learning:** Heavy CSS properties like `backdrop-blur` and large `blur` filters on `absolute`/`fixed` positioned elements force constant repaints on the main thread (CPU), resulting in significant UI lag on lower-end mobile devices and WebViews.
**Action:** Always append GPU acceleration utilities (`transform-gpu will-change-transform`) to computationally expensive visual elements (blurs, fixed headers, nav bars) to offload rendering to the device's GPU, immediately dropping latency without altering visual fidelity.

## 2026-05-24 - Optimize useLocalStorage Hook Event Payload
**Learning:** Global local-storage events triggered re-parsing in all instances of useLocalStorage, while inline initialValues caused infinite listener re-attachment cycles, degrading performance.
**Action:** Use CustomEvent with a detail payload for precise key matching and wrap initialValue in a useRef to maintain stable references across renders.
