import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type GroupStore = {
  selectedGroupId: string | null;
  setGroupId: (id: string) => void;
  clearGroupId: () => void;
};

export const useGroupStore = create<GroupStore>()(
  devtools(
    (set) => ({
      selectedGroupId: null,
      setGroupId: (id) => set({ selectedGroupId: id }),
      clearGroupId: () => set({ selectedGroupId: null }),
    }),
    { name: 'group-store' }
  )
);
