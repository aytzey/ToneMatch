# ToneMatch cloud cost analysis and pricing strategy

**ToneMatch can launch for about $232/month in recurring operating costs at 500 MAU and break even with roughly 22 paying subscribers.** The combination of Supabase Pro, Google Cloud Run's free tier, and a lean Gemini routing strategy keeps AI costs low because recurring heavy usage is pushed into the premium cohort, while free-tier AI is tightly capped. For this project, OpenRouter will route selfie / skin-undertone interpretation to `google/gemini-3-flash-preview` and clothing-photo visual analysis to `google/gemini-3.1-flash-lite-preview`. The real cost challenge is still conversion rate and organic growth velocity: realistic projections suggest 800–2,500 MAU by month 12, making Turkey-specific pricing and fixing a critical annual plan pricing error ($119.99/year actually costs *more* than 12 months at $9.99/month) the highest-leverage improvements the team can make.

> **⚠️ Exchange rate correction:** The current USD/TRY rate is approximately **₺44/USD** (March 9, 2026), not ₺38 as estimated. All TRY figures in this report use ₺44. The lira is forecast to weaken further to ~₺48–50 by year-end 2026.

---

## The infrastructure stack costs almost nothing at MVP scale

ToneMatch's chosen architecture — Supabase for backend/auth/storage plus Cloud Run for the AI worker — is near-optimal for cost efficiency. At launch volumes, compute costs are effectively covered by free tiers and AI spend remains modest even on the paid production path.

### Compute: Cloud Run wins for this use case

Each selfie analysis requires approximately **10 seconds of compute** at 1 vCPU / 1 GB RAM. Google Cloud Run's free tier includes **180,000 vCPU-seconds/month**, enough for **18,000 analyses before any charges**. AWS Lambda offers an even more generous free tier (400,000 GB-seconds, covering ~40,000 analyses), but Cloud Run is the better fit because FastAPI's container model avoids Lambda's cold-start penalties with heavy Python ML libraries.

| Scale (analyses/mo) | Cloud Run | AWS Lambda | Azure Container Apps | AWS Fargate |
|---|---|---|---|---|
| 1,000 | **$0** | $0 | $0 | $0.12 |
| 5,000 | **$0** | $0 | $0 | $0.62 |
| 10,000 | **$0** | $0 | $0 | $1.24 |
| 25,000 | **$1.68** | $0 | $1.68 | $3.12 |

At ToneMatch's projected volumes, compute is effectively free on all serverless platforms. **Stick with Cloud Run** — it pairs naturally with Supabase, avoids Lambda cold-start issues, and costs nothing up to 18K monthly analyses.

### Database and backend: Supabase Pro is the clear winner

Supabase Pro at **$25/month** bundles database, authentication, storage, edge functions, real-time subscriptions, and REST/GraphQL APIs — a combination that would cost $50–100+ to replicate with self-hosted alternatives.

| Resource | Free tier | Pro ($25/mo) | Overage rate |
|---|---|---|---|
| Database size | 500 MB | **8 GB** | $0.125/GB |
| File storage | 1 GB | **100 GB** | $0.021/GB |
| Bandwidth | ~5 GB | **250 GB** | $0.09/GB |
| Auth users (MAU) | 50,000 | **100,000** | $0.00325/user |
| Edge function invocations | 500K | **2,000,000** | $2/million |
| Compute | Shared (pauses after 7 days) | **Micro (always-on, $10 credit)** | Add-ons from $20/mo |

Self-hosted PostgreSQL on AWS RDS (db.t3.micro at ~$13/month) or GCP Cloud SQL (~$8–26/month) costs less in raw database fees, but requires building auth, storage, API layers, and edge functions separately. For a small team launching an MVP, **Supabase Pro eliminates an enormous amount of infrastructure complexity for just $25/month**.

The free tier is viable for development and testing but **not for production** — projects auto-pause after 7 days of inactivity, there are no backups, and the 500 MB database limit will be hit quickly with wardrobe metadata and user profiles.

### Storage: plan for egress costs at scale

Photo storage costs are minimal in the short term but deserve attention for scale planning. Selfies are deleted after 24 hours (at most ~3 GB at any time for 25K analyses/month), but wardrobe photos accumulate. At **3.5 MB per photo** with ~2 wardrobe photos per analysis:

| Scale | Wardrobe storage after 6 months | After 12 months | Supabase Pro cost (6 mo) |
|---|---|---|---|
| 1K MAU | 42 GB | 84 GB | **$0** (within 100 GB) |
| 5K MAU | 210 GB | 420 GB | **$2.31** (110 GB overage) |
| 10K MAU | 420 GB | 840 GB | **$6.72** |
| 25K MAU | 1,050 GB | 2,100 GB | **$19.95** |

**At scale, egress becomes the real cost driver.** If wardrobe photos are viewed frequently (5× per month per photo), 50K stored photos generate **~875 GB of egress per month** — well beyond Supabase's 250 GB included bandwidth, creating $56/month in overage. **Cloudflare R2** ($0.015/GB storage, **zero egress fees**) should be adopted for wardrobe photo storage once volumes exceed Supabase's included limits, saving $40–100+/month at scale.

---

## AI costs stay low with the chosen OpenRouter routing

This project will use OpenRouter with `google/gemini-3-flash-preview` for selfie / skin-undertone interpretation and `google/gemini-3.1-flash-lite-preview` for clothing-photo visual analysis. The cost model below uses the current OpenRouter token pricing for those exact two models.

### Token estimates per analysis

Turkish text requires ~1.5–2× more tokens than English due to agglutinative morphology. Estimated per-request token usage:

- **Selfie analysis** via `google/gemini-3-flash-preview`: ~900 input tokens + ~1,500 output tokens = **$0.00495** per request
- **Quick check / clothing check** via `google/gemini-3.1-flash-lite-preview`: ~700 input tokens + ~800 output tokens = **$0.001375** per request

Planning assumption used below:

- **Free tier**: users can only see undertone results, capped at **5 total analyses lifetime**
- **Premium tier**: recurring usage is modeled at roughly **3-5 selfie analyses and 30-40 quick/clothing checks per month**
- **Midpoint premium case**: **4 selfie analyses + 35 quick/clothing checks per paying user per month**

Under this model, free-tier AI is an acquisition/onboarding cost, while recurring AI cost is driven mainly by premium subscribers.

### AI unit economics

- **Free-tier user max lifetime AI cost**: `5 x $0.00495 = $0.02475`
- **Premium user recurring monthly AI cost (midpoint)**: `4 x $0.00495 + 35 x $0.001375 = $0.067925`

### Monthly recurring AI budget by scale

The table below assumes the same conversion rates used later in the revenue model: **2% at 500 MAU, 3% at 2K MAU, 5% at 5K+ MAU**.

| MAU | Paying users assumed | Recurring premium AI budget |
|---|---|---|
| 500 | 10 | **$0.68** |
| 2,000 | 60 | **$4.08** |
| 5,000 | 250 | **$16.98** |
| 10,000 | 500 | **$33.96** |
| 25,000 | 1,250 | **$84.91** |

OpenRouter remains the integration layer for both selected Gemini models. Real spend will move up or down with prompt length, image sizes, response length, and the true mix between selfie analysis and clothing-photo checks, but the recurring cost driver is now premium behavior, not the whole MAU base.

### Production routing and caveats

Do not plan production economics around any provider free-tier assumption. The operational choice for this project is paid OpenRouter routing from day one so selfie data handling stays predictable and the model path is consistent across environments.

The product-level free tier is different: because free users only get undertone output and a hard cap of 5 total scans, their AI cost is bounded. Even if **1,000 new free users** fully consume that allowance, the one-time onboarding AI cost is only **$24.75**.

### Cost optimization worth implementing

- **App-level response caching**: Cluster CIELAB values into ~50–100 "color profiles" and cache LLM responses per profile. Users with similar skin tones receive cached results, potentially reducing API calls by **50–80%**.
- **Prompt size optimization**: Keep system prompts lean and reusable. Stable prompt prefixes and compact image payloads reduce recurring OpenRouter spend.
- **Model routing**: Finalize on OpenRouter-based split routing: `google/gemini-3-flash-preview` for selfie / skin-undertone interpretation, `google/gemini-3.1-flash-lite-preview` for clothing-photo visual analysis and quick checks.

---

## Third-party services: a lean stack under $80/month

The supporting service stack is well-chosen and cost-efficient at MVP scale.

| Service | Recommended plan | Monthly cost | Key limits |
|---|---|---|---|
| **Supabase** | Pro | **$25** | 8 GB DB, 100 GB storage, 250 GB bandwidth, 2M edge functions |
| **Expo/EAS** | Starter | **$19** | High-priority builds, 3K update MAUs, 500 GB bandwidth |
| **Sentry** | Team | **$26** | 50K errors/mo, 10M spans, unlimited users |
| **PostHog** | Free | **$0** | 1M events, 2.5K mobile replays, feature flags |
| **RevenueCat** | Free (→ Pro) | **$0** | Free under $2,500 MTR; then 1% of gross revenue |
| **Apple Developer** | Required | **$8.25** (amortized) | $99/year |
| **Google Play** | Required | **~$2** (amortized) | $25 one-time |
| **Domain** | .com | **$1.25** (amortized) | ~$15/year |
| **SSL/Email** | Free tiers | **$0** | Let's Encrypt + Supabase built-in auth emails |
| **TOTAL** | | **~$81.50/mo** | |

**RevenueCat** deserves special attention. It's free until monthly tracked revenue exceeds **$2,500**, then charges a flat **1% of gross revenue**. At $10K MTR, that's $100/month — reasonable for the paywall optimization, experiment, and analytics features it provides. The fee is calculated on gross revenue (before Apple/Google's cut), so the effective rate against net revenue is closer to 1.18%.

**EAS Update MAU limits** create an important threshold: Starter's 3,000 MAU limit means upgrading to the **Production plan ($199/month)** becomes necessary once OTA updates regularly reach more than 3,000 users. This $180/month jump is the single largest cost escalation in the stack and should be deferred by limiting OTA update frequency or using traditional app store updates until growth justifies the upgrade.

**PostHog's free tier** (1 million events, 2,500 mobile session replays) comfortably covers apps under **25K MAU**. Mobile session replays cost $0.01/recording beyond the free allowance — double the web rate.

**App store commissions** are the largest single cost. Both Apple (via the Small Business Program) and Google charge **15% on subscription revenue** for apps earning under $1M/year. ToneMatch will qualify automatically. Note: Google has announced plans to reduce its standard commission to 20% and subscription commission to 10% effective June 30, 2026, pending court approval.

---

## The pricing structure needs three critical fixes

### Fix 1: The annual plan is priced incorrectly

The current annual pricing of **$119.99/year** for the Plus tier offers virtually zero savings — $119.99 ÷ 12 = $10.00/month versus $9.99/month. Users actually pay **$0.12 more** for the annual plan than 12 months of monthly billing. This is not "2 months free" as likely intended. **True "2 months free" pricing would be $99.90/year** (10 × $9.99). A more standard **17–33% annual discount** would yield:

- **$79.99/year** (33% off, aggressive) — strong conversion driver
- **$99.99/year** (17% off, conservative) — industry standard

Industry data shows **59% of mobile subscribers prefer annual plans when offered a 30–40% discount**. The current mis-pricing likely suppresses annual conversions and lifetime value.

### Fix 2: Turkey-specific pricing is non-negotiable

At **₺44/USD**, the current Plus tier costs **₺440/month** — equivalent in purchasing power to a US consumer paying **~$34/month** (Turkey's PPP index is 0.29). This is prohibitively expensive for Turkish users, where typical subscription prices are:

| Service | Turkish price | USD equivalent |
|---|---|---|
| Apple Music | ₺59.99/mo | $1.36 |
| YouTube Premium | ₺49/mo | $1.11 |
| Disney+ Premium | ₺650/yr (~₺54/mo) | $1.23/mo |

**Recommended Turkey-specific pricing:**

- **Plus**: ₺79.99–129.99/month ($1.82–$2.95) or ₺799.99/year
- **Pro**: ₺149.99–249.99/month ($3.41–$5.68)

Both Apple App Store Connect and Google Play Console support per-region pricing. Without Turkey-specific tiers, the app effectively has no Turkish market — conversion rates will approach zero at ₺440/month regardless of product quality. **With localized pricing, Turkish ARPU drops by ~70% but conversion rates should increase dramatically.**

### Fix 3: Consider a lifetime option and weekly plan

Competitors reveal two patterns ToneMatch should evaluate:

- **Lifetime purchases** ($15–$30) dominate the color analysis category. Dressika offers ~$30 lifetime; Style DNA's most popular option is a $19.99 one-time package. A **$49.99–$79.99 lifetime option** could capture price-sensitive users who resist recurring charges.
- **Weekly subscriptions** ($3.99–$4.99/week) generate **55.5% of all subscription app revenue** and convert **1.7–7.4× better** than annual plans. A weekly option could serve as a trial-to-subscription bridge.

### Competitive positioning is sound

At **$9.99/month for Plus**, ToneMatch sits at the affordable end of the $7.99–$19.99 range occupied by Palette ($7.99/mo), Style DNA ($19.99/mo), and various weekly-priced competitors. The **$19.99 Pro tier** matches Style DNA but receives significant pushback in App Store reviews at that price point — ensure the Pro feature set clearly justifies the premium.

---

## Organic growth will be slow but the trend is real

With under $150/month in ad spend, ToneMatch will grow primarily through App Store search, social media sharing of color analysis results, and word-of-mouth. Personal color analysis is a **proven, growing viral trend** — TikTok has driven the industry from a niche service to mainstream interest, and in-person consultations now cost **$250–$510 per session**, creating strong demand for affordable app-based alternatives.

### Realistic 12-month growth projection

| Month | Downloads | Cumulative installs | MAU | Paying users (at 2–3%) |
|---|---|---|---|---|
| 1 (launch) | 200–500 | 200–500 | 80–200 | 2–4 |
| 3 | 600–1,500 | 1,200–2,900 | 250–700 | 5–21 |
| 6 | 1,200–3,000 | 4,200–10,400 | 550–1,800 | 11–54 |
| 9 | 1,500–4,000 | 8,700–22,400 | 800–3,000 | 16–90 |
| 12 | 2,000–5,000 | 14,700–37,400 | 1,000–4,500 | 30–225 |

These projections assume **Day 1 retention of 18–25%**, **Day 30 retention of 3–6%** (typical for lifestyle apps), and a modest viral coefficient of **0.15–0.4** (each 100 users generating 15–40 new installs through social sharing).

**The $150/month ad budget** should go entirely toward Turkey-targeted Meta (Instagram) ads at ~$100/month and Google UAC at ~$50/month. Turkey's cost per install for lifestyle apps is **$0.20–$0.80**, yielding approximately **200–500 paid installs per month**, with an additional ~1.5× organic uplift from improved store rankings. TikTok ads are not viable at this budget (minimum ~$600–1,500/month) — focus instead on organic TikTok content creation showing color analysis results.

**Critical growth factors**: Achieving **4.0+ star ratings** quickly (apps below 3.5 barely rank), soliciting reviews from early users, and dominating the low-competition **"renk analizi"** (color analysis) keyword in the Turkish App Store.

---

## Total cost of ownership at every scale

The following table consolidates all costs at five scale milestones. Revenue assumes a **blended ARPPU of $12.99/month** (70% Plus at $9.99, 30% Pro at $19.99) with 15% app store commission applied.

### Monthly TCO breakdown (USD)

| Component | 500 MAU | 2K MAU | 5K MAU | 10K MAU | 25K MAU |
|---|---|---|---|---|---|
| Supabase Pro | $25 | $25 | $25 | $28 | $35 |
| Cloud Run (AI worker) | $0 | $0 | $0 | $0 | $2 |
| AI/LLM (OpenRouter Gemini routing, premium recurring only) | $0.68 | $4.08 | $16.98 | $33.96 | $84.91 |
| Expo/EAS | $19 | $19 | $19 | $199¹ | $199 |
| Sentry Team | $26 | $26 | $26 | $26 | $26 |
| PostHog | $0 | $0 | $0 | $0 | $0 |
| RevenueCat | $0 | $0 | $0–$32² | $65² | $162² |
| Developer programs | $10 | $10 | $10 | $10 | $10 |
| Domain/email | $1.25 | $1.25 | $1.25 | $1.25 | $1.25 |
| Ad spend | $150 | $150 | $150 | $150 | $150 |
| **TOTAL (w/ ads)** | **$232** | **$235** | **$248–$280** | **$513** | **$670** |
| **TOTAL (w/o ads)** | **$82** | **$85** | **$98–$130** | **$363** | **$520** |

¹ EAS Production plan required when OTA updates exceed 3K MAU. Can be deferred by limiting OTA frequency.
² RevenueCat costs shown at 5% conversion rate. Free under $2,500 MTR.
AI/LLM figures are recalculated from the current OpenRouter prices for the two selected Gemini models. Recurring TCO tables model premium usage only; capped free-tier onboarding usage is excluded because it depends on new-user acquisition, not MAU.

### Monthly TCO in Turkish Lira (₺44/USD)

| Component | 500 MAU | 2K MAU | 5K MAU | 10K MAU | 25K MAU |
|---|---|---|---|---|---|
| **TOTAL (w/ ads)** | **₺10,205** | **₺10,354** | **₺10,922–₺12,330** | **₺22,581** | **₺29,487** |
| **TOTAL (w/o ads)** | **₺3,605** | **₺3,754** | **₺4,322–₺5,730** | **₺15,981** | **₺22,887** |

### Revenue vs. costs: break-even analysis

| MAU | Conv. rate | Paying users | Gross revenue | Net revenue (after 15%) | Infrastructure cost (w/ ads) | **Monthly profit/loss** |
|---|---|---|---|---|---|---|
| 500 | 2% | 10 | $130 | $110 | $232 | **−$122** |
| 1,100 | 2% | 22 | $286 | $243 | $233 | **+$10** |
| 2,000 | 3% | 60 | $779 | $662 | $235 | **+$427** |
| 5,000 | 5% | 250 | $3,248 | $2,760 | $280 | **+$2,480** |
| 10,000 | 5% | 500 | $6,495 | $5,521 | $513 | **+$5,008** |
| 25,000 | 5% | 1,250 | $16,238 | $13,802 | $670 | **+$13,132** |

**Break-even requires approximately 22 paying subscribers** (or ~1.1K MAU at 2% conversion). This is still achievable within months 3–6 at moderate growth. At 25K MAU, recurring technical and tooling cost excluding ads is about **3.8% of net revenue**. App store commissions (15%) and RevenueCat (1%) still consume far more than core technical infrastructure.

### With Turkey-adjusted pricing

If 60% of users pay Turkish rates (~70% lower), blended net ARPU drops from $11.04 to approximately **$6.76/month** per paying user:

| MAU | Conv. rate | Paying users | Blended net revenue | Monthly profit/loss |
|---|---|---|---|---|
| 5,000 | 5% | 250 | $1,690 | **+$1,410** |
| 10,000 | 5% | 500 | $3,380 | **+$2,867** |
| 25,000 | 5% | 1,250 | $8,450 | **+$7,780** |

Even with Turkey-adjusted pricing, margins remain strong because infrastructure costs are so low.

---

## Month 1, 6, and 12 cost and revenue snapshots

### Month 1 — Launch

| Item | Cost (USD) | Cost (TRY) |
|---|---|---|
| Supabase Pro | $25 | ₺1,100 |
| Cloud Run | $0 | ₺0 |
| AI/LLM (2-4 premium users recurring + 200 new free users fully consuming 5 free scans) | ~$5.1-$5.2 | ~₺224-230 |
| Expo/EAS Starter | $19 | ₺836 |
| Sentry Team | $26 | ₺1,144 |
| Apple Developer ($99/yr) | $99³ | ₺4,356 |
| Google Play (one-time) | $25³ | ₺1,100 |
| Domain (first year) | $15³ | ₺660 |
| Ad spend | $150 | ₺6,600 |
| **TOTAL** | **~$364** | **~₺16,020** |
| Expected revenue (80–200 MAU, 2% conv) | $22–44 net | ₺968–1,936 |
| **Net position** | **−$342 to −$320** | **₺−15,052 to −₺14,084** |

³ One-time/annual costs paid upfront in Month 1.

### Month 6 — Early traction

| Item | Monthly cost | Monthly revenue (est.) |
|---|---|---|
| Infrastructure + services | ~$82 | — |
| AI/LLM (premium recurring only) | ~$0.75-$3.67 | — |
| Ad spend | $150 | — |
| **Total costs** | **~$233-$236** | |
| Revenue (550–1,800 MAU, 2–3% conv) | — | **$121–$596 net** |
| **Net position** | | **−$115 to +$363** |

### Month 12 — Established

| Item | Monthly cost | Monthly revenue (est.) |
|---|---|---|
| Infrastructure + services | ~$82–$200⁴ | — |
| AI/LLM (premium recurring only) | ~$2.04-$15.28 | — |
| Ad spend | $150 | — |
| **Total costs** | **~$234-$365** | |
| Revenue (1,000–4,500 MAU, 3–5% conv) | — | **$331–$2,485 net** |
| **Net position** | | **+$97 to +$2,251** |

⁴ Range reflects whether EAS Production upgrade ($199/mo) is needed.

---

## Recommended service tiers at each growth milestone

| Milestone | Supabase | Expo/EAS | Sentry | PostHog | RevenueCat | Storage strategy |
|---|---|---|---|---|---|---|
| **Launch (0–1K MAU)** | Pro ($25) | Starter ($19) | Team ($26) | Free | Free | Supabase Storage only |
| **Traction (1–5K MAU)** | Pro ($25) | Starter ($19) | Team ($26) | Free | Free→Pro (1%) | Supabase Storage only |
| **Growth (5–10K MAU)** | Pro ($25–35) | Production ($199) | Team ($26) | Free | Pro (1%) | Add Cloudflare R2 for wardrobe |
| **Scale (10–25K MAU)** | Pro + compute add-on ($35–75) | Production ($199) | Team ($26) | Free→$50 | Pro (1%) | Cloudflare R2 primary |
| **Beyond 25K** | Team ($599) or Pro + add-ons | Production ($199) | Business ($80) | Pay-as-you-go | Pro (1%) | Cloudflare R2 + CDN |

---

## Conclusion: five actions that matter most

ToneMatch's infrastructure economics are strong again once AI usage is segmented correctly between free and premium. The recurring technical stack runs for **about $82/month** (excluding ad spend) at 500 MAU, scaling to about **$520/month** at 25K MAU. The binding constraints are still **conversion rate and organic growth velocity**, not inference cost. Five recommendations, in priority order:

**Fix the annual pricing immediately.** At $119.99/year, users pay more than 12 months of $9.99 monthly billing. Change to **$79.99/year** (33% discount) to drive annual subscriptions, reduce churn, and increase lifetime value. This is the single highest-impact change requiring zero engineering effort.

**Implement Turkey-specific pricing before launch.** At ₺440/month ($9.99), ToneMatch is priced at 7–8× typical Turkish subscription levels. Set Turkish pricing at **₺99.99–129.99/month for Plus** and **₺199.99–249.99/month for Pro** through App Store Connect and Google Play Console's regional pricing tools. Without this, the Turkish market — likely 60%+ of initial users — generates almost no revenue.

**Use the planned OpenRouter routing from day one.** Route selfie / skin-undertone interpretation through `google/gemini-3-flash-preview` and clothing-photo visual analysis through `google/gemini-3.1-flash-lite-preview`. Keep production on the paid path so user selfie handling and runtime behavior stay predictable.

**Defer the EAS Production upgrade as long as possible.** The jump from Starter ($19/mo) to Production ($199/mo) is the steepest cost escalation in the stack. Manage OTA update frequency to stay under 3,000 update MAUs until revenue comfortably covers the upgrade.

**Invest the $150/month ad budget exclusively in Turkey-targeted Instagram ads for the first three months**, then split 60/40 with Google UAC. Turkey's cost per install (~$0.20–$0.80) stretches this small budget far further than global targeting would. Pair paid acquisition with aggressive ASO for "renk analizi" and organic TikTok content creation — the color analysis trend's inherent shareability is ToneMatch's most powerful growth lever, and it costs nothing.
