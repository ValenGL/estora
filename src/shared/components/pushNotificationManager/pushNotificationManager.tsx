// src/components/PushNotificationManager.tsx
"use client";

import { useEffect, useState } from "react";
import Button from "../button/button";
import { supabase } from "./../../../app/lib/supabase/supabase";
import { subscribeToPush } from "./../../../app/utils/pushManage";

export default function PushNotificationManager({
  userId,
}: {
  userId?: string;
}) {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    const sub = await registration.pushManager.getSubscription();
    setSubscription(sub);
  }

  async function subscribeToPushNotifications() {
    if (!userId) return;
    const registration = await navigator.serviceWorker.ready;
    const sub = await subscribeToPush(registration, userId);
    setSubscription(sub);
  }

  async function unsubscribeFromPush() {
    if (!subscription || !userId) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    await subscription.unsubscribe();
    setSubscription(null);
  }

  if (!isSupported) {
    return (
      <p>Push notifications are not supported by this browser</p>
    );
  }

  return (
    <div className='mx-2 mb-4 p-4'>
      <h3 className='underline text-xl md:text-2xl'>Push notifications</h3>
      {subscription ? (
        <>
          <p className='py-2 text-lg md:text-xl caveat'>
            You are subscribed to push notifications
          </p>
          <Button onClick={unsubscribeFromPush} version='danger' color='white'>
            Unsubscribe
          </Button>
        </>
      ) : (
        <>
          <p className='py-2 text-lg md:text-xl caveat'>
            You are not subscribed to push notifications
          </p>
          <Button
            onClick={subscribeToPushNotifications}
            version={userId ? "primary" : "disabled"}
          >
            Subscribe
          </Button>
        </>
      )}
    </div>
  );
}
