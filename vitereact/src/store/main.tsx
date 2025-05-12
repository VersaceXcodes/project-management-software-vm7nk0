import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { io, Socket } from "socket.io-client";
import axios from "axios";

// Define interfaces
interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  profile_picture_url: string | null;
  notification_settings: any;
  created_at: string;
  updated_at: string;
}

interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  related_project_id?: string;
  related_task_id?: string;
  read_status: number;
  created_at: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface GlobalState {
  auth_token: string;
  current_user: User | null;
  is_authenticated: boolean;
  notification_list: Notification[];
  unread_notification_count: number;
  is_socket_connected: boolean;
  global_search_query: string;
  breadcrumb_path: BreadcrumbItem[];
  active_nav_item: string;
  socket_instance: Socket | null;
}

// Initial state 
const initial_state: GlobalState = {
  auth_token: "",
  current_user: null,
  is_authenticated: false,
  notification_list: [],
  unread_notification_count: 0,
  is_socket_connected: false,
  global_search_query: "",
  breadcrumb_path: [],
  active_nav_item: "dashboard",
  socket_instance: null,
};

// Create a slice for global state
const globalSlice = createSlice({
  name: "global",
  initialState: initial_state,
  reducers: {
    set_auth_token(state, action: PayloadAction<string>) {
      state.auth_token = action.payload;
    },
    set_current_user(state, action: PayloadAction<User | null>) {
      state.current_user = action.payload;
    },
    set_is_authenticated(state, action: PayloadAction<boolean>) {
      state.is_authenticated = action.payload;
    },
    set_notification_list(state, action: PayloadAction<Notification[]>) {
      state.notification_list = action.payload;
      state.unread_notification_count = action.payload.filter(
        (n) => n.read_status === 0
      ).length;
    },
    add_notification(state, action: PayloadAction<Notification>) {
      state.notification_list.push(action.payload);
      state.unread_notification_count = state.notification_list.filter(
        (n) => n.read_status === 0
      ).length;
    },
    mark_notification_read(state, action: PayloadAction<string>) {
      const notif = state.notification_list.find((n) => n.id === action.payload);
      if (notif) {
        notif.read_status = 1;
      }
      state.unread_notification_count = state.notification_list.filter(
        (n) => n.read_status === 0
      ).length;
    },
    set_is_socket_connected(state, action: PayloadAction<boolean>) {
      state.is_socket_connected = action.payload;
    },
    set_global_search_query(state, action: PayloadAction<string>) {
      state.global_search_query = action.payload;
    },
    set_breadcrumb_path(state, action: PayloadAction<BreadcrumbItem[]>) {
      state.breadcrumb_path = action.payload;
    },
    set_active_nav_item(state, action: PayloadAction<string>) {
      state.active_nav_item = action.payload;
    },
    set_socket_instance(state, action: PayloadAction<Socket | null>) {
      state.socket_instance = action.payload;
    },
  },
});

export const {
  set_auth_token,
  set_current_user,
  set_is_authenticated,
  set_notification_list,
  add_notification,
  mark_notification_read,
  set_is_socket_connected,
  set_global_search_query,
  set_breadcrumb_path,
  set_active_nav_item,
  set_socket_instance,
} = globalSlice.actions;

// Persist config: Do not persist the socket_instance.
const persist_config = {
  key: "root",
  storage,
  blacklist: ["socket_instance"],
};

const persistedReducer = persistReducer(persist_config, globalSlice.reducer);

// Create the Redux store
const store = configureStore({
  reducer: {
    global: persistedReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore socket_instance as it is non-serializable.
        ignoredPaths: ["global.socket_instance"],
      },
    }),
});

// Create persistor for redux-persist
export const persistor = persistStore(store);

// Define RootState and AppDispatch types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Socket connection management
let previous_auth_token = store.getState().global.auth_token;

store.subscribe(() => {
  const state = store.getState();
  const { auth_token, socket_instance } = state.global;

  // If auth_token is set and no socket exists, initialize the socket
  if (auth_token && !socket_instance) {
    const socket_url =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const socket = io(socket_url, {
      auth: { token: auth_token },
    });
    store.dispatch(set_socket_instance(socket));

    socket.on("connect", () => {
      store.dispatch(set_is_socket_connected(true));
    });
    socket.on("disconnect", () => {
      store.dispatch(set_is_socket_connected(false));
    });
    socket.on("notification_event", (data: Notification) => {
      store.dispatch(add_notification(data));
    });
    socket.on("task_update_event", (data: any) => {
      console.log("Received task_update_event", data);
    });
    socket.on("comment_event", (data: any) => {
      console.log("Received comment_event", data);
    });
  }

  // If auth_token is removed and a socket exists, disconnect it
  if (!auth_token && socket_instance) {
    socket_instance.disconnect();
    store.dispatch(set_socket_instance(null));
    store.dispatch(set_is_socket_connected(false));
  }
  previous_auth_token = auth_token;
});

export default store;