"use client";

import { redirect } from "next/navigation";
import { ComponentType } from "react";
import { useAuth } from "./isAuth";

const ProtectedRoute = <P extends object>(Component: ComponentType<P>) => {
  return function WrappedComponent(props: P) {
    const { user, isLoading, role } = useAuth();

    if (isLoading) return null;
    if (!user) redirect("/");
    if (role === "pending") redirect("/onboarding");

    return <Component {...props} />;
  };
};

export default ProtectedRoute;
