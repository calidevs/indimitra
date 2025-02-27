import { create } from 'zustand';

const useStore = create((set, get) => ({
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
  // Cart count
  cartCount: () => Object.values(get().cart).reduce((acc, qty) => acc + qty, 0),
}));

export default useStore;
