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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/axios";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "producteur",
    nom: "",
    prenom: "",
    telephone: "",
    latitude: -18.8792,
    longitude: 47.5079,
    region: "Analamanga",
    adresse: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/auth/register", formData);
      toast.success("Compte créé avec succès !");
      navigate("/login");
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Erreur lors de l'inscription",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Créer un compte
          </CardTitle>
          <CardDescription className="text-center">
            Rejoignez la plateforme Tantsaha Mivarotra
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Email + Password */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Rôle */}
            <div className="space-y-2">
              <Label>Vous êtes</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="producteur">Producteur</SelectItem>
                  <SelectItem value="acheteur">Acheteur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nom + Prénom */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Création du compte..." : "Créer mon compte"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            Déjà un compte ?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
