import {createInterface} from 'node:readline/promises';
import {readFileSync,writeFileSync,mkdirSync,unlinkSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomUUID,randomBytes,pbkdf2Sync} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const config='dist/server/wrangler.deploy.json';
JSON.parse(readFileSync(config,'utf8'));
if(!process.stdin.isTTY)throw new Error('Jalankan dari terminal interaktif agar kata sandi tidak tampil.');
const rl=createInterface({input:process.stdin,output:process.stdout});
const email=(await rl.question('Email superadmin: ')).trim().toLowerCase();
const name=(await rl.question('Nama superadmin: ')).trim();
rl.close();
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!name||name.length>100)throw new Error('Nama atau email tidak valid.');
async function hidden(prompt){process.stdout.write(prompt);process.stdin.setRawMode(true);process.stdin.resume();let value='';return new Promise(resolve=>{function onData(chunk){for(const char of chunk.toString()){if(char==='\u0003'){process.stdin.setRawMode(false);process.exit(130);}if(char==='\r'||char==='\n'){process.stdin.removeListener('data',onData);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');resolve(value);return;}if(char==='\u007f'||char==='\b')value=value.slice(0,-1);else if(char>=' ')value+=char;}}process.stdin.on('data',onData);});}
const password=await hidden('Kata sandi (tidak ditampilkan): '),again=await hidden('Ulangi kata sandi: ');
if(password.length<10||password.length>128||password!==again)throw new Error('Kata sandi harus cocok dan memiliki 10–128 karakter.');
const salt=randomBytes(32).toString('hex'),hash='pbkdf2$100000$'+salt+'$'+pbkdf2Sync(password,salt,100000,32,'sha256').toString('hex');
const quote=s=>"'"+s.replaceAll("'","''")+"'";
// Insert-only. A pre-existing email causes a constraint error; it is never promoted implicitly.
const sql=`INSERT INTO users (id,email,name,password_hash,role,active,email_verified,created) VALUES (${quote(randomUUID())},${quote(email)},${quote(name)},${quote(hash)},'superadmin',1,0,${Math.floor(Date.now()/1000)});`;
mkdirSync('.sites-runtime',{recursive:true});const file='.sites-runtime/bootstrap-'+randomUUID()+'.sql';writeFileSync(file,sql,{mode:0o600});
try{const cli=fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js',import.meta.url));const result=spawnSync(process.execPath,[cli,'d1','execute','DB',process.argv.includes('--local')?'--local':'--remote','--config',config,'--file',file],{stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)throw new Error('Pembuatan superadmin gagal. Periksa konfigurasi database dan apakah email sudah digunakan.');console.log('Superadmin dibuat. Masuk menggunakan email dan kata sandi pada /auth.');}finally{unlinkSync(file);}
