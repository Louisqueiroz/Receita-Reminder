export function drogasilSearchUrl(name: string): string {
  const query = name.trim();
  if (!query) return "https://www.drogasil.com.br";
  return `https://www.drogasil.com.br/search?w=${encodeURIComponent(query)}`;
}
