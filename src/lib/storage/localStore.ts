// Abstraction over localStorage/Zustand so SQLite can be swapped in later.
// All persistence calls go through these functions — UI components never touch storage directly.

export interface StorageAdapter<T> {
  getAll: () => T[];
  getById: (id: string) => T | undefined;
  save: (item: T) => void;
  update: (id: string, updates: Partial<T>) => void;
  remove: (id: string) => void;
}

// For now this is a thin pass-through; the actual state lives in Zustand.
// When SQLite is added, swap the implementation here without touching any UI.
export function createLocalAdapter<T extends { id: string }>(
  getItems: () => T[],
  setItems: (items: T[]) => void
): StorageAdapter<T> {
  return {
    getAll: getItems,
    getById: (id) => getItems().find(item => item.id === id),
    save: (item) => setItems([...getItems(), item]),
    update: (id, updates) => setItems(getItems().map(i => i.id === id ? { ...i, ...updates } : i)),
    remove: (id) => setItems(getItems().filter(i => i.id !== id)),
  };
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
