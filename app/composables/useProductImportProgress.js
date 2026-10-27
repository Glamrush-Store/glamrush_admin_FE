import { createImportPoller } from "~/utils/productImports";
import { useProductImportStore } from "~/stores/productImport";
import { useToast } from "primevue/usetoast";

export function useProductImportProgress(id, allowed) {
  const store = useProductImportStore();
  const toast = useToast();
  const record = ref(null);
  const error = shallowRef("");
  const loading = shallowRef(false);
  let poller;
  watch([id, allowed], ([value, permitted], _, cleanup) => {
    record.value = null;
    error.value = "";
    if (!permitted) return;
    const activePoller = createImportPoller({
      async load() {
        loading.value = true;
        try { return await store.fetchImport(value); }
        finally { loading.value = false; }
      },
      onData(data) { record.value = data; error.value = ""; },
      onError(exception) {
        const message = exception.status === 403 ? "You do not have permission to view this import." : exception.message || "Unable to refresh import.";
        if (error.value !== message) toast.add({ severity: "error", summary: "Import refresh failed", detail: message, life: 5000 });
        error.value = message;
      },
    });
    poller = activePoller;
    activePoller.start();
    cleanup(() => activePoller.stop());
  }, { immediate: true });
  return { record, error, loading, refresh: () => poller?.refresh() };
}
