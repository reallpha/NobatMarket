"use client";

import * as React from "react";

type ToastVariant = "default" | "destructive";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastState {
  toasts: Toast[];
}

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: { type: "ADD_TOAST" | "UPDATE_TOAST" | "DISMISS_TOAST" | "REMOVE_TOAST"; toast?: Toast }) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

function reducer(state: ToastState, action: { type: string; toast?: Toast }): ToastState {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast!, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case "DISMISS_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast?.id ? { ...t } : t)),
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toast?.id),
      };
    default:
      return state;
  }
}

function toast({
  title,
  description,
  variant,
}: Omit<Toast, "id">) {
  const id = genId();

  dispatch({
    type: "ADD_TOAST",
    toast: { id, title, description, variant },
  });

  setTimeout(() => {
    dispatch({ type: "REMOVE_TOAST", toast: { id } });
  }, TOAST_REMOVE_DELAY);

  return id;
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => {
      dispatch({ type: "DISMISS_TOAST", toast: { id: toastId || "" } });
    },
  };
}

export { useToast, toast };
