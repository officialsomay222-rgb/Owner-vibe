

## 2026-05-26 - Optimize useLocalStorage
**Learning:** In React, dispatching generic `Event`s to trigger state synchronization across components (like a custom  hook) causes massive performance bottlenecks because *every* mounted hook instance responds to every event, triggering  and cascading re-renders regardless of which state key actually changed.
**Action:** Use `CustomEvent` to pass the mutated key in the event `detail`, and add an early return in the hook's event listener () to ensure components only re-render when their specific data changes. Additionally, wrap inline parameters like `initialValue` in a `useRef` to prevent infinite effect triggers when passed as dependencies.

## 2024-05-26 - Optimize useLocalStorage hook updates
**Learning:** In React, dispatching generic `Event`s to trigger state synchronization across components (like a custom `useLocalStorage` hook) causes massive performance bottlenecks because *every* mounted hook instance responds to every event, triggering `JSON.parse()` and cascading re-renders regardless of which state key actually changed.
**Action:** Use `CustomEvent` to pass the mutated key in the event `detail`, and add an early return in the hook's event listener (`if (event.detail.key !== hookKey) return;`) to ensure components only re-render when their specific data changes. Additionally, wrap inline parameters like `initialValue` in a `useRef` to prevent infinite effect triggers when passed as dependencies.
