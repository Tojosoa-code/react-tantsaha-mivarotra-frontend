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
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Briefcase,
  Tractor,
  ShoppingCart,
  Navigation,
  MapPin,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { formatMadagascarPhone } from "@/helpers/formattage";
import { REGIONS, REGION_COORDS } from "@/helpers/region";

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
  const [showPassword, setShowPassword] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    if (name === "telephone") {
      setFormData({ ...formData, [name]: formatMadagascarPhone(value) });
    } else if (name === "latitude" || name === "longitude") {
      setFormData({ ...formData, [name]: parseFloat(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const detectLocation = () => {
    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));

        const detectedRegion = detectRegionFromCoords(lat, lng);

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          region: detectedRegion || prev.region,
        }));

        toast.success(
          detectedRegion
            ? `Position détectée : ${detectedRegion}`
            : "Position détectée",
        );

        setGettingLocation(false);
      },
      () => {
        toast.error("Impossible d'obtenir votre position.");
        setGettingLocation(false);
      },
    );
  };

  const handleRegister = async (e: any) => {
    e.preventDefault();

    const cleanPhone = formData.telephone.replace(/\s/g, "");

    if (!/^(032|033|034|037|038)\d{7}$/.test(cleanPhone)) {
      toast.error("Numéro invalide (032, 033, 034, 037, 038)");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Mot de passe minimum 6 caractères");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        ...formData,
        telephone: cleanPhone,
      });

      toast.success("Compte créé !");
      navigate("/login");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-8">
      <Button
        className="absolute top-8 left-8"
        size="icon"
        variant="ghost"
        onClick={() => navigate("/")}
      >
        <ArrowLeft />
      </Button>

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
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="pl-10"
                    placeholder="user@gmail.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Rôle */}
            <div className="space-y-2">
              <Label>Vous êtes</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="producteur">
                    <div className="flex items-center gap-2">
                      <Tractor className="h-4 w-4" />
                      <span>Producteur</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="acheteur">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      <span>Acheteur</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nom + Prénom */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    className="pl-10"
                    placeholder="Rakoto"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prénom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    required
                    className="pl-10"
                    placeholder="Jean"
                  />
                </div>
              </div>
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label>Téléphone (10 chiffres)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  required
                  className="pl-10"
                  placeholder="034 49 018 94"
                />
              </div>
            </div>

            {/* Région */}
            <p className="font-semibold mb-1">
              Région{" "}
              <span className="font-normal text-muted-foreground">
                (Utilisez votre position actuelle ou choisissez une région
                manuellement)
              </span>
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Select
                  value={formData.region}
                  onValueChange={(v) => {
                    const coords = REGION_COORDS[v];

                    setFormData((prev) => ({
                      ...prev,
                      region: v,
                      latitude: coords?.lat ?? prev.latitude,
                      longitude: coords?.lng ?? prev.longitude,
                    }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={detectLocation}
                  disabled={gettingLocation}
                >
                  <Navigation className="w-4 h-4" />
                  {gettingLocation ? (
                    <>
                      <Spinner className="mx-3 h-5 w-auto" />
                      <span>Détection en cours...</span>
                    </>
                  ) : (
                    "Utiliser ma position actuelle"
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-2" />
                  Création du compte...
                </>
              ) : (
                "Créer mon compte"
              )}
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
