import { create } from 'zustand';
import { defineUserAbility } from '../ability/defineAbility';

const useStore = create((set, get) => ({
  cart: {},

  addToCart: (product) =>
    set((state) => ({
      cart: {
        ...state.cart,
        [product.id]: {
          ...(state.cart[product.id] || product),
          quantity: (state.cart[product.id]?.quantity || 0) + 1,
        },
      },
    })),

  removeFromCart: (productId) =>
    set((state) => {
      if (!state.cart[productId]) return state;

      const updatedCart = { ...state.cart };
      if (updatedCart[productId].quantity > 1) {
        updatedCart[productId].quantity -= 1;
      } else {
        delete updatedCart[productId];
      }
      return { cart: updatedCart };
    }),

  cartCount: () => Object.values(get().cart).reduce((acc, item) => acc + (item.quantity || 0), 0),

  cartTotal: () =>
    Object.values(get().cart).reduce(
      (acc, item) => acc + (item?.price || 0) * (item?.quantity || 0),
      0
    ),

  clearCart: () => set({ cart: {} }),
}));

export const useAuthStore = create((set) => ({
  user: null,
  ability: defineUserAbility(null),
  setUser: (user) => set({ user }),
  setAbility: (ability) => set({ ability }),
  logout: () => set({ user: null, ability: defineUserAbility(null) }),
}));

export default useStore;
