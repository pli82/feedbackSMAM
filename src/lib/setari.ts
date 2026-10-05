// Linkul către prezentarea video (YouTube), afișat deasupra întrebărilor.
export const CHEIE_LINK_PREZENTARE = "link_prezentare";

const HOSTURI_YOUTUBE = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"];

// Acceptă doar linkuri YouTube (https). Fără protocol, se adaugă automat https://.
export function valideazaLinkYoutube(brut: unknown): { ok: true; link: string } | { ok: false; eroare: string } {
  if (typeof brut !== "string") return { ok: false, eroare: "Linkul este invalid." };
  let text = brut.trim();
  if (!text) return { ok: false, eroare: "Introduceți un link." };
  if (text.length > 500) return { ok: false, eroare: "Linkul este prea lung." };
  if (!/^https?:\/\//i.test(text)) text = `https://${text}`;

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { ok: false, eroare: "Linkul nu este valid." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, eroare: "Linkul trebuie să înceapă cu https://." };
  }
  if (!HOSTURI_YOUTUBE.includes(url.hostname.toLowerCase())) {
    return { ok: false, eroare: "Acceptăm doar linkuri YouTube (youtube.com sau youtu.be)." };
  }
  url.protocol = "https:";
  return { ok: true, link: url.toString() };
}
