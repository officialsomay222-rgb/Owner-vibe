## 2024-05-13 - [App Component Structure]
**Learning:** The React application puts all tab components (HomeTab, SearchTab, LibraryTab, SettingsTab) inside a single large file `App.tsx` (895 lines long), and they are conditionally rendered based on `activeTab`.
**Action:** Since these components aren't memoized and are defined as constants inside or alongside `App`, they re-render when `App` state changes, or they might re-render unnecessarily if not memoized. We should extract/memoize them or at least investigate if there are unnecessary re-renders.

## 2024-05-13 - [Context API Re-renders]
**Learning:** `useMusic` context returns `currentTime` which updates multiple times a second.
**Action:** Any component using `useMusic` re-renders every time `currentTime` updates. `HomeTab`, `SearchTab`, and `LibraryTab` all call `useMusic()`. This means that during playback, the entire current tab re-renders constantly.
If we can memoize the tabs or remove `currentTime` from the context (e.g. by using a global event emitter, or a separate context), we can prevent these re-renders.

What if we wrap the Context in a way that doesn't trigger re-renders, or just move `currentTime` out of `MusicContext`?
Wait! In `MusicContext.tsx`, `audioRef` is exposed in the context. We could remove `currentTime` and `duration` from the context, and have `MusicPlayer` and `MiniPlayer` manage `currentTime` via a local state and `useEffect` attaching to `audioRef.current`'s `timeupdate` event!
This would completely eliminate the global `currentTime` state, meaning `MusicContext` would only update when the song changes, play state changes, or queue changes, NOT every fraction of a second!
This is a HUGE performance win and very easy to implement without massive architecture changes.
