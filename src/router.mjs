import { load } from './accounts.mjs';
import { probeAll } from './prober.mjs';
export async function pickHealthy(model = null, { exclude=[], onResult=null } = {}){
  const rows = load().filter(r => !exclude.includes(r.email));
  if (!rows.length) return { email:null, results:[] };
  const results = await probeAll(rows, model, onResult);
  const good = results.find(r => r.ok);
  return { email: good ? good.email : null, results };
}
