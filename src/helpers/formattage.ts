export const formatMadagascarPhone = (value: string) => {
  // On ne garde que les chiffres
  const digits = value.replace(/\D/g, "");

  // On limite à 10 chiffres (format standard Malagasy)
  const limited = digits.substring(0, 10);

  // On applique le format : 034 49 018 94
  const parts = [];
  if (limited.length > 0) parts.push(limited.substring(0, 3));
  if (limited.length > 3) parts.push(limited.substring(3, 5));
  if (limited.length > 5) parts.push(limited.substring(5, 8));
  if (limited.length > 8) parts.push(limited.substring(8, 10));

  return parts.join(" ");
};  
