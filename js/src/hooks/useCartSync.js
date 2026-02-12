import { useEffect, useRef } from 'react';
import useStore from '@/store/useStore';
import { useAuthStore } from '@/store/useStore';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_SAVED_CART, SAVE_CART_MUTATION, DELETE_SAVED_CART } from '@/queries/operations';

const DEBOUNCE_MS = 1000;

function isCartEmpty(cartState) {
  if (!cartState) return true;
  const hasItems = cartState.cart && Object.keys(cartState.cart).length > 0;
  const hasCustomOrder = !!cartState.customOrder;
  const hasListInputAnswers =
    cartState.listInputAnswers && Object.keys(cartState.listInputAnswers).length > 0;
  return !hasItems && !hasCustomOrder && !hasListInputAnswers;
}

export default function useCartSync() {
  const userProfile = useAuthStore((s) => s.userProfile);
  const selectedStore = useStore((s) => s.selectedStore);
  const restoreCart = useStore((s) => s.restoreCart);
  const getCartState = useStore((s) => s.getCartState);

  const hasLoadedRef = useRef(false);
  const prevUserIdRef = useRef(null);
  const prevStoreIdRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const isSavingRef = useRef(false);

  const userId = userProfile?.id;
  const storeId = selectedStore?.id;

  // Load server cart on login or store change
  useEffect(() => {
    if (!userId || !storeId) {
      hasLoadedRef.current = false;
      return;
    }

    const userChanged = prevUserIdRef.current !== userId;
    const storeChanged = prevStoreIdRef.current !== storeId;

    prevUserIdRef.current = userId;
    prevStoreIdRef.current = storeId;

    if (!userChanged && !storeChanged && hasLoadedRef.current) return;

    let cancelled = false;

    async function loadServerCart() {
      try {
        const response = await fetchGraphQL(GET_SAVED_CART, { userId, storeId });
        if (cancelled) return;

        const serverCart = response?.getSavedCart;
        const localCartState = getCartState();
        const localEmpty = isCartEmpty(localCartState);

        if (localEmpty && serverCart?.cartData) {
          // Local empty, restore from server
          restoreCart(serverCart.cartData);
          // Also snapshot to per-store localStorage
          try {
            localStorage.setItem(
              `indimitra-cart-store-${storeId}`,
              JSON.stringify(serverCart.cartData)
            );
          } catch (e) { /* ignore */ }
        } else if (!localEmpty) {
          // Local has data, save to server
          await fetchGraphQL(SAVE_CART_MUTATION, {
            userId,
            storeId,
            cartData: localCartState,
          });
        }
      } catch (err) {
        console.error('Cart sync: failed to load server cart', err);
      } finally {
        if (!cancelled) hasLoadedRef.current = true;
      }
    }

    loadServerCart();

    return () => {
      cancelled = true;
    };
  }, [userId, storeId]);

  // Debounced save on cart changes (only when logged in and initial load done)
  useEffect(() => {
    if (!userId || !storeId) return;

    const unsub = useStore.subscribe((state, prevState) => {
      if (!hasLoadedRef.current) return;

      // Check if cart-related state changed
      const changed =
        state.cart !== prevState.cart ||
        state.customOrder !== prevState.customOrder ||
        state.listInputAnswers !== prevState.listInputAnswers ||
        state.deliveryType !== prevState.deliveryType ||
        state.tipAmount !== prevState.tipAmount ||
        state.pickupAddress !== prevState.pickupAddress;

      if (!changed) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        if (isSavingRef.current) return;
        isSavingRef.current = true;

        try {
          const cartState = useStore.getState().getCartState();
          const currentUserId = prevUserIdRef.current;
          const currentStoreId = prevStoreIdRef.current;

          if (!currentUserId || !currentStoreId) return;

          // Also update per-store localStorage snapshot
          try {
            localStorage.setItem(
              `indimitra-cart-store-${currentStoreId}`,
              JSON.stringify(cartState)
            );
          } catch (e) { /* ignore */ }

          if (isCartEmpty(cartState)) {
            await fetchGraphQL(DELETE_SAVED_CART, {
              userId: currentUserId,
              storeId: currentStoreId,
            });
          } else {
            await fetchGraphQL(SAVE_CART_MUTATION, {
              userId: currentUserId,
              storeId: currentStoreId,
              cartData: cartState,
            });
          }
        } catch (err) {
          console.error('Cart sync: failed to save cart', err);
        } finally {
          isSavingRef.current = false;
        }
      }, DEBOUNCE_MS);
    });

    return () => {
      unsub();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [userId, storeId]);
}
