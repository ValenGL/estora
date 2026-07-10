// lib/supabase_manage.js
import { subscribeToPush } from "./../../utils/pushManage";
import { supabase } from "./supabase";

// Agregar un post
export const addPost = async (postData) => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("No authenticated user");

  const { error } = await supabase.from("posts").insert([
    {
      price: postData.price,
      priceType: postData.priceType,
      name: postData.name,
      email: user.email,
      cel: postData.cel,
      message: postData.message,
      location: postData.location,
      created_date: new Date(),
    },
  ]);

  if (error) {
    console.error("Error al agregar el post:", error);
    throw error;
  }
};

// Obtener todos los posts
export const getPosts = async () => {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_date", { ascending: false });

  if (error) {
    console.error("Error al obtener los posts:", error);
    throw error;
  }

  return data;
};

// Obtener los posts del usuario autenticado
export const getOwnPosts = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("Error obteniendo usuario:", userError);
    throw userError || new Error("No user found");
  }

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("email", user.email)
    .order("created_date", { ascending: false });

  if (error) {
    console.error("Error al obtener los posts del usuario:", error);
    throw error;
  }

  return data;
};

// Obtener un post por ID
export const getPostById = async (postId) => {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("document_id", postId)
    .single();

  if (error) {
    console.error("Error al obtener el post:", error);
    throw error;
  }

  return data;
};

// Obtener un user por ID
export const getUserById = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error al obtener el post:", error);
    throw error;
  }

  return data;
};

// Eliminar un post
export const deletePost = async (postId) => {
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("document_id", postId);

  if (error) {
    console.error("Error al eliminar el post:", error);
    throw error;
  }
  console.log("Post eliminado correctamente");
};

// Registro de usuario
export const signup = async (email, password, captchaToken) => {
  try {
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `https://garpar.ar/`,
        captchaToken,
      },
    });

    if (authError) throw new Error(authError.message);
    if (!data.user)
      throw new Error("No se pudo obtener la información del usuario");

    return { success: true, user: data.user };
  } catch (error) {
    throw new Error(error.message || "Error en el proceso de registro");
  }
};

// Iniciar sesión
export const login = async (email, password, captchaToken) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        captchaToken,
      },
    });

    if (error) {
      console.error("Error al iniciar sesión:", error);
      throw error;
    }

    // Suscripción a notificaciones push después del login exitoso
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await subscribeToPush(registration, data.user.id);
        console.log("Usuario suscrito a notificaciones push");
      } catch (pushError) {
        console.warn("No se pudo suscribir a notificaciones push:", pushError);
        // No lanzamos error aquí para no interrumpir el flujo de login
      }
    }

    return data.user;
  } catch (error) {
    throw error;
  }
};

// Cerrar sesión
export const logout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error al cerrar sesión:", error);
    throw error;
  }

  return true;
};

// Restablecer contraseña
export const resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    console.error("Error al restablecer la contraseña:", error);
    throw error;
  }

  return true;
};
