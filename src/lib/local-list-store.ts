/**
 * Lista persistida en localStorage, compatible con useSyncExternalStore.
 * Sincroniza entre pestañas y funciona en memoria si el almacenamiento está bloqueado.
 */
export function createLocalListStore<T>(key: string, isValid: (value: unknown) => value is T) {
  const EMPTY: T[] = [];
  let items: T[] | null = null;
  const listeners = new Set<() => void>();

  function read(): T[] {
    if (items) return items;
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(key) || "[]");
      items = Array.isArray(parsed) ? parsed.filter(isValid) : [];
    } catch {
      items = [];
    }
    return items;
  }

  function write(next: T[]) {
    items = next;
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Almacenamiento no disponible (modo privado): la lista vive solo en memoria.
    }
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) {
        items = null;
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return { subscribe, getSnapshot: read, getServerSnapshot: () => EMPTY, read, write };
}
