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

export const useAuthStore = create((set, get) => ({
  user: null,
  userProfile: null,
  ability: null,

  setUser: (user) => {
    set({ user });
  },

  setUserProfile: (userProfile) => {
    if (!userProfile) {
      console.warn('Attempted to set null userProfile!');
      return;
    }

    const profileCopy = JSON.parse(JSON.stringify(userProfile));

    set((state) => ({
      ...state,
      userProfile: profileCopy,
    }));
  },

  getUserProfile: () => get().userProfile,

  setAbility: (ability) => set({ ability }),

  logout: () => {
    set({ user: null, userProfile: null, ability: defineUserAbility(null) });
  },
}));

export default useStore;
