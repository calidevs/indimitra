import { create } from 'zustand';
import { defineUserAbility } from '../ability/defineAbility';
import { fetchAuthSession } from 'aws-amplify/auth';
import fetchGraphQL from '../config/graphql/graphqlService';
import {
  GET_USER_PROFILE,
  GET_ADDRESSES_BY_USER,
  CREATE_ADDRESS,
  UPDATE_ADDRESS,
  DELETE_ADDRESS,
} from '../queries/operations';

const useStore = create((set, get) => ({
  cart: {},
  selectedStore: null,
  availableStores: [],

  setAvailableStores: (stores) => set({ availableStores: stores }),

  setSelectedStore: (store) => set({ selectedStore: store }),

  getSelectedStore: () => get().selectedStore,

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

  // Calculate cart totals using store's delivery fee and tax
  getCartTotals: () => {
    const state = get();
    const cart = state.cart;
    const store = state.selectedStore;

    // Calculate subtotal
    const subtotal = Object.values(cart).reduce(
      (acc, item) => acc + (item.price * item.quantity || 0),
      0
    );

    // Get delivery fee from store or default to 0
    const deliveryFee = store?.storeDeliveryFee || 0;

    // Calculate tax using store's tax percentage or default to 0
    const taxPercentage = store?.taxPercentage || 0;
    const taxAmount = (subtotal * taxPercentage) / 100;

    // Get tip amount (default to 0)
    const tipAmount = state.tipAmount || 0;

    // Calculate total including tip
    const total = subtotal + deliveryFee + taxAmount + tipAmount;

    return {
      subtotal,
      deliveryFee,
      taxAmount,
      taxPercentage,
      tipAmount,
      total,
    };
  },

  // Add tip amount to the store
  setTipAmount: (amount) => set({ tipAmount: amount }),
}));

export const useAuthStore = create((set, get) => ({
  user: null,
  userProfile: null,
  ability: null,
  isProfileLoading: false,
  profileError: null,
  modalOpen: false,
  currentForm: 'login',

  setAbility: (ability) => {
    set({ ability });
  },

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

  setModalOpen: (open) => {
    set({ modalOpen: open });
  },

  getUserProfile: () => get().userProfile,

  setCurrentForm: (form) => {
    set({ currentForm: form });
  },

  setAbility: (ability) => set({ ability }),

  logout: () => {
    set({ user: null, userProfile: null, ability: defineUserAbility(null) });
  },

  fetchUserProfile: async (cognitoId) => {
    if (!cognitoId) return;

    set({ isProfileLoading: true });
    try {
      const response = await fetchGraphQL(GET_USER_PROFILE, { userId: cognitoId });
      console.log('GraphQL Response:', response); // Debug log

      if (response.errors) {
        console.error('Error fetching user profile:', response.errors);
        set({ isProfileLoading: false });
        return;
      }

      // Check if response is the data directly
      const userProfile = response.getUserProfile || response.data?.getUserProfile;
      console.log('Extracted user profile:', userProfile); // Debug log

      if (!userProfile) {
        console.error('No user profile data in response. Full response:', response);
        set({ isProfileLoading: false });
        return;
      }

      set({
        userProfile: userProfile,
        isProfileLoading: false,
        ability: defineUserAbility(userProfile.role),
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      set({ isProfileLoading: false });
    }
  },

  isProfileLoaded: () => !!get().userProfile,
}));

export const useAddressStore = create((set, get) => ({
  addresses: [],
  isLoading: false,
  error: null,
  selectedAddressId: null,

  setSelectedAddressId: (id) => set({ selectedAddressId: id }),

  fetchAddresses: async (userId) => {
    if (!userId) {
      console.warn('No user ID provided to fetchAddresses');
      return [];
    }

    set({ isLoading: true, error: null });

    try {
      const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      console.log('Fetching addresses for user ID:', numericUserId);

      const response = await fetchGraphQL(GET_ADDRESSES_BY_USER, { userId: numericUserId });
      console.log('Address data fetched:', response);

      const fetchedAddresses = response?.getAddressesByUser || [];
      console.log('Fetched addresses:', fetchedAddresses);

      set({
        addresses: fetchedAddresses,
        isLoading: false,
        selectedAddressId:
          fetchedAddresses.length > 0 && !get().selectedAddressId
            ? fetchedAddresses[0].id
            : get().selectedAddressId,
      });

      return fetchedAddresses;
    } catch (error) {
      console.error('Error fetching addresses:', error);
      set({
        error: error.message || 'Failed to fetch addresses',
        isLoading: false,
      });
      return [];
    }
  },

  createAddress: async (address, userId, isPrimary = false) => {
    if (!userId || !address) {
      console.warn('Missing required parameters for createAddress');
      return null;
    }

    set({ isLoading: true, error: null });

    try {
      const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;

      const response = await fetchGraphQL(CREATE_ADDRESS, {
        address,
        userId: numericUserId,
        isPrimary,
      });

      if (response?.createAddress) {
        set((state) => ({
          addresses: [...state.addresses, response.createAddress],
          isLoading: false,
        }));

        return response.createAddress;
      } else {
        throw new Error('Failed to create address');
      }
    } catch (error) {
      console.error('Error creating address:', error);
      set({
        error: error.message || 'Failed to create address',
        isLoading: false,
      });
      return null;
    }
  },

  updateAddress: async (addressId, address, isPrimary) => {
    if (!addressId) {
      console.warn('Missing addressId for updateAddress');
      return null;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetchGraphQL(UPDATE_ADDRESS, {
        addressId,
        address,
        isPrimary,
      });

      if (response?.updateAddress) {
        set((state) => ({
          addresses: state.addresses.map((addr) =>
            addr.id === addressId ? response.updateAddress : addr
          ),
          isLoading: false,
        }));

        return response.updateAddress;
      } else {
        throw new Error('Failed to update address');
      }
    } catch (error) {
      console.error('Error updating address:', error);
      set({
        error: error.message || 'Failed to update address',
        isLoading: false,
      });
      return null;
    }
  },

  deleteAddress: async (addressId) => {
    if (!addressId) {
      console.warn('Missing addressId for deleteAddress');
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetchGraphQL(DELETE_ADDRESS, { addressId });

      if (response?.deleteAddress) {
        set((state) => ({
          addresses: state.addresses.filter((addr) => addr.id !== addressId),
          isLoading: false,
          selectedAddressId: state.selectedAddressId === addressId ? null : state.selectedAddressId,
        }));

        return true;
      } else {
        throw new Error('Failed to delete address');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      set({
        error: error.message || 'Failed to delete address',
        isLoading: false,
      });
      return false;
    }
  },

  getSelectedAddress: () => {
    const { addresses, selectedAddressId } = get();
    return addresses.find((addr) => addr.id === selectedAddressId) || null;
  },
}));

export default useStore;
