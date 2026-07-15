import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { io } from "socket.io-client";
import { auth } from "../firebase/config";
import { food_list as staticFoodList } from "../assets/assets";
import { StoreContext } from "./StoreContext";
import { useToast } from "../hooks/useToast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Map id -> bundled image so a menu loaded from the API still shows the
// local images for the seeded items (avoids needing to host the photos).
const imageById = {};
staticFoodList.forEach((f) => {
  imageById[f._id] = f.image;
});

// Resolve an image for a menu item: prefer the bundled asset, otherwise
// fall back to a file uploaded through the admin panel (served by the API).
const resolveImage = (item) => {
  if (imageById[item._id]) return imageById[item._id];
  if (item.image) return `${API_URL}/images/${item.image}`;
  return "";
};

const CART_STORAGE_KEY = "cartItems";

const loadCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState(loadCart); // restored from localStorage
  const [foodList, setFoodList] = useState(staticFoodList); // static fallback until API responds
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profile, setProfile] = useState(null);
  const [socket, setSocket] = useState(null);
  const toast = useToast();

  const loadMenu = async () => {
    try {
      const res = await fetch(`${API_URL}/api/food/list`);
      const json = await res.json();
      if (json?.success && Array.isArray(json.data) && json.data.length) {
        setFoodList(json.data.map((item) => ({ ...item, image: resolveImage(item) })));
      }
    } catch {
      console.warn("Menu API unavailable, using bundled menu.");
    }
  };

  useEffect(() => {
    // Wrapped so state updates happen inside an async callback (after await),
    // not synchronously in the effect body.
    (async () => {
      await loadMenu();
    })();
  }, []);

  // Persist the cart so it survives refreshes and the Stripe redirect round-trip.
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        setProfile(null); // clear profile on sign-out
        setSocket(null);
      }
    });
    return unsub;
  }, []);

  // Real-time channel. Everyone (guests included) connects so the storefront
  // menu updates live when an admin adds/edits/enables/disables an item.
  // Logged-in customers additionally get private `order:status` updates.
  useEffect(() => {
    if (!authReady) return;
    let active = true;
    let s;
    (async () => {
      const fbToken = user ? await auth.currentUser?.getIdToken().catch(() => null) : null;
      if (!active) return;
      s = io(API_URL, {
        auth: fbToken ? { firebaseToken: fbToken } : {},
        transports: ["websocket", "polling"],
      });
      // Live menu changes — refresh the storefront list for all visitors.
      s.on("menu:changed", () => { loadMenu(); });
      // Private delivery-status updates for the signed-in customer.
      s.on("order:status", ({ status }) => {
        toast.info(`Delivery update: your order is now "${status}".`);
      });
      setSocket(s);
    })();
    return () => {
      active = false;
      if (s) s.disconnect();
    };
  }, [authReady, user, toast]);

  const getToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  const logout = () => signOut(auth);

  // ── Customer profile (name + default delivery address) ──
  // Profile is cleared on sign-out inside the auth listener above.
  useEffect(() => {
    if (!authReady || !user) return;
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch(`${API_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) setProfile(json.data);
      } catch {
        // Non-fatal — profile just won't pre-fill.
      }
    })();
  }, [authReady, user]);

  const saveProfile = async (payload) => {
    const token = await getToken();
    if (!token) return { success: false, message: "Please sign in first." };
    try {
      const res = await fetch(`${API_URL}/api/user/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) setProfile(json.data);
      return json;
    } catch {
      return { success: false, message: "Could not reach the server." };
    }
  };

  // ── Cart ──────────────────────────────────────────────
  const addToCart = (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) => {
      const next = { ...prev };
      const current = next[itemId] || 0;
      if (current <= 1) delete next[itemId];
      else next[itemId] = current - 1;
      return next;
    });
  };

  const clearCart = () => setCartItems({});

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        const itemInfo = foodList.find((product) => product._id === item);
        if (itemInfo) totalAmount += cartItems[item] * itemInfo.price;
      }
    }
    return totalAmount;
  };

  // ── Orders ────────────────────────────────────────────
  const placeOrder = async ({ address, promoCode, paymentMethod }) => {
    const token = await getToken();
    if (!token) return { success: false, message: "Please sign in to place an order." };
    try {
      const res = await fetch(`${API_URL}/api/order/place`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: cartItems, address, promoCode, paymentMethod }),
      });
      // Cart is cleared only once payment is confirmed (COD path, or after
      // returning from Stripe on the Verify page).
      return await res.json();
    } catch {
      return { success: false, message: "Could not reach the server." };
    }
  };

  const contextValue = {
    API_URL,
    food_list: foodList,
    refreshMenu: loadMenu,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    clearCart,
    getTotalCartAmount,
    user,
    authReady,
    profile,
    saveProfile,
    socket,
    getToken,
    logout,
    showLogin,
    setShowLogin,
    searchQuery,
    setSearchQuery,
    placeOrder,
  };

  return <StoreContext.Provider value={contextValue}>{props.children}</StoreContext.Provider>;
};

export default StoreContextProvider;
