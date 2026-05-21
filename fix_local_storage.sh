cat << 'DIFF' > patch.diff
--- src/hooks/useLocalStorage.ts
+++ src/hooks/useLocalStorage.ts
@@ -32,7 +32,7 @@
       // For cross-tab changes (StorageEvent)
       if (e.type === "storage") {
         const storageEvent = e as StorageEvent;
-        if (storageEvent.key !== key) return; // Only process changes for this key
+        if (storageEvent.key !== null && storageEvent.key !== key) return; // Only process changes for this key, or null if cleared
       }
       // For in-app changes (CustomEvent)
       else if (e.type === "local-storage") {
DIFF
patch -p0 < patch.diff
