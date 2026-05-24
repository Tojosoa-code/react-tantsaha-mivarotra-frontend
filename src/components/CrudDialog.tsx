import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/axios";
import { REGION_COORDS } from "@/helpers/region";
import {
  Package,
  Scale,
  Banknote,
  Calendar,
  Search,
  Loader2,
  PlusCircle,
  Pencil,
  X,
  MapPin,
} from "lucide-react";

interface Product {
  id: number;
  nom: string;
  categorie: string;
  unite: string;
}

interface CrudDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  type: "offer" | "demand";
  item?: any;
  user: any;
  onSuccess: () => void;
}

export default function CrudDialog({
  open,
  onClose,
  mode,
  type,
  item,
  user,
  onSuccess,
}: CrudDialogProps) {
  const isOffer = type === "offer";
  const isEdit = mode === "edit";

  const [productId, setProductId] = useState<number | "">("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantite, setQuantite] = useState("");
  const [prixOuBudget, setPrixOuBudget] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [dateSouhaitee, setDateSouhaitee] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [prodSearch, setProdSearch] = useState("");
  const [prodFiltered, setProdFiltered] = useState<Product[]>([]);
  const [prodOpen, setProdOpen] = useState(false);
  const [loadingProds, setLoadingProds] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    fetchProducts();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (isEdit && item) {
      setProductId(item.product_id);
      setSelectedProduct(item.product ?? null);
      setProdSearch(item.product?.nom ?? "");
      setQuantite(String(item.quantite));
      setPrixOuBudget(
        isOffer ? String(item.prix_unitaire) : String(item.budget_max ?? ""),
      );
      setDateDebut(item.date_dispo_debut ?? "");
      setDateFin(item.date_dispo_fin ?? "");
      setDateSouhaitee(item.date_souhaitee ?? "");
    } else {
      resetForm();
    }
  }, [open, item, isEdit]);

  useEffect(() => {
    const q = prodSearch.toLowerCase();
    setProdFiltered(
      products
        .filter(
          (p) =>
            !q ||
            p.nom.toLowerCase().includes(q) ||
            p.categorie.toLowerCase().includes(q),
        )
        .slice(0, 8),
    );
  }, [prodSearch, products]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setProdOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchProducts = async () => {
    setLoadingProds(true);
    try {
      const res = await api.get("/products?limit=200");
      setProducts(res.data);
    } catch {
      toast.error("Impossible de charger les produits");
    } finally {
      setLoadingProds(false);
    }
  };

  const resetForm = () => {
    setProductId("");
    setSelectedProduct(null);
    setProdSearch("");
    setQuantite("");
    setPrixOuBudget("");
    setDateDebut("");
    setDateFin("");
    setDateSouhaitee("");
  };

  const selectProduct = (p: Product) => {
    setSelectedProduct(p);
    setProductId(p.id);
    setProdSearch(p.nom);
    setProdOpen(false);
  };

  const handleSubmit = async () => {
    if (!productId) return toast.error("Veuillez choisir un produit");
    if (!quantite || Number(quantite) <= 0)
      return toast.error("Quantité invalide");
    if (isOffer && (!prixOuBudget || Number(prixOuBudget) <= 0))
      return toast.error("Prix unitaire invalide");

    const region = user?.region ?? "Analamanga";
    const coords = REGION_COORDS[region] ?? { lat: -18.8792, lng: 47.5079 };

    const payload: any = {
      product_id: Number(productId),
      quantite: Number(quantite),
      latitude: coords.lat,
      longitude: coords.lng,
      region,
    };

    if (isOffer) {
      payload.prix_unitaire = Number(prixOuBudget);
      if (dateDebut) payload.date_dispo_debut = dateDebut;
      if (dateFin) payload.date_dispo_fin = dateFin;
    } else {
      if (prixOuBudget) payload.budget_max = Number(prixOuBudget);
      if (dateSouhaitee) payload.date_souhaitee = dateSouhaitee;
    }

    setSubmitting(true);
    try {
      const endpoint = isOffer ? "/offers" : "/demands";
      if (isEdit) {
        await api.put(`${endpoint}/${item.id}`, payload);
        toast.success(`${isOffer ? "Offre" : "Demande"} modifiée avec succès`);
      } else {
        await api.post(`${endpoint}/`, payload);
        toast.success(`${isOffer ? "Offre" : "Demande"} publiée avec succès`);
      }
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
              {isEdit ? (
                <Pencil className="w-4 h-4" />
              ) : (
                <PlusCircle className="w-4 h-4" />
              )}
            </div>
            {isEdit
              ? `Modifier ${isOffer ? "l'offre" : "la demande"}`
              : `${isOffer ? "Nouvelle offre" : "Nouvelle demande"}`}
          </DialogTitle>
          <DialogDescription>
            {isOffer
              ? "Renseignez les détails de votre produit à vendre"
              : "Décrivez ce que vous souhaitez acheter"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Produit */}
          <div className="space-y-1.5" ref={searchRef}>
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-muted-foreground" />
              Produit <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={prodSearch}
                onChange={(e) => {
                  setProdSearch(e.target.value);
                  setProdOpen(true);
                  if (!e.target.value) {
                    setSelectedProduct(null);
                    setProductId("");
                  }
                }}
                onFocus={() => setProdOpen(true)}
                placeholder={
                  loadingProds ? "Chargement..." : "Rechercher un produit..."
                }
                className="pl-9 pr-9"
                disabled={loadingProds}
              />
              {selectedProduct && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(null);
                    setProductId("");
                    setProdSearch("");
                    setProdOpen(true);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Dropdown */}
              {prodOpen && !loadingProds && (
                <div className="absolute z-50 top-full mt-1 w-full bg-card border rounded-lg shadow-lg overflow-hidden">
                  {prodFiltered.length === 0 ? (
                    <p className="py-3 text-center text-sm text-muted-foreground">
                      Aucun produit trouvé
                    </p>
                  ) : (
                    <ul className="max-h-44 overflow-y-auto divide-y divide-border">
                      {prodFiltered.map((p) => (
                        <li
                          key={p.id}
                          onClick={() => selectProduct(p)}
                          className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50 ${productId === p.id ? "bg-primary/5" : ""}`}
                        >
                          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Package className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {p.nom}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {p.categorie} · {p.unite}
                            </p>
                          </div>
                          {productId === p.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Badge produit sélectionné */}
            {selectedProduct && (
              <Badge variant="secondary" className="gap-1 text-xs mt-1">
                <Package className="w-3 h-3" />
                {selectedProduct.nom} · {selectedProduct.unite}
              </Badge>
            )}
          </div>

          {/* Quantité + Prix sur la même ligne */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-muted-foreground" />
                Quantité {selectedProduct && `(${selectedProduct.unite})`}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                placeholder="Ex : 500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-muted-foreground" />
                {isOffer ? "Prix / unité (Ar)" : "Budget max (Ar)"}
                {isOffer && <span className="text-destructive">*</span>}
              </Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={prixOuBudget}
                onChange={(e) => setPrixOuBudget(e.target.value)}
                placeholder={isOffer ? "Ex : 2500" : "Optionnel"}
              />
            </div>
          </div>

          {/* Dates */}
          {isOffer ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  Disponible dès
                </Label>
                <Input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  Jusqu'au
                </Label>
                <Input
                  type="date"
                  value={dateFin}
                  min={dateDebut}
                  onChange={(e) => setDateFin(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Date souhaitée
                <span className="text-xs text-muted-foreground font-normal">
                  (optionnel)
                </span>
              </Label>
              <Input
                type="date"
                value={dateSouhaitee}
                onChange={(e) => setDateSouhaitee(e.target.value)}
              />
            </div>
          )}

          {/* Région info */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 rounded-lg border">
            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Région :{" "}
              <span className="font-medium text-foreground">
                {user?.region ?? "—"}
              </span>
              <span className="mx-1">·</span>coordonnées GPS calculées
              automatiquement
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 gap-1.5"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEdit ? (
                <Pencil className="w-4 h-4" />
              ) : (
                <PlusCircle className="w-4 h-4" />
              )}
              {submitting
                ? isEdit
                  ? "Modification..."
                  : "Publication..."
                : isEdit
                  ? "Modifier"
                  : "Publier"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
