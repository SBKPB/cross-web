# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev          # Start dev server at http://localhost:3000

# Build & Production
pnpm build        # Create production build
pnpm start        # Start production server

# Linting
pnpm lint         # Run ESLint
```

## Architecture

This is a **Next.js 16** web application for a Taiwan medical clinic management system (醫療院所管理系統). The UI is in Traditional Chinese.

### Tech Stack
- **Next.js 16** with App Router (`src/app/`)
- **React 19** with TypeScript (strict mode)
- **Tailwind CSS 4** for styling
- **Radix UI** primitives for accessible components
- **pnpm** as package manager

### Project Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx            # Root layout with Inter + Noto Sans TC
│   ├── page.tsx              # Home page（民眾端，RSC）
│   ├── search/               # 診所搜尋結果頁
│   ├── clinic/[clinic-id]/   # 診所詳細頁
│   ├── booking/              # 預約流程
│   ├── member/               # 民眾會員
│   ├── admin/                # 後台管理
│   ├── bind/                 # LINE / Google 帳號綁定
│   ├── privacy/ + terms/     # 法律頁
│   └── api/[...path]/        # 後端代理路由
├── components/
│   ├── ui/                   # shadcn/ui 基礎元件
│   ├── home/                 # 首頁區塊元件
│   └── clinics/              # 診所相關元件（卡片、列表、工具列）
├── lib/
│   ├── utils.ts              # cn() 工具
│   ├── api/                  # 後端 API client
│   └── constants/            # 領域常數（醫療分級、科別、縣市、服務類型…）
└── types/                    # TypeScript 型別定義
```

### Import Alias
Use `@/*` to import from `src/*` (configured in tsconfig.json).

### Domain Model
The app manages medical facilities with these core types defined in `src/types/clinic.ts`:
- **Clinic**: Main entity with hospital_level, facility_type, departments, members…
- **HospitalLevel**: medical_center | regional_hospital | district_hospital | clinic
- **FacilityType**: healthcare（健保看診）| self_pay（自費門診）| aesthetic（醫美諮詢）—— 民眾端三分流，會反映在 Hero tabs 與卡片 badge
- **MedicalDepartment**: 18 Taiwan medical specialties (internal_medicine, surgery, pediatrics, etc.)

### UI Component Pattern
Components in `src/components/ui/` follow the shadcn/ui pattern using `class-variance-authority` (cva) for variant styling. The `cn()` utility merges Tailwind classes.

**優先使用 Luma shadcn/ui**：所有新增畫面與既有畫面的視覺更新都應**優先**從 Luma shadcn/ui 的 registry 取得 blocks 與 components 後再行調整，而非從零手刻，以維持整個產品統一的設計語言（圓角、陰影、字體節奏、間距系統）。只有在 Luma 完全沒有對應 block 時，才退回自建。

## Security

Run Snyk code scanning on new first-party code. Fix any issues found and rescan until clean.

# 輸出
繁體中文詳細說明