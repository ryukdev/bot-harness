// router.mjs — pick a HEALTHY account for the tier you need. Prefer a pinned human seat if set,
// else the first account with headroom. Probing is the truth (quota is not queryable).
import { load } from './accounts.mjs';
import { probeAll } from './prober.mjs';
export async function pickHealthy(tier='premium', { exclude=[], onResult=null } = {}){
  const rows = load().filter(r => !exclude.includes(r.email));
  if (!rows.length) return { email:null, results:[] };
  const results = await probeAll(rows, tier, onResult);
  const good = results.find(r => r.ok);
  return { email: good ? good.email : null, results };
}
