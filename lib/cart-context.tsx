"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "UPDATE_QUANTITY"; id: string; quantity: number }
  | { type: "CLEAR" };

const CartContext = createContext<
  | {
      items: CartItem[];
      totalItems: number;
      totalPrice: number;
      addItem: (item: CartItem) => void;
      removeItem: (id: string) => void;
      updateQuantity: (id: string, quantity: number) => void;
      clearCart: () => void;
    }
  | undefined
>(undefined);

const initialState: CartState = { items: [] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((item) => item.id === action.item.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === action.item.id
              ? { ...item, quantity: item.quantity + action.item.quantity }
              : item
          ),
        };
      }
      return { items: [...state.items, action.item] };
    }
    case "REMOVE_ITEM":
      return { items: state.items.filter((item) => item.id !== action.id) };
    case "UPDATE_QUANTITY":
      return {
        items: state.items
          .map((item) =>
            item.id === action.id
              ? { ...item, quantity: action.quantity }
              : item
          )
          .filter((item) => item.quantity > 0),
      };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const totalItems = useMemo(
    () => state.items.reduce((sum, item) => sum + item.quantity, 0),
    [state.items]
  );

  const totalPrice = useMemo(
    () =>
      state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [state.items]
  );

  const value = useMemo(
    () => ({
      items: state.items,
      totalItems,
      totalPrice,
      addItem: (item: CartItem) => dispatch({ type: "ADD_ITEM", item }),
      removeItem: (id: string) => dispatch({ type: "REMOVE_ITEM", id }),
      updateQuantity: (id: string, quantity: number) =>
        dispatch({ type: "UPDATE_QUANTITY", id, quantity }),
      clearCart: () => dispatch({ type: "CLEAR" }),
    }),
    [state.items, totalItems, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
