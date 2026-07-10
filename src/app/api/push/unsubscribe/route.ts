// src/app/api/push/unsubscribe/route.ts
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

  const { error: deleteError, count } = await supabaseClient
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json(
      { error: `Error al eliminar suscripción: ${deleteError.message}` },
      { status: 500 }
    );
  }

  console.log("Rows deleted:", count || 0);
  return NextResponse.json({ success: true });
}
