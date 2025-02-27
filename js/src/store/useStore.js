import { create } from 'zustand';
import { defineUserAbility } from '../ability/defineAbility';

const useStore = create((set) => ({
  cart: {},
  addToCart: (productId) =>
    set((state) => ({
      cart: {
        ...state.cart,
        [productId]: (state.cart[productId] || 0) + 1,
      },
    })),
  removeFromCart: (productId) =>
    set((state) => {
      const updatedCart = { ...state.cart };
      if (updatedCart[productId] > 1) {
        updatedCart[productId] -= 1;
      } else {
        delete updatedCart[productId];
      }
      return { cart: updatedCart };
    }),
}));

export const useAuthStore = create((set) => ({
  user: null,
  ability: defineUserAbility(null),
  setUser: (user) => set({ user }),
  setAbility: (ability) => set({ ability }),
  logout: () => set({ user: null, ability: defineUserAbility(null) }),
}));

export default useStore;
