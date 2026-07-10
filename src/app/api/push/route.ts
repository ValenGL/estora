// src/app/api/push/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import webPush from "web-push";

let isVapidInitialized = false;

function initVapid() {
  if (isVapidInitialized) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY) are not set in the environment.");
  }

  webPush.setVapidDetails(
    "mailto:tu@email.com",
    publicKey,
    privateKey
  );
  isVapidInitialized = true;
}

export async function POST(request: Request) {
  try {
    initVapid();
  } catch (error: any) {
    console.error("VAPID initialization error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const apiKey = request.headers.get("X-API-Key");
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let title: string, body: string;
  try {
    const bodyJson = await request.json();
    title = bodyJson.title;
    body = bodyJson.body;

    if (!title || !body) {
      return NextResponse.json(
        { error: "Faltan parámetros: title o body" },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud inválido" },
      { status: 400 }
    );
  }

  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Todo: Usa la service role key
  );

  const { data: subscriptions, error: fetchError } = await supabaseClient
    .from("push_subscriptions")
    .select("subscription");

  if (fetchError) {
    return NextResponse.json(
      { error: `Error al obtener suscripciones: ${fetchError.message}` },
      { status: 500 }
    );
  }

  if (!subscriptions?.length) {
    return NextResponse.json(
      { error: "No hay usuarios suscritos" },
      { status: 404 }
    );
  }

  const pushPromises = subscriptions.map(({ subscription }) =>
    webPush
      .sendNotification(
        JSON.parse(subscription),
        JSON.stringify({ title, body })
      )
      .catch((error) => {
        console.error("Error enviando a una suscripción:", error);
        return null;
      })
  );

  try {
    const results = await Promise.all(pushPromises);
    const successful = results.filter((result) => result !== null).length;
    return NextResponse.json({
      success: true,
      message: `Notificación enviada a ${successful} de ${subscriptions.length} usuarios`,
    });
  } catch (error) {
    console.error("Error general enviando notificaciones:", error);
    return NextResponse.json(
      { error: "Error enviando notificaciones" },
      { status: 500 }
    );
  }
}
