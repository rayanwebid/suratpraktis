# SuratPraktis

Website pembuat surat dan curriculum vitae dengan desain ungu-biru, dashboard dokumen, pendaftaran email, login Google opsional, dan backend dengan tiga role.

## Fitur

- Surat undangan, izin, pengumuman, dan keterangan; pratinjau; ekspor Word, teks, dan cetak PDF.
- CV Profesional, Minimalis, dan Kreatif; warna aksen; foto opsional; pengalaman, pendidikan, keahlian, proyek, dan sertifikasi.
- Dokumen tersimpan dalam akun dan hanya dapat diakses pemiliknya.
- **User:** mengelola dokumen sendiri.
- **Admin:** mengelola template bersama.
- **Superadmin:** mengelola akun, role, status, template, dan catatan aktivitas pengelola.
- Password hash PBKDF2, cookie sesi HttpOnly/Secure, pemeriksaan origin, pembatasan percobaan login, dan pembatalan sesi saat kredensial/role berubah.

Login Google memerlukan Client ID dan Client Secret Anda. Pengiriman email verifikasi dan reset kata sandi lewat email belum tersedia. Aplikasi tidak mengklaim verifikasi email untuk akun yang didaftarkan dengan kata sandi.

## Stack dan target hosting

- Frontend HTML/CSS/JavaScript pada `public/`.
- Backend TypeScript pada `server/backend.ts`, dirutekan melalui Vinext.
- Cloudflare Workers + Cloudflare D1, dengan Drizzle untuk migrasi schema.
- Node.js **22.13 atau lebih baru**, pnpm versi pada `packageManager` di `package.json`.

Target deploy yang disiapkan adalah **Cloudflare Workers**, bukan GitHub Pages. GitHub Pages hanya menampung file statis sehingga tidak dapat menjalankan backend ini. Repositori memuat semua source, dependensi yang diperlukan melalui lockfile, dan konfigurasi CI/deploy. `node_modules`, data pengguna, kata sandi, OAuth secrets, serta output build tidak dimasukkan.

## Instalasi dan pemeriksaan

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

`pnpm dev` membuka development server. Database development terpisah dari produksi. Setelah build, terapkan migrasi lokal bila ingin menguji API dengan D1 lokal:

```bash
pnpm exec wrangler d1 migrations apply DB --local --config dist/server/wrangler.json
```

Jangan memakai database produksi untuk data uji. Uji otomatis memakai SQLite in-memory dan simulasi Google; bukan akses ke akun Google asli.

## Deploy manual ke Cloudflare

1. Masuk dan buat database:

```bash
pnpm exec wrangler login
pnpm exec wrangler d1 create suratpraktis-db
```

2. Simpan ID database dari hasil perintah. Atur environment terminal dengan nilai Anda, misalnya pada Linux/macOS:

```bash
export CLOUDFLARE_D1_DATABASE_ID="ID_DATABASE_ANDA"
export SITE_URL="https://suratpraktis.SUBDOMAIN_ANDA.workers.dev"
export OWNER_EMAIL="EMAIL_PEMILIK_ANDA"
export WORKER_NAME="suratpraktis"
export D1_DATABASE_NAME="suratpraktis-db"
```

Pada PowerShell, gunakan `$env:NAMA_VARIABEL = "nilai"`. `SITE_URL` harus sama dengan origin publik yang akan dipakai, tanpa slash penutup. Gunakan domain sendiri jika sudah dikonfigurasi pada Worker.

3. Siapkan konfigurasi, terapkan migrasi, lalu deploy:

```bash
pnpm build
pnpm deploy:prepare
pnpm db:migrate:remote
pnpm deploy:cloudflare
```

`deploy:prepare` menghasilkan `dist/server/wrangler.deploy.json` dengan ID D1 Anda, path asset/migrasi yang sesuai, dan identitas Sites dinonaktifkan. Jangan deploy memakai `dist/server/wrangler.json` secara langsung: konfigurasi build itu masih berisi ID database placeholder.

4. Buat akun superadmin:

```bash
pnpm admin:create
```

Perintah meminta nama, email, dan kata sandi melalui terminal; kata sandi tidak ditampilkan. Gunakan email `OWNER_EMAIL`. Script hanya menambahkan akun baru, tidak mempromosikan akun yang sudah ada. Masuk pada `/auth` menggunakan email dan kata sandi tersebut. Akun yang mendaftar melalui website selalu memperoleh role `user`.

`pnpm admin:create -- --local` tersedia untuk database lokal setelah menyiapkan konfigurasi deployment. Database lokal tidak sama dengan database remote.

## Login Google

Buat OAuth client **Web application** di Google Cloud. Daftarkan authorized redirect URI:

```text
https://DOMAIN_ANDA/api/auth/google/callback
```

Setelah deploy pertama, masukkan kredensial ke secret Worker melalui prompt Wrangler:

```bash
pnpm exec wrangler secret put GOOGLE_CLIENT_ID --config dist/server/wrangler.deploy.json
pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET --config dist/server/wrangler.deploy.json
```

Google consent screen harus dikonfigurasi untuk pengguna yang diperbolehkan. Scope yang digunakan hanya `openid email profile`. Kode memakai authorization code, PKCE, state sekali pakai, serta pengambilan profil di server. Akun email yang sudah ada harus masuk dengan password lalu menautkan Google dari menu Akun; akun tidak digabung otomatis hanya karena email cocok.

Jangan menaruh Client Secret atau Cloudflare API token dalam source, issue, atau file `.env` yang masuk Git.

## GitHub Actions

`Check source` menjalankan typecheck, pengujian backend, dan build pada push ke `main` serta pull request.

`Deploy to Cloudflare` dijalankan **manual** melalui tab Actions → Run workflow. Push source tidak otomatis mempublikasikan aplikasi.

Konfigurasikan GitHub Environment bernama `production`:

| Jenis | Nama | Isi |
|---|---|---|
| Secret | `CLOUDFLARE_API_TOKEN` | Token dengan akses edit Workers Scripts dan D1 pada akun yang dipilih |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | Account ID Cloudflare |
| Variable | `CLOUDFLARE_D1_DATABASE_ID` | ID database D1 yang sudah dibuat |
| Variable | `SITE_URL` | Origin HTTPS website |
| Variable | `OWNER_EMAIL` | Email pemilik |
| Variable | `WORKER_NAME` | Opsional; default `suratpraktis` |
| Variable | `D1_DATABASE_NAME` | Opsional; default `suratpraktis-db` |

Login Google menggunakan secrets Worker yang dimasukkan melalui Cloudflare/Wrangler, bukan nilai yang disimpan dalam repositori. Bila ingin deployment tetap privat, pasang Cloudflare Access pada domain Anda sebelum memberikan akses kepada pengguna. Hosting mandiri tidak otomatis mewarisi pembatasan owner-private dari Sites.

## Penggunaan kembali pada Sites

`.openai/hosting.json` mempertahankan identitas Site asli. Konfigurasi itu tidak digunakan sebagai kredensial GitHub atau Cloudflare. Hosting Sites asli tidak berubah oleh export source ini.

Hanya pada Sites, pengelola dapat mengatur `SITES_HOSTED_AUTH=1` untuk mengaktifkan tombol login pemilik berbasis identitas ChatGPT yang disediakan platform. **Jangan aktifkan pada Worker standalone:** header identitas dari browser tidak boleh dipercaya. Pada standalone gunakan superadmin yang dibuat lewat terminal.

## Struktur

| Lokasi | Fungsi |
|---|---|
| `app/` | Router backend dan helper identitas Sites |
| `server/backend.ts` | Autentikasi, role, dokumen, template, audit |
| `public/` | Halaman dan editor surat/CV serta ekspor DOCX |
| `db/schema.ts` | Schema database |
| `drizzle/` | Migrasi SQL dan metadata |
| `scripts/` | Build, konfigurasi deploy, bootstrap superadmin |
| `tests/` | Pengujian backend |
| `.github/workflows/` | CI dan deploy manual |

Tampilan responsif dan cetak PDF masih perlu pemeriksaan langsung di browser. Google sign-in perlu pengujian end-to-end setelah OAuth Anda dipasang.
