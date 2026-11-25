const dailyBase = {
  tr: 'https://wol.jw.org/tr/wol/dt/r22/lp-tk/',
  en: 'https://wol.jw.org/en/wol/dt/r1/lp-e/'
};

function dailyDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && date.getUTCFullYear() >= 2024;
}

function dailyReference(html, sourceUrl) {
  const theme = html.match(/<p\b[^>]*class="[^"]*\bthemeScrp\b[^"]*"[^>]*>([\s\S]*?)<\/p>/i)?.[1];
  const href = theme?.match(/<a\b[^>]*href="([^"]+)"/i)?.[1]?.replace(/&amp;/g, '&');
  if (!href) throw new Error('Daily scripture not found');
  const citation = new URL(href, sourceUrl);
  if (citation.hostname !== 'wol.jw.org' || !citation.pathname.includes('/wol/bc/')) throw new Error('Invalid daily citation');
  return citation;
}

async function fetchDaily(lang, date) {
  const sourceUrl = dailyBase[lang] + date.replace(/-/g, '/');
  const response = await fetch(sourceUrl, {headers: {'User-Agent': 'GatherDailyReading/1.0', Accept: 'text/html'}, signal: AbortSignal.timeout(15000)});
  if (!response.ok) throw new Error('Daily upstream ' + response.status);
  const citation = dailyReference(await response.text(), sourceUrl);
  const redirect = await fetch(citation, {redirect: 'manual', signal: AbortSignal.timeout(15000)});
  const location = redirect.headers.get('location');
  if (!location || ![301,302,303,307,308].includes(redirect.status)) throw new Error('Daily reference redirect missing');
  const target = new URL(location, citation);
  const match = target.hash.match(/^#v=(\d{1,2}):(\d{1,3}):(\d{1,3})(?:-\d+)?$/);
  if (target.hostname !== 'wol.jw.org' || !match) throw new Error('Invalid daily verse target');
  const [book, chapter, verse] = match.slice(1).map(Number);
  if (book < 1 || book > 66 || chapter < 1 || chapter > 150 || verse < 1 || verse > 176) throw new Error('Invalid daily verse');
  return {date, lang, book, chapter, verse, sourceUrl, source: 'Watchtower ONLINE LIBRARY'};
}

exports.dailyReference = dailyReference;
exports.dailyDate = dailyDate;


exports.fetchDaily=fetchDaily;
