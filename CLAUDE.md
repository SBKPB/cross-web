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
├── app/              # Next.js App Router pages
│   ├── layout.tsx    # Root layout with Geist fonts
│   ├── page.tsx      # Home page
│   └── clinics/      # Clinics feature route
├── components/
│   ├── ui/           # Reusable UI components (shadcn/ui pattern)
│   └── clinics/      # Clinic-specific components
├── lib/
│   ├── utils.ts      # cn() utility for className merging
│   └── constants/    # Domain constants (hospital levels, departments)
├── types/            # TypeScript type definitions
└── data/             # Mock data (to be replaced with API)
```

### Import Alias
Use `@/*` to import from `src/*` (configured in tsconfig.json).

### Domain Model
The app manages medical facilities with these core types defined in `src/types/clinic.ts`:
- **Clinic**: Main entity with hospital_level, departments, doctors, staff, beauticians
- **HospitalLevel**: medical_center | regional_hospital | district_hospital | clinic
- **MedicalDepartment**: 18 Taiwan medical specialties (internal_medicine, surgery, pediatrics, etc.)

### UI Component Pattern
Components in `src/components/ui/` follow the shadcn/ui pattern using `class-variance-authority` (cva) for variant styling. The `cn()` utility merges Tailwind classes.

## Security

Run Snyk code scanning on new first-party code. Fix any issues found and rescan until clean.

# 輸出
繁體中文詳細說明