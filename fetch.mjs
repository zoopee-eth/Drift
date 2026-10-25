// Runs on GitHub every ~10 minutes: reads the coin's numbers from Pangea and saves
// data/latest.json (now) and data/history.json (supply over time) for the page.
import fs from 'node:fs';
const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const slug = (process.env.SLUG || cfg.slug || '').trim();
if (!slug) { console.log('config.json has no slug yet: nothing to fetch'); process.exit(0); }
const H = { 'user-agent': 'Mozilla/5.0 (drift-stats; +https://github.com)', accept: 'application/json' };
const get = async u => { const r = await fetch(u, { headers: H }); if (!r.ok) throw new Error(`${u} -> HTTP ${r.status}`); return r.json(); };

const pools = await get('https://www.pangea.trade/api/pools');
const L = pools.launches.find(l => l.slug === slug);
if (!L) throw new Error(`launch "${slug}" not found on Pangea`);
let hist = null;
try { hist = await get(`https://www.pangea.trade/api/history?hours=24&launch=${encodeURIComponent(slug)}`); } catch (e) { console.log('history:', e.message); }

const CH = ['solana', 'bsc', 'base', 'robinhood', 'ethereum'];
const total = Number(L.launchTotal) || 5e9;
const perChainSlice = L.degen ? total / (L.launchChains || CH).length : 1e9;
const price = (L.cheapest && L.cheapest.usd) || (L.pools || []).map(p => p.priceUsd).find(Boolean) || 0;
const chains = CH.filter(c => (L.launchChains || CH).includes(c)).map(c => {
  const p = (L.pools || []).find(x => x.chain === c) || {};
  const burned = Number((L.burntPerChain || {})[c] || 0);
  return { chain: c, burned, slice: perChainSlice, priceUsd: p.priceUsd || 0, liquidityUsd: (p.reservesUsd || 0) + (p.tokenReservesUsd || 0),
    volume24hUsd: hist && hist.totals && hist.totals.byChain ? Math.round(hist.totals.byChain[c] || 0) : null };
});
const burned = Number(L.burnt || 0);
const latest = {
  at: new Date().toISOString(), slug, name: L.name, ticker: L.symbol, degen: !!L.degen,
  totalSupply: total, burned, burnedPct: burned / total * 100, supplyNow: total - burned,
  priceUsd: price, marketCapUsd: Math.round(price * (total - burned)),
  volume24hUsd: hist && hist.totals ? Math.round(hist.totals.volumeUsd || 0) : null,
  trades24h: hist && hist.totals ? hist.totals.trades || null : null,
  listedAt: L.listedAt ? new Date(L.listedAt * 1000).toISOString() : null,
  chains,
};
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/latest.json', JSON.stringify(latest, null, 1));
let series = []; try { series = JSON.parse(fs.readFileSync('data/history.json', 'utf8')); } catch {}
series.push({ t: latest.at, burned, mc: latest.marketCapUsd, byChain: Object.fromEntries(chains.map(c => [c.chain, Math.round(c.burned)])) });
fs.writeFileSync('data/history.json', JSON.stringify(series.slice(-3000)));
console.log(`${L.symbol}: burned ${Math.round(burned).toLocaleString()} (${latest.burnedPct.toFixed(3)}%) · mc $${latest.marketCapUsd.toLocaleString()}`);
