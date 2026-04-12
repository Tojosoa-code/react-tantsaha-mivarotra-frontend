import { useEffect, useState } from "react";
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
import { ArrowLeft, Sprout, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { OrganicSproutLoader } from "@/components/ui/agriculture-loader-overlay";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Gestion de la redirection avec nettoyage pour la performance
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isRedirecting) {
      // On attend 3 secondes pour laisser l'animation de la plante se jouer
      timer = setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    }

    // Nettoyage si le composant est démonté avant la fin du timer
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isRedirecting, navigate]);

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

      // Stockage du token
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      toast.success("Connexion réussie ! Bienvenue 👋");
      setLoading(false);
      setIsRedirecting(true);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.detail || "Impossible de se connecter";
      toast.error(typeof errorMsg === "string" ? errorMsg : "Erreur inconnue");
      console.error(error);
      setLoading(false);
    }
  };

  // Affichage du loader plein écran pendant la redirection
  if (isRedirecting) {
    return <OrganicSproutLoader text="Préparation de votre espace..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Button
        className="absolute top-8 left-8"
        size="icon"
        variant="ghost"
        onClick={() => navigate("/")}
      >
        <ArrowLeft />
      </Button>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground">
              <Sprout className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-bold">
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
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="user@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10 pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-3 h-5 w-auto" />
                  <span>Connexion...</span>
                </>
              ) : (
                "Se connecter"
              )}
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
