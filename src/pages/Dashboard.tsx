import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import api from "@/lib/axios";
import {
  Home,
  PlusCircle,
  Search,
  Route,
  UserCircle,
  LogOut,
  ShoppingBag,
  Truck,
  Sprout,
  RefreshCw,
  ChevronDown,
  MapPin,
  Calendar,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Package,
  Scale,
  Banknote,
  Store,
  Flame,
  TrendingUp,
  Users,
  Target,
  Handshake,
  Mail,
  Phone,
} from "lucide-react";
import { OrganicSproutLoader } from "@/components/ui/agriculture-loader-overlay";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<
    "home" | "my-primary" | "all-primary" | "marketplace" | "matching" | "route"
  >("home");

  // Données
  const [myItems, setMyItems] = useState<any[]>([]);
  const [primaryItems, setPrimaryItems] = useState<any[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);

  // Pagination classique (1, 2, 3...)
  const [paginationData, setPaginationData] = useState({
    primary: { total: 0, page: 1, total_pages: 0 },
    market: { total: 0, page: 1, total_pages: 0 },
  });

  // Pagination infinie (Mes items)
  const [myPages, setMyPages] = useState(1);
  const [hasMoreMy, setHasMoreMy] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMoreMy, setLoadingMoreMy] = useState(false);

  const [dropdowns, setDropdowns] = useState({ primary: false, market: false });
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Ref pour intersection observer (pagination infinie)
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMoreMy || !hasMoreMy) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMoreMy && !loadingMoreMy) {
          loadMyItems(user, myPages + 1, true);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loadingMoreMy, hasMoreMy, myPages, user],
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  // Config dynamique
  const isProd = user?.role === "producteur";
  const primaryLabel = isProd ? "Offres" : "Demandes";
  const marketLabel = isProd ? "Demandes" : "Offres";
  const primaryEndpoint = isProd ? "/offers" : "/demands";
  const myEndpoint = isProd ? "/users/me/offers" : "/users/me/demands";
  const marketEndpoint = isProd ? "/demands" : "/offers";

  useEffect(() => {
    if (!user) return;
    if (activeTab === "my-primary") loadMyItems(user, 1);
    if (activeTab === "all-primary") loadPrimaryItems(1);
    if (activeTab === "marketplace") loadMarketplaceItems(1);
  }, [activeTab, user]);

  // --- CHARGEMENTS ---
  const loadMyItems = async (currentUser: any, page = 1, append = false) => {
    if (!currentUser) return;
    if (page === 1) setLoading(true);
    else setLoadingMoreMy(true);
    try {
      const res = await api.get(`${myEndpoint}?page=${page}&page_size=12`);
      const data = Array.isArray(res.data) ? res.data : res.data.items || [];
      if (append) setMyItems((prev) => [...prev, ...data]);
      else setMyItems(data);
      setHasMoreMy(data.length === 12);
      setMyPages(page);
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
      setLoadingMoreMy(false);
    }
  };

  const loadPrimaryItems = async (page = 1) => {
    if (!user) return;
    setLoading(true);
    try {
      // ✅ CORRECTION : Utilise exclude_current_user=true
      const res = await api.get(
        `${primaryEndpoint}?page=${page}&page_size=12&exclude_current_user=true`,
      );

      const items = res.data.items || [];
      const total = res.data.total ?? 0;
      const total_pages = res.data.total_pages ?? 1;

      setPrimaryItems(items);
      setPaginationData((prev) => ({
        ...prev,
        primary: { total, page, total_pages },
      }));
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadMarketplaceItems = async (page = 1) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get(`${marketEndpoint}?page=${page}&page_size=12`);
      const items = res.data.items || [];
      const total = res.data.total ?? 0;
      const total_pages = res.data.total_pages ?? 1;

      setMarketplaceItems(items);
      setPaginationData((prev) => ({
        ...prev,
        market: { total, page, total_pages },
      }));
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleEdit = (item: any) => {
    navigate(isProd ? `/edit-offer/${item.id}` : `/edit-demand/${item.id}`);
  };

  const handleDelete = async (itemId: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet élément ?"))
      return;
    try {
      await api.delete(`${isProd ? "/offers" : "/demands"}/${itemId}`);
      toast.success("Élément supprimé avec succès");
      loadMyItems(user, 1);
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleViewDetails = async (itemId: number) => {
    try {
      const endpoint =
        activeTab === "marketplace" ? marketEndpoint : primaryEndpoint;
      const res = await api.get(`${endpoint}/${itemId}`);
      setSelectedItem(res.data);
      setDetailsOpen(true);
    } catch {
      toast.error("Erreur lors du chargement des détails");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("À bientôt !");
    navigate("/login");
  };

  if (!user)
    return (
      <div className="flex h-screen items-center justify-center">
        <OrganicSproutLoader text="Préparation de votre espace..." />
      </div>
    );

  // --- COMPOSANT PAGINATION CLASSIQUE ---
  const StandardPagination = ({
    page,
    totalPages,
    onChange,
  }: {
    page: number;
    totalPages: number;
    onChange: (p: number) => void;
  }) => {
    if (totalPages <= 1) return null;
    const pagesArr = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
      if (totalPages <= 5) return i + 1;
      if (page <= 3) return i + 1;
      if (page >= totalPages - 2) return totalPages - 4 + i;
      return page - 2 + i;
    });
    return (
      <Card className="mt-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChange(page - 1)}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <div className="flex gap-1">
                {pagesArr.map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onChange(p)}
                    className="w-10"
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChange(page + 1)}
                disabled={page === totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ✅ CORRECTION : Fonction pour déterminer quel utilisateur afficher dans le modal
  const getDisplayUser = () => {
    if (!selectedItem) return null;

    if (activeTab === "marketplace") {
      // Marketplace : producteur voit acheteurs, acheteur voit producteurs
      return isProd ? selectedItem.acheteur : selectedItem.producteur;
    } else {
      // All-primary : producteur voit producteurs, acheteur voit acheteurs
      return isProd ? selectedItem.producteur : selectedItem.acheteur;
    }
  };

  const displayUser = getDisplayUser();

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Sidebar */}
      <div className="w-72 border-r bg-card/95 backdrop-blur-sm flex flex-col shadow-lg">
        <div className="p-6 border-b flex items-center gap-3 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center text-primary-foreground shadow-md">
            <Sprout className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xl font-bold block">Tantsaha</span>
            <span className="text-xs text-muted-foreground">
              Marketplace Agricole
            </span>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Button
            variant={activeTab === "home" ? "default" : "ghost"}
            className="w-full justify-start gap-3 hover:bg-primary/10 transition-colors"
            onClick={() => setActiveTab("home")}
          >
            <Home className="w-5 h-5" />
            <span>Tableau de bord</span>
          </Button>

          {/* MENU PRIMAIRE */}
          <div
            onMouseEnter={() => setDropdowns((p) => ({ ...p, primary: true }))}
            onMouseLeave={() => setDropdowns((p) => ({ ...p, primary: false }))}
          >
            <Button
              variant={
                activeTab === "my-primary" || activeTab === "all-primary"
                  ? "default"
                  : "ghost"
              }
              className="w-full justify-start gap-3 hover:bg-primary/10 transition-colors"
            >
              {isProd ? (
                <ShoppingBag className="w-5 h-5" />
              ) : (
                <Truck className="w-5 h-5" />
              )}
              <span className="flex-1 text-left">Mes {primaryLabel}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${dropdowns.primary ? "rotate-180" : ""}`}
              />
            </Button>
            {dropdowns.primary && (
              <div className="pl-4 py-1 space-y-1 animate-in slide-in-from-top-2">
                <Button
                  variant={activeTab === "my-primary" ? "default" : "ghost"}
                  className="w-full justify-start gap-3 text-sm"
                  onClick={() => setActiveTab("my-primary")}
                >
                  <Package className="w-4 h-4" />
                  Gérer mes {primaryLabel.toLowerCase()}
                </Button>
                <Button
                  variant={activeTab === "all-primary" ? "default" : "ghost"}
                  className="w-full justify-start gap-3 text-sm"
                  onClick={() => setActiveTab("all-primary")}
                >
                  <TrendingUp className="w-4 h-4" />
                  Analyser le marché
                </Button>
              </div>
            )}
          </div>

          {/* MENU MARKETPLACE */}
          <div
            onMouseEnter={() => setDropdowns((p) => ({ ...p, market: true }))}
            onMouseLeave={() => setDropdowns((p) => ({ ...p, market: false }))}
          >
            <Button
              variant={activeTab === "marketplace" ? "default" : "ghost"}
              className="w-full justify-start gap-3 hover:bg-primary/10 transition-colors"
            >
              <Store className="w-5 h-5" />
              <span className="flex-1 text-left">Marketplace</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${dropdowns.market ? "rotate-180" : ""}`}
              />
            </Button>
            {dropdowns.market && (
              <div className="pl-4 py-1 space-y-1 animate-in slide-in-from-top-2">
                <Button
                  variant={activeTab === "marketplace" ? "default" : "ghost"}
                  className="w-full justify-start gap-3 text-sm"
                  onClick={() => setActiveTab("marketplace")}
                >
                  <Flame className="w-4 h-4" />
                  {isProd ? "Opportunités d'achat" : "Opportunités de vente"}
                </Button>
              </div>
            )}
          </div>

          <div className="pt-2 border-t">
            <Button
              variant={activeTab === "matching" ? "default" : "ghost"}
              className="w-full justify-start gap-3 hover:bg-primary/10 transition-colors"
              onClick={() => setActiveTab("matching")}
            >
              <Target className="w-5 h-5" />
              Matching Intelligent
            </Button>
            <Button
              variant={activeTab === "route" ? "default" : "ghost"}
              className="w-full justify-start gap-3 hover:bg-primary/10 transition-colors"
              onClick={() => setActiveTab("route")}
            >
              <Route className="w-5 h-5" />
              Optimisation de tournée
            </Button>
          </div>
        </div>

        <div className="p-4 border-t mt-auto bg-muted/30">
          <div className="bg-card rounded-lg p-3 mb-3 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold shadow">
                {user.prenom?.[0]}
                {user.nom?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sm">
                  {user.prenom} {user.nom}
                </p>
                <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {user.role === "producteur" ? "Producteur" : "Acheteur"}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Contenu Principal */}
      <div className="flex-1 overflow-auto">
        <header className="h-16 border-b bg-card/95 backdrop-blur-sm px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {activeTab === "home" && "Tableau de bord"}
            {activeTab === "my-primary" && `Mes ${primaryLabel}`}
            {activeTab === "all-primary" && "Analyse du marché"}
            {activeTab === "marketplace" &&
              (isProd ? "Opportunités d'achat" : "Opportunités de vente")}
            {activeTab === "matching" && "Matching Intelligent"}
            {activeTab === "route" && "Optimisation de tournée"}
          </h1>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 hover:bg-primary/10"
            onClick={() => {
              if (activeTab === "my-primary") loadMyItems(user, 1);
              if (activeTab === "all-primary")
                loadPrimaryItems(paginationData.primary.page);
              if (activeTab === "marketplace")
                loadMarketplaceItems(paginationData.market.page);
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </Button>
        </header>

        <main className="p-8">
          {/* ACCUEIL */}
          {activeTab === "home" && (
            <div className="max-w-6xl mx-auto">
              <div className="text-center py-12 mb-12 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-8">
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-primary/10 rounded-full">
                  <Handshake className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Plateforme de mise en relation
                  </span>
                </div>
                <h2 className="text-4xl font-bold mb-4">
                  Bienvenue, {user.prenom} !
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Connectez-vous directement avec{" "}
                  {isProd ? "des acheteurs" : "des producteurs"} locaux et
                  développez votre activité agricole en toute confiance
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card
                  className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-primary/50 group"
                  onClick={() => setActiveTab("my-primary")}
                >
                  <CardContent className="pt-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {isProd ? (
                        <ShoppingBag className="w-8 h-8 text-white" />
                      ) : (
                        <Truck className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <h3 className="font-bold text-lg mb-2">
                      Mes {primaryLabel}
                    </h3>
                    <p className="text-4xl font-bold text-primary mb-2">
                      {myItems.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isProd ? "Produits disponibles" : "Demandes actives"}
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-primary/50 group"
                  onClick={() => setActiveTab("all-primary")}
                >
                  <CardContent className="pt-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">
                      Analyse du marché
                    </h3>
                    <p className="text-sm text-muted-foreground mt-3">
                      Suivez les tendances et ajustez vos prix en temps réel
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-primary/50 group"
                  onClick={() => setActiveTab("marketplace")}
                >
                  <CardContent className="pt-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Flame className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">
                      Opportunités en direct
                    </h3>
                    <p className="text-sm text-muted-foreground mt-3">
                      {isProd
                        ? "Découvrez les demandes d'achat près de chez vous"
                        : "Trouvez les meilleurs produits locaux disponibles"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Stats supplémentaires */}
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Package className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{myItems.length}</p>
                        <p className="text-xs text-muted-foreground">
                          Publications actives
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Eye className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">-</p>
                        <p className="text-xs text-muted-foreground">
                          Vues cette semaine
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">-</p>
                        <p className="text-xs text-muted-foreground">
                          Contacts établis
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Handshake className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">-</p>
                        <p className="text-xs text-muted-foreground">
                          Transactions
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TABLEAU MES ITEMS (Pagination Infinie) */}
          {activeTab === "my-primary" && (
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Mes {primaryLabel}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {myItems.length}{" "}
                    {isProd
                      ? "produit(s) disponible(s)"
                      : "demande(s) active(s)"}
                  </p>
                </div>
                <Button
                  onClick={() =>
                    navigate(isProd ? "/new-offer" : "/new-demand")
                  }
                  className="gap-2 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  {isProd ? "Nouvelle offre" : "Nouvelle demande"}
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex justify-center py-16">
                    <OrganicSproutLoader text="Chargement de vos publications..." />
                  </div>
                ) : myItems.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {isProd
                        ? "Commencez à vendre vos produits"
                        : "Publiez votre première demande"}
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {isProd
                        ? "Présentez vos produits à des milliers d'acheteurs potentiels en quelques clics"
                        : "Trouvez les meilleurs producteurs locaux pour vos besoins"}
                    </p>
                    <Button
                      size="lg"
                      onClick={() =>
                        navigate(isProd ? "/new-offer" : "/new-demand")
                      }
                      className="gap-2"
                    >
                      <PlusCircle className="w-5 h-5" />
                      {isProd
                        ? "Créer ma première offre"
                        : "Créer ma première demande"}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">
                              Produit
                            </TableHead>
                            <TableHead className="font-semibold">
                              Quantité
                            </TableHead>
                            <TableHead className="font-semibold">
                              {isProd ? "Prix unitaire" : "Budget maximum"}
                            </TableHead>
                            <TableHead className="font-semibold">
                              Localisation
                            </TableHead>
                            <TableHead className="font-semibold">
                              Date de publication
                            </TableHead>
                            <TableHead className="text-right font-semibold">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {myItems.map((item) => (
                            <TableRow
                              key={item.id}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {item.product?.nom ||
                                        `Produit #${item.product_id}`}
                                    </p>
                                    {item.product?.categorie && (
                                      <p className="text-xs text-muted-foreground">
                                        {item.product.categorie}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Scale className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {Number(item.quantite)}{" "}
                                    {item.product?.unite || "kg"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Banknote className="w-4 h-4 text-green-600" />
                                  <span className="font-semibold text-green-600">
                                    {(isProd
                                      ? item.prix_unitaire
                                      : item.budget_max
                                    ).toLocaleString()}{" "}
                                    Ar
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="gap-1.5">
                                  <MapPin className="w-3 h-3" />
                                  {item.region}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(item.created_at).toLocaleDateString(
                                    "fr-FR",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleEdit(item)}
                                    title="Modifier"
                                    className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleDelete(item.id)}
                                    title="Supprimer"
                                    className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {hasMoreMy && (
                      <div
                        ref={loadMoreRef}
                        className="flex justify-center py-6 border-t mt-6"
                      >
                        <Button
                          variant="outline"
                          onClick={() => loadMyItems(user, myPages + 1, true)}
                          disabled={loadingMoreMy}
                          className="gap-2"
                        >
                          {loadingMoreMy ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Chargement...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              Charger plus de résultats
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* TOUTES LES ... (Pagination 1,2,3) */}
          {activeTab === "all-primary" && (
            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder={`Rechercher parmi les ${primaryLabel.toLowerCase()}...`}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      <span>Analyse de la concurrence</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {loading ? (
                <div className="flex justify-center py-20">
                  <OrganicSproutLoader text="Analyse du marché en cours..." />
                </div>
              ) : primaryItems.length === 0 ? (
                <Card className="shadow-sm">
                  <CardContent className="py-20 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                      <Eye className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      Aucune donnée disponible pour le moment
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Les {primaryLabel.toLowerCase()} de vos concurrents
                      n'apparaissent pas ici pour vous permettre une analyse
                      objective du marché
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span className="font-medium">
                        {primaryItems.length}
                      </span>{" "}
                      {primaryLabel.toLowerCase()} disponible(s)
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {primaryItems.map((item) => (
                      <Card
                        key={item.id}
                        className="hover:shadow-xl transition-all border-2 hover:border-primary/50 group"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-3 mb-4 pb-4 border-b">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                              {isProd
                                ? item.producteur?.prenom?.[0]
                                : item.acheteur?.prenom?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">
                                {isProd
                                  ? `${item.producteur?.prenom} ${item.producteur?.nom}`
                                  : `${item.acheteur?.prenom} ${item.acheteur?.nom}`}
                              </p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                <MapPin className="w-3 h-3" />
                                {item.region}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Package className="w-5 h-5 text-primary" />
                              <h3 className="font-bold text-lg">
                                {item.product?.nom ||
                                  `Produit #${item.product_id}`}
                              </h3>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground text-xs">
                                  Quantité
                                </span>
                                <span className="font-semibold flex items-center gap-1">
                                  <Scale className="w-3 h-3" />
                                  {Number(item.quantite)} {item.product?.unite}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground text-xs">
                                  {isProd ? "Prix" : "Budget"}
                                </span>
                                <span className="font-semibold text-green-600 flex items-center gap-1">
                                  <Banknote className="w-3 h-3" />
                                  {(isProd
                                    ? item.prix_unitaire
                                    : item.budget_max
                                  ).toLocaleString()}{" "}
                                  Ar
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t mt-4 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.created_at).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "numeric",
                                  month: "short",
                                },
                              )}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(item.id)}
                              className="gap-2 group-hover:bg-primary group-hover:text-white transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              Voir plus
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <StandardPagination
                    page={paginationData.primary.page}
                    totalPages={paginationData.primary.total_pages}
                    onChange={(p) => loadPrimaryItems(p)}
                  />
                </>
              )}
            </div>
          )}

          {/* MARKETPLACE (Pagination 1,2,3) */}
          {activeTab === "marketplace" && (
            <div className="space-y-6">
              <Card className="shadow-sm bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder={`Trouvez ${isProd ? "des acheteurs" : "des produits"}...`}
                        className="pl-10 bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
                      <Flame className="w-4 h-4" />
                      <span>Opportunités en direct</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {loading ? (
                <div className="flex justify-center py-20">
                  <OrganicSproutLoader text="Recherche des meilleures opportunités..." />
                </div>
              ) : marketplaceItems.length === 0 ? (
                <Card className="shadow-sm">
                  <CardContent className="py-20 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-100 flex items-center justify-center">
                      <Store className="w-10 h-10 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      Aucune opportunité pour le moment
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Revenez bientôt pour découvrir de nouvelles{" "}
                      {isProd ? "demandes d'achat" : "offres de produits"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-600" />
                      <span className="text-orange-600">
                        {paginationData.market.total}
                      </span>
                      <span className="text-muted-foreground">
                        opportunité(s) disponible(s)
                      </span>
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {marketplaceItems.map((item) => (
                      <Card
                        key={item.id}
                        className="hover:shadow-xl transition-all border-2 hover:border-orange-400 group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 opacity-10 rounded-bl-full"></div>
                        <CardContent className="p-6 relative">
                          <div className="flex items-start gap-3 mb-4 pb-4 border-b">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                              {isProd
                                ? item.acheteur?.prenom?.[0]
                                : item.producteur?.prenom?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">
                                {isProd
                                  ? `${item.acheteur?.prenom} ${item.acheteur?.nom}`
                                  : `${item.producteur?.prenom} ${item.producteur?.nom}`}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {isProd ? "Acheteur" : "Producteur"} certifié
                              </p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                <MapPin className="w-3 h-3" />
                                {item.region}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Package className="w-5 h-5 text-orange-600" />
                              <h3 className="font-bold text-lg">
                                {item.product?.nom ||
                                  `Produit #${item.product_id}`}
                              </h3>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex flex-col gap-1 p-2 rounded-lg bg-muted/50">
                                <span className="text-muted-foreground text-xs">
                                  Quantité
                                </span>
                                <span className="font-semibold flex items-center gap-1">
                                  <Scale className="w-3 h-3" />
                                  {Number(item.quantite)} {item.product?.unite}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1 p-2 rounded-lg bg-green-50">
                                <span className="text-muted-foreground text-xs">
                                  {isProd ? "Budget" : "Prix"}
                                </span>
                                <span className="font-bold text-green-600 flex items-center gap-1">
                                  <Banknote className="w-3 h-3" />
                                  {(isProd
                                    ? item.budget_max
                                    : item.prix_unitaire
                                  ).toLocaleString()}{" "}
                                  Ar
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t mt-4 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.created_at).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "numeric",
                                  month: "short",
                                },
                              )}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => handleViewDetails(item.id)}
                              className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-sm"
                            >
                              <Eye className="w-4 h-4" />
                              Détails
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <StandardPagination
                    page={paginationData.market.page}
                    totalPages={paginationData.market.total_pages}
                    onChange={(p) => loadMarketplaceItems(p)}
                  />
                </>
              )}
            </div>
          )}

          {/* MATCHING */}
          {activeTab === "matching" && (
            <Card className="shadow-lg">
              <CardContent className="py-20 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                  <Target className="w-12 h-12 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Matching Intelligent
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Notre algorithme intelligent vous mettra automatiquement en
                  relation avec les {isProd ? "acheteurs" : "producteurs"} les
                  plus pertinents selon vos critères
                </p>
                <Badge variant="secondary" className="px-4 py-2">
                  <Flame className="w-4 h-4 mr-2" />
                  Disponible prochainement
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* ROUTE */}
          {activeTab === "route" && (
            <Card className="shadow-lg">
              <CardContent className="py-20 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                  <Route className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Optimisation de tournée
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Planifiez vos tournées de {isProd ? "livraison" : "collecte"}{" "}
                  de manière optimale pour économiser du temps et du carburant
                </p>
                <Badge variant="secondary" className="px-4 py-2">
                  <Flame className="w-4 h-4 mr-2" />
                  Disponible prochainement
                </Badge>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Dialog Détails */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              {selectedItem?.product?.nom || "Détails de l'annonce"}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Publié le{" "}
              {selectedItem &&
                new Date(selectedItem.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && displayUser && (
            <div className="space-y-6">
              {/* Profil du contact */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {displayUser.prenom?.[0]}
                  {displayUser.nom?.[0]}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">
                    {displayUser.prenom} {displayUser.nom}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {activeTab === "marketplace"
                      ? isProd
                        ? "Acheteur"
                        : "Producteur"
                      : isProd
                        ? "Producteur"
                        : "Acheteur"}{" "}
                    certifié
                  </p>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
                    {selectedItem.region}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant="secondary" className="justify-center">
                    Membre vérifié
                  </Badge>
                </div>
              </div>

              {/* Informations détaillées */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-gradient-to-br from-background to-muted/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Produit</p>
                  </div>
                  <p className="font-bold text-lg">
                    {selectedItem.product?.nom || "Non spécifié"}
                  </p>
                  {selectedItem.product?.categorie && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedItem.product.categorie}
                    </p>
                  )}
                </div>

                <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-gradient-to-br from-background to-muted/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Scale className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Quantité disponible
                    </p>
                  </div>
                  <p className="font-bold text-lg">
                    {selectedItem.quantite} {selectedItem.product?.unite}
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-green-200 transition-colors bg-gradient-to-br from-green-50 to-green-100/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-green-200 flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-green-700" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === "marketplace"
                        ? isProd
                          ? "Budget maximum"
                          : "Prix unitaire"
                        : isProd
                          ? "Prix unitaire"
                          : "Budget maximum"}
                    </p>
                  </div>
                  <p className="font-bold text-2xl text-green-600">
                    {activeTab === "marketplace"
                      ? isProd
                        ? selectedItem.budget_max
                        : selectedItem.prix_unitaire
                      : isProd
                        ? selectedItem.prix_unitaire
                        : selectedItem.budget_max}{" "}
                    <span className="text-base">Ar</span>
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-gradient-to-br from-background to-muted/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Localisation
                    </p>
                  </div>
                  <p className="font-bold text-lg">{selectedItem.region}</p>
                </div>
              </div>

              {/* Notes additionnelles */}
              {selectedItem.notes && (
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    Informations complémentaires
                  </p>
                  <p className="text-sm leading-relaxed">
                    {selectedItem.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button className="flex-1 gap-2 shadow-md" size="lg">
                  <Mail className="w-4 h-4" />
                  Envoyer un message
                </Button>
                <Button variant="outline" className="flex-1 gap-2" size="lg">
                  <Phone className="w-4 h-4" />
                  Appeler
                </Button>
                <Button variant="ghost" onClick={() => setDetailsOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
