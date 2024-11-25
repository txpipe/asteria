import { create } from 'zustand';

export interface Challenge {
  label: string;
  policyId: string;
  network: string;
}

export interface ChallengeStoreState {
  selected: number|null;
  challenges: Challenge[];
  select: (index: number) => void;
  current: () => Challenge;
}

export const useChallengeStore = create<ChallengeStoreState>((set, get) => ({
  selected: null,
  challenges: [{
    label: 'Builder fest workshop',
    policyId: 'ecb96725c35e957f96be46bc1873cc8ae5b134f1b00f457675700511',
    network: 'preview',
  }],
  current: () => get().challenges[get().selected!],
  select: (index: number) => {
    const storePolicyId = (db: IDBDatabase) => {
      const tx = db.transaction('FILE_DATA', 'readwrite').objectStore('FILE_DATA').put(
        {
          contents: new TextEncoder().encode(get().challenges[index].policyId),
          timestamp: new Date(),
          mode: 33206,
        },
        '/userfs/godot/app_userdata/visualizer/api_url'
      );
      tx.onsuccess = () => set(() => ({ selected: index }));
      tx.onerror = () => set(() => ({ selected: index }));
    }

    set(() => ({ selected: null }));
    const request = window.indexedDB.open('/userfs');
    request.onupgradeneeded = (event) => {
      const db = request.result;
      db.createObjectStore('FILE_DATA');
      const tx = (event.target as any).transaction;
      tx.oncomplete = () => storePolicyId(db);
      tx.onerror = () => set(() => ({ selected: index }));
    };
    request.onsuccess = () => {
      const db = request.result;
      storePolicyId(db);
    };
  },
}));
