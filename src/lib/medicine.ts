export function displayField(value?: string): string {
  const trimmed = (value || "").trim();
  if (trimmed === "" || trimmed === "-" || trimmed === "nao encontrado") return "";
  return trimmed;
}
