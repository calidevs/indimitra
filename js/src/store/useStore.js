import { create } from 'zustand';
import { defineUserAbility } from '../ability/defineAbility';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

export const useAuthStore = create((set) => ({
  user: null,
  ability: defineUserAbility(null),
  setUser: (user) => set({ user }),
  setAbility: (ability) => set({ ability }),
  logout: () => set({ user: null, ability: defineUserAbility(null) }),
}));

export default useStore;
