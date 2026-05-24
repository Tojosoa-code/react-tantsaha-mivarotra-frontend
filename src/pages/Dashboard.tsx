import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import CrudDialog from "@/components/CrudDialog";
import SuggestionsTab from "@/components/SuggestionsTab";
import NotificationBell from "@/components/NotificationBell";
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
  CheckCircle2,
  Clock,
  AlertCircle,
  Star,
  X,
} from "lucide-react";
import { OrganicSproutLoader } from "@/components/ui/agriculture-loader-overlay";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<
    "home" | "my-primary" | "all-primary" | "marketplace" | "matching" | "route"
  >("home");

  const [myItems, setMyItems] = useState<any[]>([]);
  const [primaryItems, setPrimaryItems] = useState<any[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);

  const [paginationData, setPaginationData] = useState({
    my: { total: 0, page: 1, total_pages: 0 },
    primary: { total: 0, page: 1, total_pages: 0 },
    market: { total: 0, page: 1, total_pages: 0 },
  });

  const [loading, setLoading] = useState(false);
  const [dropdowns, setDropdowns] = useState({ primary: false, market: false });
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // CRUD
  const [crudOpen, setCrudOpen] = useState(false);
  const [crudMode, setCrudMode] = useState<"create" | "edit">("create");
  const [crudItem, setCrudItem] = useState<any>(null);

  // Suggestions par item
  const [itemSuggestionsOpen, setItemSuggestionsOpen] = useState(false);
  const [itemSuggestions, setItemSuggestions] = useState<any[]>([]);
  const [itemSuggestionsLoading, setItemSuggestionsLoading] = useState(false);
  const [focusedItem, setFocusedItem] = useState<any>(null);

  // Recherche
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Stats
  const [statsData, setStatsData] = useState({
    total_matches: 0,
    contacts_etablis: 0,
    negociations: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const isProd = user?.role === "producteur";
  const primaryLabel = isProd ? "Offres" : "Demandes";
  const primaryEndpoint = isProd ? "/offers" : "/demands";
  const myEndpoint = isProd ? "/users/me/offers" : "/users/me/demands";
  const marketEndpoint = isProd ? "/demands" : "/offers";

  useEffect(() => {
    if (!user) return;
    loadStats();
    if (activeTab === "my-primary") loadMyItems(1);
    if (activeTab === "all-primary") loadPrimaryItems(1);
    if (activeTab === "marketplace") loadMarketplaceItems(1);
  }, [activeTab, user]);

  const loadStats = async () => {
    try {
      const res = await api.get("/matches/suggestions?limit=50");
      const suggestions = res.data.suggestions ?? [];
      setStatsData({
        total_matches: res.data.count ?? 0,
        contacts_etablis: suggestions.filter((s: any) =>
          ["interested", "negotiating", "done"].includes(s.match_statut),
        ).length,
        negociations: suggestions.filter(
          (s: any) => s.match_statut === "negotiating",
        ).length,
      });
    } catch {}
  };

  const loadMyItems = async (page = 1) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get(`${myEndpoint}?page=${page}&page_size=12`);
      const items = res.data.items || res.data || [];
      const total = res.data.total ?? items.length;
      const total_pages = (res.data.total_pages ?? Math.ceil(total / 12)) || 1;
      setMyItems(items);
      setPaginationData((prev) => ({
        ...prev,
        my: { total, page, total_pages },
      }));
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadPrimaryItems = async (page = 1) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get(
        `${primaryEndpoint}?page=${page}&page_size=12&exclude_current_user=true`,
      );
      const items = res.data.items || [];
      setPrimaryItems(items);
      setPaginationData((prev) => ({
        ...prev,
        primary: {
          total: res.data.total ?? 0,
          page,
          total_pages: res.data.total_pages ?? 1,
        },
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
      setMarketplaceItems(items);
      setPaginationData((prev) => ({
        ...prev,
        market: {
          total: res.data.total ?? 0,
          page,
          total_pages: res.data.total_pages ?? 1,
        },
      }));
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  // CRUD handlers
  const handleCreate = () => {
    setCrudItem(null);
    setCrudMode("create");
    setCrudOpen(true);
  };

  const handleEdit = (item: any) => {
    setCrudItem(item);
    setCrudMode("edit");
    setCrudOpen(true);
  };

  const handleDelete = async (itemId: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet élément ?"))
      return;
    try {
      await api.delete(`${isProd ? "/offers" : "/demands"}/${itemId}`);
      toast.success("Élément supprimé avec succès");
      loadMyItems(1);
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

  // Deadline helpers
  const isExpired = (item: any): boolean => {
    const deadline = isProd ? item.date_dispo_fin : item.date_souhaitee;
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const DeadlineBadge = ({ item }: { item: any }) => {
    const deadline = isProd ? item.date_dispo_fin : item.date_souhaitee;
    if (!deadline)
      return <span className="text-xs text-muted-foreground">—</span>;
    const diff = Math.ceil(
      (new Date(deadline).getTime() - Date.now()) / 86400000,
    );
    if (diff < 0)
      return (
        <Badge variant="destructive" className="text-xs gap-1">
          <X className="w-2.5 h-2.5" />
          Expiré
        </Badge>
      );
    if (diff <= 3)
      return (
        <Badge className="text-xs gap-1 bg-red-100 text-red-700 border-red-200">
          <AlertCircle className="w-2.5 h-2.5" />
          {diff}j
        </Badge>
      );
    if (diff <= 7)
      return (
        <Badge className="text-xs gap-1 bg-amber-100 text-amber-700 border-amber-200">
          <Clock className="w-2.5 h-2.5" />
          {diff}j
        </Badge>
      );
    return (
      <Badge variant="secondary" className="text-xs gap-1">
        <CheckCircle2 className="w-2.5 h-2.5 text-green-600" />
        {new Date(deadline).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        })}
      </Badge>
    );
  };

  // Suggestions par item
  const handleRowClick = async (item: any) => {
    if (isExpired(item)) return;
    setFocusedItem(item);
    setItemSuggestionsOpen(true);
    setItemSuggestionsLoading(true);
    try {
      const res = await api.get("/matches/suggestions?limit=20");
      const all = res.data.suggestions ?? [];
      setItemSuggestions(
        all.filter((s: any) => s.product_name === item.product?.nom),
      );
    } catch {
      toast.error("Impossible de charger les suggestions");
    } finally {
      setItemSuggestionsLoading(false);
    }
  };

  // Recherche Trie
  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchSuggestions([]);
      setSearchOpen(false);
      return;
    }
    try {
      const res = await api.get(
        `/matches/search?prefix=${encodeURIComponent(q)}`,
      );
      setSearchSuggestions((res.data ?? []).map((p: any) => p.nom));
      setSearchOpen(true);
    } catch {}
  }, []);

  const filterBySearch = (items: any[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.product?.nom?.toLowerCase().includes(q) ||
        item.product?.categorie?.toLowerCase().includes(q) ||
        item.region?.toLowerCase().includes(q),
    );
  };

  const getDisplayUser = () => {
    if (!selectedItem) return null;
    if (activeTab === "marketplace") {
      return isProd ? selectedItem.acheteur : selectedItem.producteur;
    }
    return isProd ? selectedItem.producteur : selectedItem.acheteur;
  };

  const displayUser = getDisplayUser();

  // Barre de recherche avec Trie
  const SearchBarWithTrie = ({ placeholder }: { placeholder: string }) => (
    <div className="relative flex-1 max-w-md" ref={searchRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
      <Input
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => searchSuggestions.length > 0 && setSearchOpen(true)}
        placeholder={placeholder}
        className="pl-10 pr-9"
      />
      {searchQuery && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSearchQuery("");
            setSearchSuggestions([]);
            setSearchOpen(false);
          }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {searchOpen && searchSuggestions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border rounded-lg shadow-lg overflow-hidden">
          <ul className="max-h-40 overflow-y-auto divide-y">
            {searchSuggestions.map((s) => (
              <li
                key={s}
                onClick={() => {
                  setSearchQuery(s);
                  setSearchOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 text-sm"
              >
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

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

  if (!user)
    return (
      <div className="flex h-screen items-center justify-center">
        <OrganicSproutLoader text="Préparation de votre espace..." />
      </div>
    );

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-muted/20">
      {/* ── Sidebar ── */}
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
            Tableau de bord
          </Button>

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
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab("my-primary")}
                >
                  <Package className="w-4 h-4" />
                  Gérer mes {primaryLabel.toLowerCase()}
                </Button>
                <Button
                  variant={activeTab === "all-primary" ? "default" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab("all-primary")}
                >
                  <TrendingUp className="w-4 h-4" />
                  Analyser le marché
                </Button>
              </div>
            )}
          </div>

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
                  className="w-full justify-start gap-3"
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
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-light shadow">
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

      {/* ── Contenu Principal ── */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
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
          <div className="flex items-center gap-2">
            <NotificationBell onMatchClick={() => setActiveTab("matching")} />
            <Button
              size="sm"
              variant="outline"
              className="gap-2 hover:bg-primary/10"
              onClick={() => {
                if (activeTab === "my-primary") loadMyItems(1);
                if (activeTab === "all-primary")
                  loadPrimaryItems(paginationData.primary.page);
                if (activeTab === "marketplace")
                  loadMarketplaceItems(paginationData.market.page);
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </Button>
          </div>
        </header>

        <main className="p-8">
          {/* ── HOME ── */}
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

              {/* Stats réelles */}
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
                        <Star className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {statsData.total_matches}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Correspondances trouvées
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
                        <p className="text-2xl font-bold">
                          {statsData.contacts_etablis}
                        </p>
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
                        <p className="text-2xl font-bold">
                          {statsData.negociations}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Négociations en cours
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ── MES ITEMS ── */}
          {activeTab === "my-primary" && (
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Mes {primaryLabel}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {paginationData.my.total}{" "}
                    {isProd
                      ? "produit(s) disponible(s)"
                      : "demande(s) active(s)"}
                  </p>
                </div>
                <Button onClick={handleCreate} className="gap-2 shadow-sm">
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
                    <Button size="lg" onClick={handleCreate} className="gap-2">
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
                              {isProd ? "Prix unitaire" : "Budget max"}
                            </TableHead>
                            <TableHead className="font-semibold">
                              Localisation
                            </TableHead>
                            <TableHead className="font-semibold">
                              Deadline
                            </TableHead>
                            <TableHead className="font-semibold">
                              Suggestions
                            </TableHead>
                            <TableHead className="text-right font-semibold">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...myItems]
                            .sort(
                              (a, b) =>
                                Number(isExpired(a)) - Number(isExpired(b)),
                            )
                            .map((item) => {
                              const expired = isExpired(item);
                              return (
                                <TableRow
                                  key={item.id}
                                  onClick={() => handleRowClick(item)}
                                  className={`transition-colors ${
                                    expired
                                      ? "opacity-50 bg-muted/30 cursor-default"
                                      : "hover:bg-primary/5 cursor-pointer"
                                  }`}
                                >
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${expired ? "bg-muted" : "bg-primary/10"}`}
                                      >
                                        <Package
                                          className={`w-4 h-4 ${expired ? "text-muted-foreground" : "text-primary"}`}
                                        />
                                      </div>
                                      <div>
                                        <p
                                          className={`font-medium text-sm ${expired ? "line-through text-muted-foreground" : ""}`}
                                        >
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
                                    <span className="text-sm font-medium">
                                      {Number(item.quantite)}{" "}
                                      {item.product?.unite || "kg"}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span
                                      className={`text-sm font-semibold ${expired ? "text-muted-foreground" : "text-green-600"}`}
                                    >
                                      {(isProd
                                        ? item.prix_unitaire
                                        : item.budget_max
                                      )?.toLocaleString()}{" "}
                                      Ar
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="secondary"
                                      className="gap-1 text-xs"
                                    >
                                      <MapPin className="w-3 h-3" />
                                      {item.region}
                                    </Badge>
                                  </TableCell>
                                  <TableCell
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <DeadlineBadge item={item} />
                                  </TableCell>
                                  <TableCell>
                                    {expired ? (
                                      <span className="text-xs text-muted-foreground">
                                        —
                                      </span>
                                    ) : (
                                      <Badge className="gap-1 text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer">
                                        <Star className="w-2.5 h-2.5" />
                                        Voir
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell
                                    className="text-right"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex justify-end gap-1.5">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleEdit(item)}
                                        className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleDelete(item.id)}
                                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                    <StandardPagination
                      page={paginationData.my.page}
                      totalPages={paginationData.my.total_pages}
                      onChange={(p) => loadMyItems(p)}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── ANALYSE MARCHÉ ── */}
          {activeTab === "all-primary" && (
            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <SearchBarWithTrie
                      placeholder={`Rechercher parmi les ${primaryLabel.toLowerCase()}...`}
                    />
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
                    <Eye className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      Aucune donnée disponible
                    </h3>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span className="font-medium">
                        {filterBySearch(primaryItems).length}
                      </span>{" "}
                      {primaryLabel.toLowerCase()} disponible(s)
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filterBySearch(primaryItems).map((item) => (
                      <Card
                        key={item.id}
                        className="hover:shadow-xl transition-all border-2 hover:border-primary/50 group"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-3 mb-4 pb-4 border-b">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-light text-lg">
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
                                  )?.toLocaleString()}{" "}
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

          {/* ── MARKETPLACE ── */}
          {activeTab === "marketplace" && (
            <div className="space-y-6">
              <Card className="shadow-sm bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <SearchBarWithTrie
                      placeholder={`Trouvez ${isProd ? "des acheteurs" : "des produits"}...`}
                    />
                    <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
                      <Flame className="w-4 h-4" />
                      Opportunités en direct
                    </div>
                  </div>
                </CardContent>
              </Card>

              {loading ? (
                <div className="flex justify-center py-20">
                  <OrganicSproutLoader text="Recherche des meilleures opportunités..." />
                </div>
              ) : marketplaceItems.length === 0 ? (
                <Card>
                  <CardContent className="py-20 text-center">
                    <Store className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      Aucune opportunité pour le moment
                    </h3>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-600" />
                      <span className="text-orange-600">
                        {filterBySearch(marketplaceItems).length}
                      </span>
                      <span className="text-muted-foreground">
                        opportunité(s) disponible(s)
                      </span>
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filterBySearch(marketplaceItems).map((item) => (
                      <Card
                        key={item.id}
                        className="hover:shadow-xl transition-all border-2 hover:border-orange-400 group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 opacity-10 rounded-bl-full" />
                        <CardContent className="p-6 relative">
                          <div className="flex items-start gap-3 mb-4 pb-4 border-b">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-light text-lg shadow-md">
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
                                {isProd ? "Acheteur" : "Producteur"}
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
                                  )?.toLocaleString()}{" "}
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

          {/* ── MATCHING ── */}
          {activeTab === "matching" && <SuggestionsTab user={user} />}

          {/* ── ROUTE ── */}
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
                  de manière optimale
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

      {/* ── Dialog Détails ── */}
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
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-light text-2xl shadow-lg">
                  {displayUser.prenom?.[0]}
                  {displayUser.nom?.[0]}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">
                    {displayUser.prenom} {displayUser.nom}
                  </p>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
                    {selectedItem.region}
                  </div>
                  {displayUser.telephone && (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-primary mt-1">
                      <Phone className="w-4 h-4" />
                      {displayUser.telephone}
                    </div>
                  )}
                </div>
                <Badge variant="secondary">Membre vérifié</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-gradient-to-br from-background to-muted/20">
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

                <div className="p-4 border rounded-lg bg-gradient-to-br from-background to-muted/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Scale className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">Quantité</p>
                  </div>
                  <p className="font-bold text-lg">
                    {selectedItem.quantite} {selectedItem.product?.unite}
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-green-100/20">
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
                    {(activeTab === "marketplace"
                      ? isProd
                        ? selectedItem.budget_max
                        : selectedItem.prix_unitaire
                      : isProd
                        ? selectedItem.prix_unitaire
                        : selectedItem.budget_max
                    )?.toLocaleString()}{" "}
                    <span className="text-base">Ar</span>
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-gradient-to-br from-background to-muted/20">
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

              <div className="flex gap-3 pt-4 border-t">
                {displayUser.telephone && (
                  <Button
                    className="flex-1 gap-2"
                    size="lg"
                    onClick={() => window.open(`tel:${displayUser.telephone}`)}
                  >
                    <Phone className="w-4 h-4" />
                    Appeler
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  size="lg"
                  onClick={() => setDetailsOpen(false)}
                >
                  <Mail className="w-4 h-4" />
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog suggestions par produit ── */}
      <Dialog open={itemSuggestionsOpen} onOpenChange={setItemSuggestionsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
                <Star className="w-4 h-4" />
              </div>
              Suggestions — {focusedItem?.product?.nom}
            </DialogTitle>
            <DialogDescription>
              {isProd
                ? "Acheteurs intéressés par ce produit"
                : "Producteurs disponibles pour ce produit"}
            </DialogDescription>
          </DialogHeader>
          {itemSuggestionsLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Calcul des correspondances…
            </div>
          ) : itemSuggestions.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                Aucune correspondance pour ce produit
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Le système cherchera automatiquement dès qu'un partenaire publie
                une annonce.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {itemSuggestions.map((s) => (
                <div
                  key={s.match_id}
                  className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-semibold text-primary">
                      {Math.round(s.score)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {s.contact_nom}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {s.contact_region}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {s.distance_km} km
                      </span>
                    </div>
                    {s.contact_telephone && (
                      <p className="text-xs font-medium text-primary mt-0.5">
                        {s.contact_telephone}
                      </p>
                    )}
                  </div>
                  {s.contact_telephone && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 text-xs"
                      onClick={() => window.open(`tel:${s.contact_telephone}`)}
                    >
                      <Phone className="w-3 h-3" />
                      Appeler
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── CrudDialog ── */}
      <CrudDialog
        open={crudOpen}
        onClose={() => setCrudOpen(false)}
        mode={crudMode}
        type={isProd ? "offer" : "demand"}
        item={crudItem}
        user={user}
        onSuccess={() => {
          loadMyItems(1);
          loadStats();
        }}
      />
    </div>
  );
}
