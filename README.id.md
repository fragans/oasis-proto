# Oasis Dashboard

Oasis Dashboard adalah platform berbasis Nuxt 4 untuk mengelola kampanye pemasaran, aset kreatif, audiens, dan alur kerja (workflow). Platform ini dilengkapi dengan arsitektur multi-organisasi dan sinkronisasi edge menggunakan Cloudflare KV untuk mengirimkan logika kampanye secara global pada edge.

<!-- i18n-selector:start -->
[English](./README.md) | **Bahasa Indonesia**
<!-- i18n-selector:end -->

## Deployment

- **Staging**: [https://staging-oasis.kgmedia.id/](https://staging-oasis.kgmedia.id/)
- **Production**: [https://oasis.kgmedia.id/](https://oasis.kgmedia.id/)

## Fitur Utama

- **Arsitektur Multi-Organisasi**: Dukungan multi-tenancy yang andal untuk mengelola beragam organisasi dan kampanye dalam satu penerapan (deployment).
- **Mode Super Admin**: Kemampuan super admin bawaan untuk inisialisasi dan pengawasan lintas organisasi.
- **Sinkronisasi Edge**: Terintegrasi langsung dengan Cloudflare KV untuk mendorong kampanye terjadwal dan pembaruan state ke edge (`oasis-edge`).
- **Pembangun Alur Kerja Visual**: Pemetaan perjalanan (journey) interaktif dan pembuatan logika yang didukung oleh Vue Flow.
- **Penyimpanan Objek**: Dukungan penyimpanan cloud yang kompatibel dengan S3 untuk aset kreatif.

## Teknologi yang Digunakan

- **Framework**: [Nuxt 4](https://nuxt.com/) & [Vue 3](https://vuejs.org/)
- **Komponen UI**: [@nuxt/ui](https://ui.nuxt.com/) (Tailwind CSS)
- **Database**: PostgreSQL dengan [Drizzle ORM](https://orm.drizzle.team/)
- **Penyimpanan Edge**: [Cloudflare KV](https://developers.cloudflare.com/kv/)
- **Penyimpanan Aset**: S3 Compatible Storage (AWS / OBS)

## Memulai

### Prasyarat

- Node.js 22+
- Database PostgreSQL
- Akun Cloudflare (untuk sinkronisasi edge KV)
- Bucket penyimpanan yang kompatibel dengan S3

### Instalasi

1. Instal dependensi:

```bash
npm install
```

2. Salin `.env.example` ke `.env` dan isi variabel Anda:

```bash
cp .env.example .env
```

3. Jalankan migrasi database:

```bash
npx drizzle-kit push
```

4. Jalankan server pengembangan (development):

```bash
npm run dev
```

## Variabel Lingkungan

Variabel konfigurasi utama yang dibutuhkan pada file `.env` Anda:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/oasis
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_KV_NAMESPACE_ID=
ENABLE_SUPER_ADMIN=true
SUPER_ADMIN_TOKEN=oasis-dev-admin
S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=
```

## Lisensi

Lihat file [LICENSE](./LICENSE) untuk informasi lebih lanjut.
