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
  const marketLabel = isProd
    ? "Demandes des acheteurs "
    : "Offres des producteurs ";
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
      toast.error("Erreur chargement");
    } finally {
      setLoading(false);
      setLoadingMoreMy(false);
    }
  };

  const loadPrimaryItems = async (page = 1) => {
    if (!user) return;
    setLoading(true);
    try {
      let currentPage = page;
      let filtered: any[] = [];
      let backendTotal = 0;
      let backendTotalPages = 0;

      // Saute automatiquement les pages devenues vides après le filtrage (max 3 sauts)
      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await api.get(
          `${primaryEndpoint}?page=${currentPage}&page_size=12`,
        );
        const raw = res.data.items || res.data || [];
        backendTotal = res.data.total ?? raw.length;
        backendTotalPages =
          (res.data.total_pages ?? Math.ceil(backendTotal / 12)) || 1;

        filtered = raw.filter(
          (i: any) => (isProd ? i.producteur_id : i.acheteur_id) !== user.id,
        );

        // Si on trouve des items OU qu'on est à la dernière page, on arrête
        if (filtered.length > 0 || currentPage >= backendTotalPages) break;
        currentPage++;
      }

      setPrimaryItems(filtered);
      setPaginationData((prev) => ({
        ...prev,
        primary: {
          total: backendTotal,
          page: currentPage,
          total_pages: backendTotalPages,
        },
      }));
    } catch {
      toast.error("Erreur chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadMarketplaceItems = async (page = 1) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get(`${marketEndpoint}?page=${page}&page_size=12`);
      const rawItems = res.data.items || res.data || [];

      const total = res.data.total ?? rawItems.length;
      const total_pages = res.data.total_pages ?? Math.ceil(total / 12) ?? 1;

      setMarketplaceItems(rawItems);
      setPaginationData((prev) => ({
        ...prev,
        market: { total, page, total_pages },
      }));
    } catch {
      toast.error("Erreur marketplace");
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleEdit = (item: any) => {
    navigate(isProd ? `/edit-offer/${item.id}` : `/edit-demand/${item.id}`);
  };

  const handleDelete = async (itemId: number) => {
    if (!window.confirm("Supprimer cet élément ?")) return;
    try {
      await api.delete(`${isProd ? "/offers" : "/demands"}/${itemId}`);
      toast.success("Élément supprimé");
      loadMyItems(user, 1);
    } catch {
      toast.error("Erreur suppression");
    }
  };

  const handleViewDetails = async (itemId: number) => {
    try {
      const endpoint =
        activeTab === "marketplace" ? marketEndpoint : primaryEndpoint;
      const res = await api.get(`${endpoint}/${itemId}`);
      setSelectedItem(res.data);
      console.log(selectedItem);
      setDetailsOpen(true);
    } catch {
      toast.error("Erreur détails");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Déconnexion réussie");
    navigate("/login");
  };

  if (!user)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
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

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-72 border-r bg-card flex flex-col">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground">
            <Sprout className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold">Tantsaha Mivarotra</span>
        </div>

        <div className="flex-1 p-4 space-y-2">
          <Button
            variant={activeTab === "home" ? "default" : "ghost"}
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("home")}
          >
            <Home className="w-5 h-5" /> Accueil
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
              className="w-full justify-start gap-3"
            >
              {isProd ? (
                <ShoppingBag className="w-5 h-5" />
              ) : (
                <Truck className="w-5 h-5" />
              )}
              {primaryLabel}
              <ChevronDown
                className={`w-4 h-4 ml-auto transition-transform ${dropdowns.primary ? "rotate-180" : ""}`}
              />
            </Button>
            {dropdowns.primary && (
              <div className="pl-4 py-1 space-y-1">
                <Button
                  variant={activeTab === "my-primary" ? "default" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab("my-primary")}
                >
                  Mes {primaryLabel.toLowerCase()}
                </Button>
                <Button
                  variant={activeTab === "all-primary" ? "default" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab("all-primary")}
                >
                  Toutes les {primaryLabel.toLowerCase()}
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
              className="w-full justify-start gap-3"
            >
              <Store className="w-5 h-5" /> Marketplace
              <ChevronDown
                className={`w-4 h-4 ml-auto transition-transform ${dropdowns.market ? "rotate-180" : ""}`}
              />
            </Button>
            {dropdowns.market && (
              <div className="pl-4 py-1 space-y-1">
                <Button
                  variant={activeTab === "marketplace" ? "default" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab("marketplace")}
                >
                  <>
                    <Flame className="w-5 h-5" />
                    {marketLabel}
                  </>
                </Button>
              </div>
            )}
          </div>

          <Button
            variant={activeTab === "matching" ? "default" : "ghost"}
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("matching")}
          >
            <Route className="w-5 h-5" /> Matching Intelligent
          </Button>
          <Button
            variant={activeTab === "route" ? "default" : "ghost"}
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("route")}
          >
            <Route className="w-5 h-5" /> Itinéraire Optimal
          </Button>
        </div>

        <div className="p-4 border-t mt-auto">
          <div className="bg-muted rounded-lg p-3 mb-3">
            <div className="flex items-center gap-3">
              <UserCircle className="w-10 h-10 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {user.prenom} {user.nom}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" /> Déconnexion
          </Button>
        </div>
      </div>

      {/* Contenu Principal */}
      <div className="flex-1 overflow-auto">
        <header className="h-16 border-b bg-white px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-2xl font-semibold">
            {activeTab === "home" && "Accueil"}
            {activeTab === "my-primary" && `Mes ${primaryLabel}`}
            {activeTab === "all-primary" && `Toutes les ${primaryLabel}`}
            {activeTab === "marketplace" &&
              `Marketplace - ${isProd ? "Demandes" : "Offres"}`}
            {activeTab === "matching" && "Matching Intelligent"}
            {activeTab === "route" && "Itinéraire Optimal"}
          </h1>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (activeTab === "my-primary") loadMyItems(user, 1);
              if (activeTab === "all-primary")
                loadPrimaryItems(paginationData.primary.page);
              if (activeTab === "marketplace")
                loadMarketplaceItems(paginationData.market.page);
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Actualiser
          </Button>
        </header>

        <main className="p-8">
          {activeTab === "home" && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-16 mb-8">
                <h2 className="text-4xl font-bold mb-4">
                  Bienvenue, {user.prenom} !
                </h2>
                <p className="text-muted-foreground text-lg">
                  Plateforme de mise en relation agriculteurs - acheteurs
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setActiveTab("my-primary")}
                >
                  <CardContent className="pt-6 text-center">
                    {isProd ? (
                      <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-primary" />
                    ) : (
                      <Truck className="w-12 h-12 mx-auto mb-4 text-primary" />
                    )}
                    <h3 className="font-semibold text-lg mb-2">
                      Mes {primaryLabel}
                    </h3>
                    <p className="text-3xl font-bold text-primary">
                      {myItems.length}
                    </p>
                  </CardContent>
                </Card>
                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setActiveTab("all-primary")}
                >
                  <CardContent className="pt-6 text-center">
                    <Eye className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-semibold text-lg mb-2">
                      Analyser le marché
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Voir {primaryLabel.toLowerCase()} des autres
                    </p>
                  </CardContent>
                </Card>
                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setActiveTab("marketplace")}
                >
                  <CardContent className="pt-6 text-center">
                    <Search className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-semibold text-lg mb-2">Opportunités</h3>
                    <p className="text-sm text-muted-foreground">
                      {isProd
                        ? "Acheteurs en recherche"
                        : "Producteurs disponibles"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TABLEAU MES ITEMS (Pagination Infinie) */}
          {activeTab === "my-primary" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  Mes {primaryLabel} ({myItems.length})
                </CardTitle>
                <Button
                  onClick={() =>
                    navigate(isProd ? "/new-offer" : "/new-demand")
                  }
                  className="gap-2"
                >
                  <PlusCircle className="w-4 h-4" />{" "}
                  {isProd ? "Créer une offre" : "Poster une demande"}
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <OrganicSproutLoader text="Chargement..." />
                  </div>
                ) : myItems.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground text-lg mb-4">
                      Aucun élément publié.
                    </p>
                    <Button
                      onClick={() =>
                        navigate(isProd ? "/new-offer" : "/new-demand")
                      }
                    >
                      <PlusCircle className="w-4 h-4 mr-2" /> Créer votre
                      premier élément
                    </Button>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead>Quantité</TableHead>
                          <TableHead>
                            {isProd ? "Prix / Unité" : "Budget Max"}
                          </TableHead>
                          <TableHead>Région</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                  <Package className="w-4 h-4" />
                                </div>
                                <span className="font-medium">
                                  {item.product?.nom ||
                                    `Produit #${item.product_id}`}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Scale className="w-4 h-4 text-muted-foreground" />
                                {Number(item.quantite)}{" "}
                                {item.product?.unite || "kg"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Banknote className="w-4 h-4 text-muted-foreground" />
                                {isProd ? item.prix_unitaire : item.budget_max}{" "}
                                Ar
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="gap-1">
                                <MapPin className="w-3 h-3" /> {item.region}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {new Date(item.created_at).toLocaleDateString(
                                  "fr-FR",
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
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleDelete(item.id)}
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {hasMoreMy && (
                      <div
                        ref={loadMoreRef}
                        className="flex justify-center py-4"
                      >
                        <Button
                          variant="ghost"
                          onClick={() => loadMyItems(user, myPages + 1, true)}
                          disabled={loadingMoreMy}
                        >
                          {loadingMoreMy ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            "📥 Charger plus"
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
              <Card>
                <CardContent className="pt-6">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder={`Rechercher ${primaryLabel.toLowerCase()}...`}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>
              {loading ? (
                <div className="flex justify-center py-16">
                  <OrganicSproutLoader text="Chargement..." />
                </div>
              ) : primaryItems.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Eye className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground text-lg mb-2">
                      Aucune {primaryLabel.toLowerCase()} sur cette page
                    </p>
                    <p className="text-sm text-muted-foreground/80">
                      (Vos propres {primaryLabel.toLowerCase()} sont
                      automatiquement masquées pour analyser la concurrence)
                    </p>
                    {paginationData.primary.page <
                      paginationData.primary.total_pages && (
                      <Button
                        variant="link"
                        className="mt-4"
                        onClick={() =>
                          loadPrimaryItems(paginationData.primary.page + 1)
                        }
                      >
                        Voir la page suivante →
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {primaryItems.length} résultat(s) affiché(s)
                  </p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {primaryItems.map((item) => (
                      <Card
                        key={item.id}
                        className="hover:shadow-xl transition-all border-2 hover:border-primary/50"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-3 mb-4 pb-4 border-b">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
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
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {item.region}
                              </div>
                            </div>
                          </div>
                          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" />
                            {item.product?.nom || `Produit #${item.product_id}`}
                          </h3>
                          <div className="space-y-2 mb-4 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Quantité
                              </span>
                              <span className="font-medium">
                                {Number(item.quantite) +
                                  " " +
                                  item.product.unite}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                {isProd ? "Prix" : "Budget"}
                              </span>
                              <span className="font-medium text-primary">
                                {isProd ? item.prix_unitaire : item.budget_max}{" "}
                                Ar
                              </span>
                            </div>
                          </div>
                          <div className="pt-4 border-t flex items-center justify-between">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.created_at).toLocaleDateString(
                                "fr-FR",
                              )}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(item.id)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Détails
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {/* ✅ Pagination fiable grâce à auto-skip + total_pages backend */}
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
              <Card>
                <CardContent className="pt-6">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder={`Rechercher ${isProd ? "demande" : "offre"}...`}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>
              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : marketplaceItems.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <p className="text-muted-foreground">
                      Aucune opportunité disponible.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {paginationData.market.total} opportunité(s) disponible(s)
                  </p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {marketplaceItems.map((item) => (
                      <Card
                        key={item.id}
                        className="hover:shadow-xl transition-all border-2 hover:border-primary/50"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-3 mb-4 pb-4 border-b">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
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
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {item.region}
                              </div>
                            </div>
                          </div>
                          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" />
                            {item.product?.nom || `Produit #${item.product_id}`}
                          </h3>
                          <div className="space-y-2 mb-4 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Quantité
                              </span>
                              <span className="font-medium">
                                {Number(item.quantite) +
                                  " " +
                                  item.product.unite}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                {isProd ? "Budget" : "Prix"}
                              </span>
                              <span className="font-medium text-primary">
                                {isProd ? item.budget_max : item.prix_unitaire}{" "}
                                Ar
                              </span>
                            </div>
                          </div>
                          <div className="pt-4 border-t flex items-center justify-between">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.created_at).toLocaleDateString(
                                "fr-FR",
                              )}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(item.id)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
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

          {activeTab === "matching" && (
            <Card>
              <CardContent className="py-20 text-center">
                <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">
                  Matching Intelligent
                </h3>
                <p className="text-muted-foreground">
                  Fonctionnalité à venir prochainement
                </p>
              </CardContent>
            </Card>
          )}
          {activeTab === "route" && (
            <Card>
              <CardContent className="py-20 text-center">
                <Route className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">
                  Itinéraire Optimal
                </h3>
                <p className="text-muted-foreground">
                  Fonctionnalité à venir prochainement
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Dialog Détails */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedItem?.product?.nom || "Détails"}
            </DialogTitle>
            <DialogDescription>
              Publié le{" "}
              {selectedItem &&
                new Date(selectedItem.created_at).toLocaleDateString("fr-FR")}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                  {isProd
                    ? selectedItem.acheteur?.prenom?.[0]
                    : selectedItem.producteur?.prenom?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {isProd
                      ? `${selectedItem.acheteur?.prenom} ${selectedItem.acheteur?.nom}`
                      : `${selectedItem.producteur?.prenom} ${selectedItem.producteur?.nom}`}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {isProd ? "Acheteur" : "Producteur"}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
                    {selectedItem.region}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg flex items-center gap-3">
                  <Package className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Produit</p>
                    <p className="font-semibold">
                      {selectedItem.product?.nom || "Non spécifié"}
                    </p>
                  </div>
                </div>
                <div className="p-4 border rounded-lg flex items-center gap-3">
                  <Scale className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Quantité</p>
                    <p className="font-semibold">
                      {selectedItem.quantite + " " + selectedItem.product.unite}
                    </p>
                  </div>
                </div>
                <div className="p-4 border rounded-lg flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isProd ? "Budget max" : "Prix unitaire"}
                    </p>
                    <p className="font-semibold text-primary">
                      {isProd
                        ? selectedItem.budget_max
                        : selectedItem.prix_unitaire}{" "}
                      Ar
                    </p>
                  </div>
                </div>
                <div className="p-4 border rounded-lg flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Région</p>
                    <p className="font-semibold">{selectedItem.region}</p>
                  </div>
                </div>
              </div>
              {selectedItem.notes && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p>{selectedItem.notes}</p>
                </div>
              )}
              <div className="flex gap-3">
                <Button className="flex-1">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Contacter
                </Button>
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
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
