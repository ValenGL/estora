// src/utils/pushManager.ts
import { supabase } from "./../lib/supabase/supabase";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
  userId: string
): Promise<PushSubscription> {
  try {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      throw new Error("VAPID_PUBLIC_KEY no está definida");
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      throw new Error("No se encontró un token de autenticación");
    }

    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription }),
    });

    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(error || "Error al suscribirse");
    }

    return subscription;
  } catch (error) {
    console.error("Error subscribing to push:", error);
    throw error;
  }
}
