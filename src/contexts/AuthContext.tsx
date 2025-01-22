import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica se há uma sessão ativa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Inscreve para mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        navigate("/");
      } else {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signIn = async (email: string) => {
    try {
      // Tenta fazer login com senha (usando o email como senha)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: email, // Usando o email como senha por simplicidade
      });

      if (signInError) {
        // Se o login falhar, tenta criar o usuário
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: email, // Usando o email como senha por simplicidade
        });

        if (signUpError) throw signUpError;
        
        toast.success("Link de acesso enviado para seu email!");
      } else {
        // Login bem sucedido
        navigate("/");
      }
    } catch (error: any) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error: any) {
      toast.error("Erro ao sair");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 