"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import AuthForm from "@/components/AuthForm";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleRegister = async (email, password) => {
    setError("");
    setSuccess("");
    
    const { data, error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      setError(error.message);
    } else {
      if (data.user && !data.user.email_confirmed_at) {
        setSuccess("Check your email for a confirmation link. After confirming, you'll be redirected to complete your profile.");
      } else if (data.user) {
        setSuccess("Registration successful! Redirecting to survey...");
        setTimeout(() => {
          router.push('/survey');
        }, 2000);
      }
    }
  };

  return (
    <AuthForm
      formType="register"
      onSubmit={handleRegister}
    />
  );
}
