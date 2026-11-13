# MK Vault — Royal Ledger Archive

<p align="center">
  <img src="public/assets/mk-vault-seal.svg" alt="MK Vault Seal" width="120" />
</p>

<p align="center">
  <strong>A private ledger for public work.</strong>
</p>

<p align="center">
  <a href="https://vercel.com"><img src="https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" /></a>
  <a href="https://vite.dev"><img src="https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind-4.1-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind 4" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Design-Royal_Ledger-C9A24B?style=for-the-badge" alt="Royal Ledger" /></a>
</p>

---

MK Vault is an editorial link archive for websites, software tools, games, portfolios, and 3D WebGL experiences that are live online. It preserves notable work in a curated ceremonial ledger, with an authenticated owner workspace for curation and a public collection for visitor browsing.

- **Public Collection:** [https://mk-vault.vercel.app](https://mk-vault.vercel.app)
- **Administrator Studio:** [https://mk-vault.vercel.app/admin](https://mk-vault.vercel.app/admin)

---

## 🏛️ Key Capabilities

| Capability | What it does |
| --- | --- |
| **Public Collection** | Present selected projects in a responsive Royal Ledger interface without requiring visitors to sign in. |
| **Live Web Previews** | Automatically generates responsive edge screenshots and high-resolution favicons for all destination URLs. |
| **Curated Ranks** | Reserve positions `01`–`03` for featured spotlight works. |
| **Interactive Actions** | Open destination, copy link to clipboard, and trigger native mobile/desktop share sheets. |
| **Search & Filtering** | Instant real-time search across titles, URLs, and notes, with category filter pills (`Game`, `Tool`, `App`, `Portfolio`, `Other`). |
| **Admin Workspace** | Dedicated owner login (`/admin`) to add, edit, reorder, feature, and archive links with persistent client storage. |
| **Data Continuity** | 1-click JSON backup export and restore without vendor lock-in or database maintenance fees. |

---

## 🌟 Curated Initial Records

| Rank | Project | Category | Note |
| :--- | :--- | :--- | :--- |
| **01** | [Read Me by Jack](https://read-me-by-jack.vercel.app) | `Portfolio` | Studio-grade 3D WebGL editorial experience celebrating the release of Read Me by Jack. |
| **02** | [MK Pro Portfolio](https://github.com/LanKuzuMK/mk-pro-portfolio) | `Portfolio` | Bilingual cinematic portfolio for MK — Developer & Creative Technologist. |
| **03** | [Skybound Knight](https://github.com/LanKuzuMK/skybound-knight-play) | `Game` | Responsive endless fantasy platformer with physics collision and Android APK support. |
| — | [StudentOS Platform](https://github.com/LanKuzuMK/student-os) | `App` | Full-featured Java platform for student workflows, goals, freelance tracking, and peer messaging. |
| — | [E-Commerce Dashboard](https://github.com/LanKuzuMK/e-commerce-inventory-dashboard) | `Tool` | Real-time inventory tracking, low-stock alerts, category grouping, and sales analytics. |

---

## 🎨 Design Language: Royal Ledger

MK Vault features a bespoke **Royal Ledger** aesthetic:
- **Base Canvas:** Deep archival ink (`#0b0a10` and `#16141c`)
- **Accents:** Restrained burnished brass (`#c9a24b` and `#dfc37b`)
- **Typography:** Classical architectural headers in *Cinzel*, paired with modern editorial prose in *Manrope* and ledger metadata in *JetBrains Mono*.
- **Ceremonial Seal:** Embedded vector monogram insignia rendered across every card thumbnail.

---

## 🚀 Quickstart & Local Development

### 1. Clone & Install
```bash
git clone https://github.com/LanKuzuMK/mk-vault.git
cd mk-vault
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) to browse the collection.

### 3. Production Build
```bash
npm run build
```
Generates production-optimized static bundles into `dist/`.

---

## 🌐 Deploy to Vercel

### Option 1: Vercel Web Dashboard (Instant)
1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and click **Import** next to `LanKuzuMK/mk-vault`.
3. Vercel automatically detects the **Vite** preset and `dist` output.
4. Click **Deploy**. Your vault is live in ~20 seconds at `https://mk-vault.vercel.app`.

### Option 2: Vercel CLI
```bash
npx vercel
```

---

## 📜 License

Released under the [MIT License](LICENSE). Curated and maintained by **MK**.
