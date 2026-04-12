import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Alternative 1: Utiliser lucide-react (déjà installé avec shadcn)
import {
  Home,
  PlusCircle,
  Search,
  Route,
  UserCircle,
  LogOut,
  ShoppingBag,
  Truck,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    // Pour l'instant on simule le user (on l'améliorera après)
    setUser({ role: "producteur", prenom: "Jean", nom: "Rakoto" });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Déconnexion réussie");
    navigate("/login");
  };

  if (!user) return <div>Chargement...</div>;

  const isProducteur = user.role === "producteur";

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-72 border-r bg-card flex flex-col">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-3xl">
            🌾
          </div>
          <div>
            <span className="text-2xl font-bold text-emerald-800">
              Tantsaha
            </span>
            <span className="text-2xl font-bold">Mivarotra</span>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-2">
          <Button
            variant={activeTab === "home" ? "default" : "ghost"}
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("home")}
          >
            <Home className="w-5 h-5" />
            Accueil
          </Button>

          {isProducteur ? (
            <>
              <Button
                variant={activeTab === "offers" ? "default" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab("offers")}
              >
                <ShoppingBag className="w-5 h-5" />
                Mes Offres
              </Button>
              <Button
                variant={activeTab === "new-offer" ? "default" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab("new-offer")}
              >
                <PlusCircle className="w-5 h-5" />
                Nouvelle Offre
              </Button>
            </>
          ) : (
            <>
              <Button
                variant={activeTab === "demands" ? "default" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab("demands")}
              >
                <Truck className="w-5 h-5" />
                Mes Demandes
              </Button>
              <Button
                variant={activeTab === "new-demand" ? "default" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab("new-demand")}
              >
                <PlusCircle className="w-5 h-5" />
                Nouvelle Demande
              </Button>
            </>
          )}

          <Button
            variant={activeTab === "matching" ? "default" : "ghost"}
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("matching")}
          >
            <Search className="w-5 h-5" />
            Matching Intelligent
          </Button>

          <Button
            variant={activeTab === "route" ? "default" : "ghost"}
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("route")}
          >
            <Route className="w-5 h-5" />
            Calculer Itinéraire
          </Button>
        </div>

        {/* Footer Sidebar */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-auto">
        <header className="h-16 border-b bg-white flex items-center px-8 justify-between">
          <h1 className="text-2xl font-semibold">
            {activeTab === "home" && "Accueil"}
            {activeTab === "matching" && "Matching Intelligent"}
            {activeTab === "route" && "Itinéraire Optimal"}
            {/* etc. */}
          </h1>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">
                {user.prenom} {user.nom}
              </p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
            <UserCircle className="w-9 h-9 text-emerald-600" />
          </div>
        </header>

        {/* Zone de contenu selon l'onglet */}
        <main className="p-8">
          {activeTab === "home" && (
            <div className="text-center py-20">
              <h2 className="text-4xl font-bold mb-4">
                Bienvenue sur Tantsaha Mivarotra !
              </h2>
              <p className="text-xl text-muted-foreground">
                Tout est prêt pour une version fonctionnelle.
              </p>
            </div>
          )}

          {activeTab === "matching" && (
            <div className="text-center py-20">
              <h2 className="text-3xl font-semibold">
                🔥 Matching Intelligent
              </h2>
              <p className="mt-4 text-muted-foreground">
                Endpoint /matches/match sera appelé ici
              </p>
            </div>
          )}

          {/* Tu pourras ajouter les autres onglets plus tard */}
        </main>
      </div>
    </div>
  );
}
