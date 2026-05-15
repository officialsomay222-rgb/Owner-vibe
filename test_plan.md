1. **Modify `YtDlpPlugin.java` to use external storage directory for downloads**:
   - Currently, `YtDlpPlugin.java` uses `getContext().getCacheDir()` for downloads. We need to change it to use the public `Environment.DIRECTORY_DOWNLOADS` or `Environment.DIRECTORY_MUSIC` so the songs are visible to the user outside the app and can be played offline easily. Alternatively, if the app itself handles the offline playback, we can use the app's external files directory. Wait, the user asked to "save in library download folder of app ok bro and song will be able to play offline".
   - Using `Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)` or a specific folder for the app in Downloads.
   - Wait, if it's saved in `getExternalFilesDir(Environment.DIRECTORY_MUSIC)`, it's local to the app but not in the global Downloads folder. The user said "save in library download folder of app". Let's put it in `Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)` inside a folder named "Owner Vibe".
   - Need to ensure permissions are handled (WRITE_EXTERNAL_STORAGE for API <= 28, MediaStore for API >= 29, but since we are just downloading to the public Downloads folder, we can use `Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)` directly on API >= 29 without permissions, or use MediaStore. A safer approach for API >= 29 is to just use `Context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)` for app-specific downloads, or use Capacitor's Filesystem plugin).
   - Let's look at `YtDlpPlugin.java`. We can change `File downloadDir = getContext().getCacheDir();` to `File downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);` or `File downloadDir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "Owner Vibe");`

2. **Handle downloads in React state**:
   - Update `MusicContext.tsx` or a new hook to track downloaded songs (store metadata in `localStorage`).
   - Add `downloadedSongs` state.
   - When user clicks "Download Song" in `MusicPlayer.tsx`, we call `musicService.downloadTrack()`.
   - Wait, `musicService.downloadTrack()` returns the `filePath`. We save this `filePath` along with the song metadata to the `downloadedSongs` array.
   - When playing a song, we can check if it's in `downloadedSongs`. If yes, we use the local `filePath` (or `Capacitor.convertFileSrc(filePath)`) as the `streamUrl`.

3. **Update `App.tsx` "Downloads" section**:
   - Currently, it has a dummy `Downloads` tab inside the Library section, or it's not fully functional.
   - Wait, `App.tsx` has `setLibraryView('downloads')`? Let's check.
