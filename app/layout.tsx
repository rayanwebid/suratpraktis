import type { Metadata } from 'next';
export const metadata:Metadata={title:'SuratPraktis — Surat & CV',description:'Buat surat dan CV, simpan dokumen dalam akun, dan pilih desain yang sesuai.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>;}
