import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const input='dist/server/wrangler.json',output='dist/server/wrangler.deploy.json';
if(!existsSync(input))throw new Error('Jalankan pnpm build terlebih dahulu.');
const siteURL=process.env.SITE_URL,dbID=process.env.CLOUDFLARE_D1_DATABASE_ID,worker=process.env.WORKER_NAME||'suratpraktis';
if(!siteURL||new URL(siteURL).protocol!=='https:'||new URL(siteURL).origin!==siteURL)throw new Error('SITE_URL harus berupa origin HTTPS tanpa path atau slash penutup.');
if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dbID||'')||dbID==='00000000-0000-4000-8000-000000000000')throw new Error('Isi CLOUDFLARE_D1_DATABASE_ID dengan ID database D1 Anda.');
if(!/^[a-z][a-z0-9-]{0,62}$/.test(worker))throw new Error('WORKER_NAME tidak valid.');
const generated=JSON.parse(readFileSync(input,'utf8'));
const config={name:worker,main:generated.main,compatibility_date:generated.compatibility_date,compatibility_flags:generated.compatibility_flags,no_bundle:true,assets:{...generated.assets},d1_databases:[{binding:'DB',database_name:process.env.D1_DATABASE_NAME||'suratpraktis-db',database_id:dbID,migrations_dir:'../../drizzle'}],vars:{SITE_URL:siteURL,SITES_HOSTED_AUTH:'0'},observability:{enabled:true}};
// Hosting identity headers must never be trusted on a standalone Worker.
if(process.env.OWNER_EMAIL)config.vars.OWNER_EMAIL=process.env.OWNER_EMAIL.trim().toLowerCase();
writeFileSync(output,JSON.stringify(config,null,2)+'\n');
console.log('Konfigurasi deployment siap: '+output);
