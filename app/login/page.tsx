"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { getPostLoginRedirect } from "@/utils/userFlow";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (email, password) => {
    setError("");
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError(error.message);
    } else if (data.user) {
      try {
        const redirectPath = await getPostLoginRedirect(data.user.id);
        router.push(redirectPath);
      } catch (redirectError) {
        console.error('Error determining redirect path:', redirectError);
        router.push('/dashboard');
      }
    }
  };

  return (
    <AuthForm
      formType="login"
      onSubmit={handleLogin}
    />
  );
}
