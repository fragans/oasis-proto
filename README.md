# Oasis Dashboard

Oasis Dashboard is a Nuxt 4-based platform for managing marketing campaigns, creatives, audiences, and workflows. It features a multi-organization architecture and edge synchronization with Cloudflare KV to deliver campaign logic globally at the edge.

<!-- i18n-selector:start -->
**English** | [Bahasa Indonesia](./README.id.md)
<!-- i18n-selector:end -->

## Deployment

- **Staging**: [https://staging-oasis.kgmedia.id/](https://staging-oasis.kgmedia.id/)
- **Production**: [https://oasis.kgmedia.id/](https://oasis.kgmedia.id/)

## Features

- **Multi-Organization Architecture**: Robust multi-tenancy support for managing diverse organizations and campaigns within a single deployment.
- **Super Admin Mode**: Built-in super admin capabilities for cross-organization initialization and oversight.
- **Edge Synchronization**: Integrates directly with Cloudflare KV to push scheduled campaigns and state updates to the edge (`oasis-edge`).
- **Visual Workflow Builder**: Interactive journey mapping and logic building powered by Vue Flow.
- **Object Storage**: S3-compatible cloud storage support for creatives and assets.

## Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com/) & [Vue 3](https://vuejs.org/)
- **UI Components**: [@nuxt/ui](https://ui.nuxt.com/) (Tailwind CSS)
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Edge Storage**: [Cloudflare KV](https://developers.cloudflare.com/kv/)
- **Asset Storage**: S3 Compatible Storage (AWS / OBS)

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL database
- Cloudflare account (for KV edge sync)
- S3-compatible storage bucket

### Installation

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your variables:

```bash
cp .env.example .env
```

3. Run database migrations:

```bash
npx drizzle-kit push
```

4. Start the development server:

```bash
npm run dev
```

## Environment Variables

Key configuration variables needed in your `.env` file:

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

## License

Refer to the [LICENSE](./LICENSE) file for more information.
