import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Todo: Usa la service role key
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const {
    data: { user },
    error: authError,
  } = await supabaseClient.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const bodyJson = await request.json();
  const subscription = bodyJson.subscription;
  if (!subscription) {
    return NextResponse.json({ error: "Falta subscription" }, { status: 400 });
  }

  const { data, error: upsertError } = await supabaseClient
    .from("push_subscriptions")
    .upsert(
      { user_id: user.id, subscription: JSON.stringify(subscription) },
      { onConflict: "user_id" }
    );

  if (upsertError) {
    console.error("Upsert error:", upsertError);
    return NextResponse.json(
      { error: `Error al guardar suscripción: ${upsertError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
