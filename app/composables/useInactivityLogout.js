import {
  SESSION_ACTIVITY_STORAGE_KEY,
  SESSION_INACTIVITY_TIMEOUT_MS,
} from "~/constants/session";

const ACTIVITY_EVENTS = [
  "click",
  "keydown",
  "mousemove",
  "pointerdown",
  "scroll",
  "touchstart",
];

export function useInactivityLogout(options = {}) {
  const {
    timeoutMs = SESSION_INACTIVITY_TIMEOUT_MS,
    storageKey = SESSION_ACTIVITY_STORAGE_KEY,
  } = options;

  const authStore = useAuthStore();
  const timerId = shallowRef(null);
  const isLoggingOut = shallowRef(false);
  let lastActivityWrite = 0;

  function clearTimer() {
    if (!timerId.value) return;
    window.clearTimeout(timerId.value);
    timerId.value = null;
  }

  function getStoredActivityTime() {
    const storedValue = Number(window.localStorage.getItem(storageKey));
    return Number.isFinite(storedValue) && storedValue > 0 ? storedValue : null;
  }

  function writeActivityTime(value = Date.now()) {
    window.localStorage.setItem(storageKey, String(value));
  }

  async function logoutForInactivity() {
    if (isLoggingOut.value || !authStore.isAuthenticated) return;

    isLoggingOut.value = true;
    clearTimer();

    try {
      window.localStorage.removeItem(storageKey);
      await authStore.logout();
    } finally {
      isLoggingOut.value = false;
    }
  }

  function scheduleLogoutCheck() {
    clearTimer();
    if (!authStore.isAuthenticated || isLoggingOut.value) return;

    const lastActivityAt = getStoredActivityTime();
    if (!lastActivityAt) {
      writeActivityTime();
      timerId.value = window.setTimeout(logoutForInactivity, timeoutMs);
      return;
    }

    const remainingMs = timeoutMs - (Date.now() - lastActivityAt);
    if (remainingMs <= 0) {
      logoutForInactivity();
      return;
    }

    timerId.value = window.setTimeout(logoutForInactivity, remainingMs);
  }

  function recordActivity() {
    if (!authStore.isAuthenticated || isLoggingOut.value) return;

    const now = Date.now();
    if (now - lastActivityWrite < 1000) return;

    lastActivityWrite = now;
    writeActivityTime(now);
    scheduleLogoutCheck();
  }

  function handleVisibilityChange() {
    if (document.visibilityState === "visible") {
      scheduleLogoutCheck();
    }
  }

  function handleStorageEvent(event) {
    if (event.key === storageKey) {
      if (event.newValue === null) {
        logoutForInactivity();
        return;
      }

      scheduleLogoutCheck();
    }
  }

  onMounted(() => {
    if (!authStore.isAuthenticated) return;

    if (!getStoredActivityTime()) writeActivityTime();
    scheduleLogoutCheck();

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });
    window.addEventListener("storage", handleStorageEvent);
    document.addEventListener("visibilitychange", handleVisibilityChange);
  });

  onUnmounted(() => {
    clearTimer();
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.removeEventListener(eventName, recordActivity);
    });
    window.removeEventListener("storage", handleStorageEvent);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  });

  watch(
    () => authStore.isAuthenticated,
    (isAuthenticated) => {
      if (!import.meta.client) return;

      if (isAuthenticated) {
        if (!getStoredActivityTime()) writeActivityTime();
        scheduleLogoutCheck();
      } else {
        clearTimer();
        window.localStorage.removeItem(storageKey);
      }
    },
  );

  return {
    timeoutMs,
    recordActivity,
    scheduleLogoutCheck,
  };
}
