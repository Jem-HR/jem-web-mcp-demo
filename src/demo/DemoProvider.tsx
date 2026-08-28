import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";

import { createDemoCapabilities, type DemoCapabilities } from "./capabilities";
import { createDemoStore } from "./store";
import type { DemoState, DemoStore } from "./types";

const StoreContext = createContext<DemoStore | null>(null);
const CapabilitiesContext = createContext<DemoCapabilities | null>(null);
const missingProviderMessage = "DemoProvider is required.";

export interface DemoProviderProps extends PropsWithChildren {
  store?: DemoStore;
}

export function DemoProvider({
  children,
  store: providedStore,
}: DemoProviderProps) {
  const [store] = useState<DemoStore>(() => providedStore ?? createDemoStore());

  const capabilities = useMemo(() => createDemoCapabilities(store), [store]);

  return (
    <StoreContext.Provider value={store}>
      <CapabilitiesContext.Provider value={capabilities}>
        {children}
      </CapabilitiesContext.Provider>
    </StoreContext.Provider>
  );
}

// Shared hooks intentionally live beside their provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useDemoStore(): DemoStore {
  const store = useContext(StoreContext);
  if (store === null) {
    throw new Error(missingProviderMessage);
  }
  return store;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDemoCapabilities(): DemoCapabilities {
  const capabilities = useContext(CapabilitiesContext);
  if (capabilities === null) {
    throw new Error(missingProviderMessage);
  }
  return capabilities;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDemoSelector<T>(selector: (state: DemoState) => T): T {
  const store = useDemoStore();
  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState,
  );
  return selector(state);
}
