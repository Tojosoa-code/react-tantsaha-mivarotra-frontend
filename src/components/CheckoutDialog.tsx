import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/axios";
import {
  Package,
  MapPin,
  Phone,
  Banknote,
  Scale,
  ShoppingCart,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronRight,
  AlertCircle,
  User,
} from "lucide-react";

interface CheckoutProps {
  open: boolean;
  onClose: () => void;
  offer: {
    id: number;
    product_name: string;
    product_unite: string;
    quantite: number;
    quantite_restante?: number;
    quantite_min_commande?: number;
    prix_unitaire: number;
    producteur_nom: string;
    producteur_telephone?: string;
    producteur_region: string;
  };
  onSuccess: () => void;
}

type Step = "quantite" | "recap" | "confirme";

export default function CheckoutDialog({
  open,
  onClose,
  offer,
  onSuccess,
}: CheckoutProps) {
  const [step, setStep] = useState<Step>("quantite");
  const [quantite, setQuantite] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState<number | null>(null);

  const qte = parseFloat(quantite) || 0;
  const prixTotal = qte * offer.prix_unitaire;
  const stockDispo = offer.quantite_restante ?? offer.quantite;
  const qteMin = offer.quantite_min_commande ?? 0;

  const handleClose = () => {
    setStep("quantite");
    setQuantite("");
    setTransactionId(null);
    onClose();
  };

  const handleNext = () => {
    if (qte <= 0) {
      toast.error("Veuillez entrer une quantité valide");
      return;
    }
    if (qte > stockDispo) {
      toast.error(`Stock disponible : ${stockDispo} ${offer.product_unite}`);
      return;
    }
    if (qteMin > 0 && qte < qteMin) {
      toast.error(`Commande minimum : ${qteMin} ${offer.product_unite}`);
      return;
    }
    setStep("recap");
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await api.post("/transactions/", {
        offer_id: offer.id,
        quantite: qte,
      });
      setTransactionId(res.data.id);
      setStep("confirme");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erreur lors de la commande");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="w-[80vw] max-w-[80vw] max-h-[90vh] overflow-y-auto">
        {/* ── Étape 1 : Quantité ── */}
        {step === "quantite" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                Commander ce produit
              </DialogTitle>
              <DialogDescription>
                Choisissez la quantité que vous souhaitez acheter
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Produit */}
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{offer.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Proposé par {offer.producteur_nom} ·{" "}
                    {offer.producteur_region}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-green-600">
                    {offer.prix_unitaire.toLocaleString()} Ar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    par {offer.product_unite}
                  </p>
                </div>
              </div>

              {/* Stock disponible */}
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <Scale className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">
                    {stockDispo} {offer.product_unite}
                  </span>{" "}
                  disponibles en ce moment
                </p>
              </div>

              {/* Quantité minimum */}
              {qteMin > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <Scale className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    Commande minimum :{" "}
                    <span className="font-semibold">
                      {qteMin} {offer.product_unite}
                    </span>
                  </p>
                </div>
              )}

              {/* Input quantité */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-muted-foreground" />
                  Quantité souhaitée ({offer.product_unite})
                </label>
                <Input
                  type="number"
                  min={qteMin > 0 ? qteMin : 0.01}
                  max={stockDispo}
                  step="0.01"
                  value={quantite}
                  onChange={(e) => setQuantite(e.target.value)}
                  placeholder={
                    qteMin > 0
                      ? `Min. ${qteMin} ${offer.product_unite}`
                      : `Ex : ${Math.min(100, stockDispo)}`
                  }
                  className="text-base"
                  autoFocus
                />
              </div>

              {/* Aperçu prix total */}
              {qte > 0 &&
                qte <= stockDispo &&
                (qteMin === 0 || qte >= qteMin) && (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                    <span className="text-sm text-green-700">
                      Montant estimé
                    </span>
                    <span className="text-lg font-bold text-green-700">
                      {prixTotal.toLocaleString()} Ar
                    </span>
                  </div>
                )}

              {/* Erreur stock dépassé */}
              {qte > stockDispo && qte > 0 && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-xs text-red-700">
                    Quantité supérieure au stock disponible ({stockDispo}{" "}
                    {offer.product_unite})
                  </p>
                </div>
              )}

              {/* Erreur quantité min */}
              {qte > 0 && qte <= stockDispo && qteMin > 0 && qte < qteMin && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    Quantité inférieure au minimum requis ({qteMin}{" "}
                    {offer.product_unite})
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1 gap-1.5"
                  onClick={handleNext}
                  disabled={
                    qte <= 0 || qte > stockDispo || (qteMin > 0 && qte < qteMin)
                  }
                >
                  Continuer
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── Étape 2 : Récapitulatif ── */}
        {step === "recap" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                Récapitulatif de votre commande
              </DialogTitle>
              <DialogDescription>
                Vérifiez les détails avant de confirmer
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="rounded-xl border overflow-hidden">
                <div className="bg-muted/30 px-4 py-2.5 border-b">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Détails de la commande
                  </p>
                </div>
                <div className="divide-y">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="w-3.5 h-3.5" />
                      Produit
                    </div>
                    <p className="text-sm font-semibold">
                      {offer.product_name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Scale className="w-3.5 h-3.5" />
                      Quantité
                    </div>
                    <p className="text-sm font-semibold">
                      {qte} {offer.product_unite}
                    </p>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Banknote className="w-3.5 h-3.5" />
                      Prix unitaire
                    </div>
                    <p className="text-sm font-semibold">
                      {offer.prix_unitaire.toLocaleString()} Ar/
                      {offer.product_unite}
                    </p>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-green-50">
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                      <Banknote className="w-3.5 h-3.5" />
                      Total estimé
                    </div>
                    <p className="text-lg font-bold text-green-700">
                      {prixTotal.toLocaleString()} Ar
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border overflow-hidden">
                <div className="bg-muted/30 px-4 py-2.5 border-b">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Votre producteur
                  </p>
                </div>
                <div className="divide-y">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-3.5 h-3.5" />
                      Nom
                    </div>
                    <p className="text-sm font-semibold">
                      {offer.producteur_nom}
                    </p>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      Région
                    </div>
                    <p className="text-sm font-semibold">
                      {offer.producteur_region}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Le producteur a{" "}
                  <span className="font-semibold">24 heures</span> pour
                  confirmer votre commande. Vous serez notifié dès sa réponse.
                  En cas de non-réponse, votre commande sera automatiquement
                  annulée.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("quantite")}
                >
                  ← Modifier
                </Button>
                <Button
                  className="flex-1 gap-1.5"
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                  {loading ? "Envoi en cours..." : "Confirmer ma commande"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── Étape 3 : Confirmé ── */}
        {step === "confirme" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">
                Commande envoyée !
              </DialogTitle>
              <DialogDescription>
                Votre commande est en attente de confirmation
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="flex flex-col items-center py-6 gap-4 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-lg">
                    Commande #{transactionId} envoyée
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    {offer.producteur_nom} a reçu votre commande et dispose de
                    24 heures pour la confirmer. Vous serez notifié dès sa
                    réponse.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Récapitulatif
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Produit</span>
                  <span className="font-medium">{offer.product_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantité</span>
                  <span className="font-medium">
                    {qte} {offer.product_unite}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2 mt-2">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-green-600">
                    {prixTotal.toLocaleString()} Ar
                  </span>
                </div>
              </div>

              {offer.producteur_telephone && (
                <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl border border-dashed">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    Contact producteur :{" "}
                    <span className="font-semibold text-primary">
                      {offer.producteur_telephone}
                    </span>
                  </p>
                </div>
              )}

              <Button className="w-full gap-2" onClick={handleClose}>
                <CheckCircle2 className="w-4 h-4" />
                Parfait, suivre ma commande
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
