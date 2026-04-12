import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/axios";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const response = await api.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      localStorage.setItem("token", response.data.access_token);
      toast.success("Connexion réussie ! Bienvenue 👋");

      // Redirection selon le rôle (à améliorer plus tard)
      navigate("/dashboard");
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.detail || "Impossible de se connecter";
      toast.error(typeof errorMsg === "string" ? errorMsg : "Erreur inconnue");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-3xl">
              🌾
            </div>
            <CardTitle className="text-3xl font-bold text-emerald-800">
              Tantsaha Mivarotra
            </CardTitle>
          </div>
          <CardDescription className="text-center">
            Connectez-vous à votre compte
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="rakoto@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            Pas encore de compte ?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Créer un compte
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
