import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import CrudDialog from "@/components/CrudDialog";
import SuggestionsTab from "@/components/SuggestionsTab";
import NotificationBell from "@/components/NotificationBell";
import NegociationsPanel from "@/components/NegociationsPanel";
import NegociationChat from "@/components/NegociationChat";
import ProductSuggestionsDialog from "@/components/ProductSuggestionsDialog";
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
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  Star,
  X,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { OrganicSproutLoader } from "@/components/ui/agriculture-loader-overlay";

// ── SearchBarWithTrie défini EN DEHORS du composant ──────────────────────────
// Ceci est critique : s'il est à l'intérieur, React le recrée à chaque frappe
// et l'input perd le focus.
interface SearchBarProps {
  value: string;
  onChange: (q: string) => void;
  suggestions: string[];
  suggestionsOpen: boolean;
  onSelectSuggestion: (s: string) => void;
  onClear: () => void;
  onFocus: () => void;
  placeholder: string;
  searchRef: React.RefObject<HTMLDivElement>;
}

function SearchBarWithTrie({
  value,
  onChange,
  suggestions,
  suggestionsOpen,
  onSelectSuggestion,
  onClear,
  onFocus,
  placeholder,
  searchRef,
}: SearchBarProps) {
  return (
    <div className="relative flex-1 max-w-md" ref={searchRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none z-10" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="pl-10 pr-9"
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
          onMouseDown={(e) => {
            e.preventDefault();
            onClear();
          }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {suggestionsOpen && suggestions.length > 0 && (
        <div className="absolute z-[9999] top-full mt-1 w-full bg-card border rounded-xl shadow-xl overflow-hidden">
          <div className="px-3 py-1.5 border-b bg-muted/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
              Suggestions
            </p>
          </div>
          <ul className="max-h-48 overflow-y-auto divide-y">
            {suggestions.map((s) => (
              <li
                key={s}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectSuggestion(s);
                }}
                className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-primary/5 transition-colors"
              >
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Search className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Pagination définie EN DEHORS aussi ───────────────────────────────────────
function StandardPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
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
}

// ── Composant principal ──────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<
    | "home"
    | "my-primary"
    | "all-primary"
    | "marketplace"
    | "matching"
    | "negociations"
    | "route"
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

  // Dialog détails marketplace
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // CRUD
  const [crudOpen, setCrudOpen] = useState(false);
  const [crudMode, setCrudMode] = useState<"create" | "edit">("create");
  const [crudItem, setCrudItem] = useState<any>(null);

  // Product suggestions (marketplace + mes offres)
  const [productSuggestionsOpen, setProductSuggestionsOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [selectedProductName, setSelectedProductName] = useState("");

  // Négociation chat
  const [negociationOpen, setNegociationOpen] = useState(false);
  const [negociationData, setNegociationData] = useState<any>(null);

  // Stats
  const [statsData, setStatsData] = useState({
    total_matches: 0,
    contacts_etablis: 0,
    negociations: 0,
  });

  // Recherche — état centralisé ici, pas dans SearchBarWithTrie
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fermer dropdown si clic dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset recherche au changement de tab
  useEffect(() => {
    setSearchQuery("");
    setSearchSuggestions([]);
    setSearchOpen(false);
  }, [activeTab]);

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
      setPrimaryItems(res.data.items || []);
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
      setMarketplaceItems(res.data.items || []);
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
      const noms = (res.data ?? []).map((p: any) => p.nom);
      setSearchSuggestions(noms);
      setSearchOpen(noms.length > 0);
    } catch {}
  }, []);

  const handleSelectSuggestion = (s: string) => {
    setSearchQuery(s);
    setSearchOpen(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchSuggestions([]);
    setSearchOpen(false);
  };

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

  // CRUD
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
    if (!window.confirm("Confirmer la suppression ?")) return;
    try {
      await api.delete(`${isProd ? "/offers" : "/demands"}/${itemId}`);
      toast.success("Supprimé avec succès");
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
      toast.error("Erreur de chargement");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("À bientôt !");
    navigate("/login");
  };

  // Deadline
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

  // Ouvrir suggestions produit
  const openProductSuggestions = (productId: number, productName: string) => {
    setSelectedProductId(productId);
    setSelectedProductName(productName);
    setProductSuggestionsOpen(true);
  };

  const getDisplayUser = () => {
    if (!selectedItem) return null;
    if (activeTab === "marketplace")
      return isProd ? selectedItem.acheteur : selectedItem.producteur;
    return isProd ? selectedItem.producteur : selectedItem.acheteur;
  };
  const displayUser = getDisplayUser();

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
            className="w-full justify-start gap-3 hover:bg-primary/10"
            onClick={() => setActiveTab("home")}
          >
            <Home className="w-5 h-5" />
            Tableau de bord
          </Button>

          {/* Mes offres/demandes */}
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
              className="w-full justify-start gap-3 hover:bg-primary/10"
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

          {/* Marketplace */}
          <div
            onMouseEnter={() => setDropdowns((p) => ({ ...p, market: true }))}
            onMouseLeave={() => setDropdowns((p) => ({ ...p, market: false }))}
          >
            <Button
              variant={activeTab === "marketplace" ? "default" : "ghost"}
              className="w-full justify-start gap-3 hover:bg-primary/10"
            >
              <Store className="w-5 h-5" />
              <span className="flex-1 text-left">Marketplace</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${dropdowns.market ? "rotate-180" : ""}`}
              />
            </Button>
            {dropdowns.market && (
              <div className="pl-4 py-1 animate-in slide-in-from-top-2">
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

          <div className="pt-2 border-t space-y-1">
            <Button
              variant={activeTab === "matching" ? "default" : "ghost"}
              className="w-full justify-start gap-3 hover:bg-primary/10"
              onClick={() => setActiveTab("matching")}
            >
              <Target className="w-5 h-5" />
              Suggestions pour vous
            </Button>
            <Button
              variant={activeTab === "negociations" ? "default" : "ghost"}
              className="w-full justify-start gap-3 hover:bg-primary/10"
              onClick={() => setActiveTab("negociations")}
            >
              <MessageCircle className="w-5 h-5" />
              Mes négociations
            </Button>
            <Button
              variant={activeTab === "route" ? "default" : "ghost"}
              className="w-full justify-start gap-3 hover:bg-primary/10"
              onClick={() => setActiveTab("route")}
            >
              <Route className="w-5 h-5" />
              Optimisation de tournée
            </Button>
          </div>
        </div>

        <div className="p-4 border-t bg-muted/30">
          <div className="bg-card rounded-lg p-3 mb-3 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold shadow">
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

      {/* ── Contenu principal ── */}
      <div className="flex-1 overflow-auto">
        <header className="h-16 border-b bg-card/95 backdrop-blur-sm px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {activeTab === "home" && "Tableau de bord"}
            {activeTab === "my-primary" && `Mes ${primaryLabel}`}
            {activeTab === "all-primary" && "Analyse du marché"}
            {activeTab === "marketplace" &&
              (isProd ? "Opportunités d'achat" : "Opportunités de vente")}
            {activeTab === "matching" && "Suggestions pour vous"}
            {activeTab === "negociations" && "Mes négociations"}
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
                loadStats();
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
                    La plateforme agricole qui connecte les producteurs et les
                    acheteurs de Madagascar
                  </span>
                </div>
                <h2 className="text-4xl font-bold mb-4">
                  Bienvenue, {user.prenom} ! 👋
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  {isProd
                    ? "Vendez vos récoltes au juste prix, directement aux acheteurs de votre région. Fini les intermédiaires."
                    : "Trouvez des producteurs locaux fiables, négociez directement et approvisionnez-vous au meilleur prix."}
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
                      {isProd ? "Produits en vente" : "Demandes actives"}
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-primary/50 group"
                  onClick={() => setActiveTab("matching")}
                >
                  <CardContent className="pt-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">
                      Suggestions pour vous
                    </h3>
                    <p className="text-4xl font-bold text-violet-600 mb-2">
                      {statsData.total_matches}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Correspondances trouvées
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
                        ? "Des acheteurs cherchent vos produits en ce moment"
                        : "Des producteurs locaux proposent leurs récoltes"}
                    </p>
                  </CardContent>
                </Card>
              </div>

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
                      <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {statsData.total_matches}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Correspondances
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
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
                    {isProd ? "produit(s) en vente" : "demande(s) active(s)"}
                    {" · "}cliquez sur une ligne pour voir les opportunités
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
                        ? "Publiez votre première offre"
                        : "Publiez votre première demande"}
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {isProd
                        ? "Atteignez des centaines d'acheteurs locaux et vendez vos récoltes au juste prix."
                        : "Décrivez vos besoins et laissez les producteurs venir à vous."}
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
                              Région
                            </TableHead>
                            <TableHead className="font-semibold">
                              Deadline
                            </TableHead>
                            <TableHead className="font-semibold">
                              Opportunités
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
                                  onClick={() => {
                                    if (!expired)
                                      openProductSuggestions(
                                        item.product_id,
                                        item.product?.nom ?? "",
                                      );
                                  }}
                                  className={`transition-colors ${expired ? "opacity-50 bg-muted/30 cursor-default" : "hover:bg-primary/5 cursor-pointer"}`}
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
                                        <Sparkles className="w-2.5 h-2.5" />
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
                      value={searchQuery}
                      onChange={handleSearch}
                      suggestions={searchSuggestions}
                      suggestionsOpen={searchOpen}
                      onSelectSuggestion={handleSelectSuggestion}
                      onClear={handleClearSearch}
                      onFocus={() =>
                        searchSuggestions.length > 0 && setSearchOpen(true)
                      }
                      placeholder={`Rechercher parmi les ${primaryLabel.toLowerCase()}...`}
                      searchRef={searchRef}
                    />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      <span>Analysez les prix du marché en temps réel</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {loading ? (
                <div className="flex justify-center py-20">
                  <OrganicSproutLoader text="Analyse du marché en cours..." />
                </div>
              ) : primaryItems.length === 0 ? (
                <Card>
                  <CardContent className="py-20 text-center">
                    <Eye className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      Aucune donnée disponible
                    </h3>
                    <p className="text-muted-foreground">
                      Les annonces des autres utilisateurs apparaîtront ici.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span className="font-medium">
                      {filterBySearch(primaryItems).length}
                    </span>{" "}
                    {primaryLabel.toLowerCase()} sur le marché
                  </p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filterBySearch(primaryItems).map((item) => (
                      <Card
                        key={item.id}
                        className="hover:shadow-xl transition-all border-2 hover:border-primary/50 group"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-3 mb-4 pb-4 border-b">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
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
                                { day: "numeric", month: "short" },
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
                      value={searchQuery}
                      onChange={handleSearch}
                      suggestions={searchSuggestions}
                      suggestionsOpen={searchOpen}
                      onSelectSuggestion={handleSelectSuggestion}
                      onClear={handleClearSearch}
                      onFocus={() =>
                        searchSuggestions.length > 0 && setSearchOpen(true)
                      }
                      placeholder={`Trouvez ${isProd ? "des acheteurs pour vos produits" : "des producteurs près de chez vous"}...`}
                      searchRef={searchRef}
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
                    <p className="text-muted-foreground">
                      Revenez bientôt — de nouvelles annonces sont publiées
                      chaque jour.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-600" />
                    <span className="text-orange-600">
                      {filterBySearch(marketplaceItems).length}
                    </span>
                    <span className="text-muted-foreground">
                      opportunité(s) disponible(s)
                    </span>
                  </p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filterBySearch(marketplaceItems).map((item) => (
                      <Card
                        key={item.id}
                        className="hover:shadow-xl transition-all border-2 hover:border-orange-400 group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 opacity-10 rounded-bl-full" />
                        <CardContent className="p-6 relative">
                          <div className="flex items-start gap-3 mb-4 pb-4 border-b">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold text-lg shadow-md">
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
                                {isProd
                                  ? "Acheteur vérifié"
                                  : "Producteur local"}
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
                                { day: "numeric", month: "short" },
                              )}
                            </span>
                            <Button
                              size="sm"
                              className="gap-1.5 text-xs bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-sm"
                              onClick={() =>
                                openProductSuggestions(
                                  item.product_id,
                                  item.product?.nom ?? "",
                                )
                              }
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Voir les opportunités
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

          {/* ── SUGGESTIONS ── */}
          {activeTab === "matching" && <SuggestionsTab user={user} />}

          {/* ── NÉGOCIATIONS ── */}
          {activeTab === "negociations" && <NegociationsPanel user={user} />}

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
                  de manière optimale pour économiser du temps et du carburant.
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
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
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-2xl shadow-lg">
                  {displayUser.prenom?.[0]}
                  {displayUser.nom?.[0]}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">
                    {displayUser.prenom} {displayUser.nom}
                  </p>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                    <MapPin className="w-4 h-4" />
                    {selectedItem.region}
                  </div>
                  {displayUser.telephone && (
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-primary mt-0.5">
                      <Phone className="w-4 h-4" />
                      {displayUser.telephone}
                    </div>
                  )}
                </div>
                <Badge variant="secondary">Membre vérifié</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 border rounded-xl bg-gradient-to-br from-background to-muted/20">
                  <p className="text-xs text-muted-foreground mb-1">Produit</p>
                  <p className="font-bold text-lg">
                    {selectedItem.product?.nom}
                  </p>
                  {selectedItem.product?.categorie && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedItem.product.categorie}
                    </p>
                  )}
                </div>
                <div className="p-4 border rounded-xl bg-gradient-to-br from-background to-muted/20">
                  <p className="text-xs text-muted-foreground mb-1">Quantité</p>
                  <p className="font-bold text-lg">
                    {selectedItem.quantite} {selectedItem.product?.unite}
                  </p>
                </div>
                <div className="p-4 border rounded-xl bg-gradient-to-br from-green-50 to-green-100/20 col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    {activeTab === "marketplace"
                      ? isProd
                        ? "Budget maximum"
                        : "Prix unitaire"
                      : isProd
                        ? "Prix unitaire"
                        : "Budget maximum"}
                  </p>
                  <p className="font-bold text-2xl text-green-600">
                    {(activeTab === "marketplace"
                      ? isProd
                        ? selectedItem.budget_max
                        : selectedItem.prix_unitaire
                      : isProd
                        ? selectedItem.prix_unitaire
                        : selectedItem.budget_max
                    )?.toLocaleString()}{" "}
                    <span className="text-base font-normal">Ar</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
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
                  onClick={() => {
                    setDetailsOpen(false);
                    openProductSuggestions(
                      selectedItem.product_id,
                      selectedItem.product?.nom ?? "",
                    );
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  Voir les opportunités
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── ProductSuggestionsDialog ── */}
      <ProductSuggestionsDialog
        open={productSuggestionsOpen}
        onClose={() => setProductSuggestionsOpen(false)}
        productId={selectedProductId}
        productName={selectedProductName}
        user={user}
        onNegociate={(s) => {
          setNegociationData(s);
          setNegociationOpen(true);
        }}
      />

      {/* ── NegociationChat ── */}
      <NegociationChat
        open={negociationOpen}
        onClose={() => setNegociationOpen(false)}
        matchId={negociationData?.match_id ?? null}
        contactNom={negociationData?.contact_nom ?? ""}
        productName={negociationData?.product_name ?? ""}
        productUnite={negociationData?.product_unite}
        contactTelephone={negociationData?.contact_telephone}
        matchStatut={negociationData?.match_statut}
      />

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
