# ToneMatch

Skin undertone analysis app: selfie -> CIELAB color science + LLM interpretation -> personalized color palette & shopping recommendations.

## Quick Start

```bash
git clone <repo> && cd ToneMatch
cp .env.example .env        # fill in real values
npm install                  # postinstall copies .env to sub-projects
npm run dev:mobile           # Expo dev server
npm run dev:worker           # Python FastAPI on :8080
```

## Monorepo Structure

```
apps/mobile/          Expo 54 + React Native 0.81 (Expo Router, file-based routing)
services/ai-worker/   Python FastAPI (CIELAB pipeline + OpenRouter/Gemini LLM)
supabase/
  functions/          Deno Edge Functions (TypeScript)
  migrations/         PostgreSQL schema (RLS-enabled)
scripts/              CLI utilities (link-env, catalog ingest, workbook builder)
docs/                 Product & technical docs (Turkish)
```

## Tech Stack

- **Mobile:** Expo, React Native, Expo Router, Zustand, React Query, RevenueCat
- **Backend:** Supabase (Auth, Postgres, Storage, Edge Functions)
- **AI Worker:** FastAPI, NumPy, Pillow (CIELAB color science), OpenRouter (Gemini LLM)
- **Billing:** RevenueCat (free / plus / pro tiers)

## Environment

Single root `.env` is the source of truth. `npm install` (postinstall) copies it to `apps/mobile/.env` and `services/ai-worker/.env`. After editing root `.env`, run `node scripts/link-env.js` to re-copy.

Key variables:
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` - backend admin access
- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` - client-side (safe to expose)
- `OPENROUTER_API_KEY` / `EXPO_PUBLIC_OPENROUTER_API_KEY` - LLM calls
- `EXPO_PUBLIC_DEV_SINGLE_USER_MODE` - bypass auth in dev
- Supabase Edge Functions use `Deno.env.get()` (set via `npx supabase secrets set`)

## Key Paths

| What | Path |
|------|------|
| Expo app entry | `apps/mobile/app/(tabs)/` |
| Components | `apps/mobile/src/components/` |
| Feature hooks | `apps/mobile/src/features/{auth,scan,style,wardrobe,billing,catalog}/` |
| API client | `apps/mobile/src/lib/tonematch-api.ts` |
| Supabase client | `apps/mobile/src/lib/supabase.ts` |
| Env validation | `apps/mobile/src/lib/env.ts` |
| Domain types | `apps/mobile/src/types/tonematch.ts` |
| Theme/colors | `apps/mobile/src/theme/palette.ts` |
| State stores | `apps/mobile/src/store/` |
| AI pipeline | `services/ai-worker/app/pipeline.py` |
| AI settings | `services/ai-worker/app/settings.py` |
| LLM service | `services/ai-worker/app/llm_service.py` |
| API routes | `services/ai-worker/app/main.py` |
| Edge functions | `supabase/functions/` |
| DB migrations | `supabase/migrations/` |

## Architecture & Data Flow

```
Selfie -> create-upload (signed URL) -> Supabase Storage
       -> finalize-analysis (edge fn) -> Cloud Tasks -> AI Worker
       -> pipeline.py (CIELAB extraction, undertone/contrast classification)
       -> llm_service.py (OpenRouter Gemini interpretation)
       -> Results stored: style_profiles, recommendation_sets/items
       -> Mobile polls analysis_sessions.status until completed
```

## Database (Key Tables)

- `users` - identity, style_goal, gender_presentation
- `photo_assets` - file registry (selfies/wardrobe buckets)
- `analysis_sessions` - one per selfie analysis (status, scores)
- `style_profiles` - ONE per user (undertone, contrast, palette_json)
- `recommendation_sets/items` - product recommendations
- `wardrobe_items` - user's clothes (color_tags, fit_score)
- `catalog_items` - merchant products (tone_labels, contrast_labels)
- `subscription_states` - billing (free/plus/pro)
- `quick_checks` - clothing fit assessments
- `merchant_clicks` - commerce click tracking

## AI Pipeline Details

- **Color space:** sRGB -> Linear RGB -> XYZ (D65) -> CIELAB
- **Skin detection:** Dual RGB (Kovac 2003) + YCbCr (Chai & Ngan 1999)
- **Undertone:** Hue angle (h*) + chroma + a*/b* ratio -> warm/cool/olive/neutral
- **Contrast:** L* standard deviation -> low/medium/high
- **8 profile palettes:** undertone x contrast combinations in `PROFILE_LIBRARY`
- **LLM models:** `google/gemini-2.5-flash-preview` (analysis), `gemini-3.1-flash-lite-preview` (quick-check)

## Commands

```bash
npm run dev:mobile              # Expo dev server
npm run dev:worker              # FastAPI on :8080
npm run typecheck:mobile        # TypeScript check
npm run lint:mobile             # ESLint
npm run build:workbook          # Generate Excel workbook
npm run ingest:catalog          # Sync merchant catalog
npx supabase start              # Local Supabase
npx supabase db push            # Apply migrations
npx supabase functions serve    # Local edge functions
cd services/ai-worker && pytest # Run AI worker tests
```

## Conventions

- Language: UI strings in Turkish, code in English
- Styling: Inline React Native styles + `palette.ts` tokens (no CSS framework)
- State: Zustand for local state, React Query for server state
- API: All Supabase calls go through `tonematch-api.ts`
- Auth: Supabase Auth with email/password; dev mode bypasses with single user
- File structure: Feature-based (`src/features/`) with shared components (`src/components/`)
- Types: Centralized in `src/types/tonematch.ts`
- Edge functions: Each in own folder, shared utils in `_shared/`
- Python: Pydantic models for validation, pytest for testing
