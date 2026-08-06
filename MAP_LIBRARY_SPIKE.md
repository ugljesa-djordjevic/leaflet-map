# Spike: Replacing react-leaflet in the LocationMap widget

**Status:** Proposal — awaiting team decision
**Date:** 2026-08-06
**Scope:** LocationMap widget (store-health dashboard). Backend (`location-map` Azure Functions) is unaffected — it has no map-library dependency.

---

## 1. Problem statement

The LocationMap widget depends on **react-leaflet**, which is licensed under the **Hippocratic License 2.1** — a non-OSI-approved license with ethical-use restrictions that our company policy (permissive licenses only: MIT / BSD / Apache / ISC) does not allow.

Precise license situation of our current map stack (verified against the npm registry, 2026-08-06):

| Package | Current version | License | Verdict |
|---|---|---|---|
| `react-leaflet` | 5.0.0 | **Hippocratic-2.1** (since v3; v2.x was MIT) | **Must be removed** |
| `react-leaflet-cluster` | 4.1.3 | MIT — but peer-depends on `react-leaflet ^5.0` | **Dies with react-leaflet** |
| `leaflet` | 1.9.4 | BSD-2-Clause | Compliant |
| `leaflet.markercluster` | 1.5.3 | MIT (last release 2022 — dormant) | Compliant |

Only the **React binding layer** is the problem. Leaflet itself is fine license-wise. Downgrading to react-leaflet v2 (MIT) is not viable: it predates React 18 and is unmaintained.

### 1.1 Second finding: our basemap tiles have their own compliance gap

While auditing the stack we verified the terms for the tiles the widget loads from `basemaps.cartocdn.com` (CARTO light/dark "nolabels" raster):

- CARTO's own license text: *"access to CARTO's basemap tile services is restricted to CARTO enterprise customers and Non-Profit GRANTS only and is not available for free public use."* ([source](https://github.com/CartoDB/basemap-styles/blob/master/LICENSE.md))
- CARTO's FAQ: basemaps are free for **non-commercial** grantees only; commercial use requires an **Enterprise license** ([source](https://docs.carto.com/faqs/carto-basemaps)).
- Attribution ("© CARTO © OpenMapTiles © OpenStreetMap contributors") is **mandatory** — and the widget currently renders with `attributionControl={false}`.

This is independent of the react-leaflet problem and applies to the app **as deployed today**. Action needed either way (see Open questions): confirm whether we hold a CARTO Enterprise license; if not, switch tile provider; re-enable attribution in either case.

---

## 2. Current state — how coupled are we?

The widget is 22 frontend files / ~2,000 lines. The map-library coupling is small and well-contained:

| Coupling | Files | Lines | Share |
|---|---|---|---|
| Runtime react-leaflet/Leaflet code | 6 files (`LocationMapContainer`, `AvailabilityMarker`, `LocationMapController`, `LocationViewportListener`, `layers/MarkersLayer`, `mapUtils`) | 344 | 17 % |
| Type-only (`L.LatLngBounds` in a signature) | 2 files (`hooks/useMapNavigation`, `layers/ActiveMarkersLayer`) | 2 import lines | ~0 % |
| **Zero map imports — untouched by any migration** | **14 files** (all hooks/contexts/legend/breadcrumb/widget UI, Redux/RTK Query integration) | **1,269** | **63 %** |

Complete API surface actually used (nothing else):

- **Map:** container with `center`/`zoom`, zoom control (bottom-right), tile layer, `fitBounds(bounds, {padding, maxZoom})`, `setView`, `getBounds`, `getZoom`; events `moveend`, `zoomend`, `load`
- **Markers:** HTML `divIcon` markers (styling via CSS classes `availability-marker*` in the host-app stylesheet), events `click`/`mouseover`/`mouseout`, permanent tooltip (`availability-tooltip`)
- **Clustering:** marker cluster group with custom cluster icon that averages child markers' availability (`availability-cluster*` classes), chunked loading, spiderfy at max zoom
- **Geometry:** `bounds.pad(0.2)`, `bounds.contains(...)` for viewport culling

This small surface is what makes a migration cheap — we are not fighting a big-API problem.

---

## 3. Requirements for the replacement

1. **License:** permissive only (MIT / BSD / Apache / ISC), for the library **and** everything it drags in.
2. **Visual parity:** the map must look the same as the approved design (CARTO light/dark, no labels, our marker/cluster/tooltip styling untouched).
3. **Cost:** cheapest viable — ideally $0 recurring.
4. **Established library** preferred over homegrown code (team decision).
5. Feature coverage for the surface in §2.

---

## 4. Options evaluated

### Option A — MapLibre GL JS + @vis.gl/react-maplibre + supercluster ⭐ Recommended

| Package | Version | License | Health (npm, 2026-08) |
|---|---|---|---|
| `maplibre-gl` | 6.2.0 | BSD-3-Clause | Release published 2026-08-06; very active, large community (Linux Foundation project) |
| `@vis.gl/react-maplibre` | 8.1.2 | MIT | Active (2026-07-29); this is the MapLibre half of the well-known react-map-gl project (vis.gl / OpenJS Foundation), split out in v8 |
| `supercluster` | 8.0.1 | ISC | Stable, the de-facto clustering standard (also what Mapbox/MapLibre use internally) |
| `use-supercluster` (optional hook) | 1.2.0 | MIT | Small convenience wrapper |

MapLibre is the open-source fork of Mapbox GL (created when Mapbox went proprietary in v2). It is the mainstream choice for license-clean, WebGL-based maps in React, with first-class React bindings maintained under the vis.gl umbrella.

- **License:** fully permissive across the stack. ✅
- **Visual parity:** two routes, both good:
  - *Raster route:* MapLibre renders plain raster XYZ sources — it can serve the **exact same CARTO tiles** we show today (if we keep/obtain the CARTO license), pixel-identical imagery.
  - *Vector route:* CARTO's basemap **styles** (Positron light / Dark Matter dark, incl. nolabels variants) are open source (BSD-3 code, CC-BY 4.0 design) and are exactly what free providers like OpenFreeMap serve — same cartography we use now, sharper rendering, free for commercial use (see §5).
  - Markers are **DOM elements**: our existing divIcon HTML/CSS classes (`availability-marker*`, `availability-cluster*`, `availability-tooltip`) carry over as React children of `<Marker>` — the host-app stylesheet keeps working unchanged.
- **Feature coverage:** everything in §2 maps 1-to-1 (mapping table in §7). One gap: supercluster has no built-in "spiderfy" for fully-overlapping points at max zoom — see §7.1 for the mitigation.
- **Cost:** $0 for the libraries; tiles per §5.
- **Effort:** rewrite of the 6 coupled files (~344 lines) + 2 type imports. Estimate **3–5 dev-days + 1–2 days QA** in the host app.
- **Risks:** WebGL rendering (needs GPU/driver sanity check on target hardware — fine for dashboards in practice); coordinate order flips from `[lat, lng]` to `[lng, lat]` (classic migration gotcha, contained in the 6 files).

### Option B — Keep Leaflet, write our own thin React wrapper (runner-up)

Leaflet core (BSD-2) and leaflet.markercluster (MIT) are compliant; only the React glue is banned. The glue we actually use is ~7 components/hooks — an in-house wrapper is roughly **300 lines**, one-time.

- **Pros:** pixel-identical (same Leaflet DOM, same CSS, same raster tiles), smallest possible visual risk, $0, no new rendering technology.
- **Cons:** homegrown infrastructure code we must own forever (team preference is an established library); leaflet.markercluster is dormant (last release 2022); does **not** solve the CARTO tile-license gap (§1.1) — that needs fixing regardless.
- Keep as the **fallback** if Option A's visual QA disappoints.

### Option C — OpenLayers + rlayers — evaluated, not shortlisted

`ol` 10.10.0 (BSD-2, very active) + `rlayers` 3.9.0 (ISC, active). License-clean and capable, but: the React wrapper is a one-maintainer project with a small community; OpenLayers' API is the most verbose of the three; clustering + HTML markers require more custom code than either A or B; no visual advantage over A. More effort, no offsetting benefit.

### Option D — Pigeon Maps — eliminated

MIT, genuinely lightweight, but no clustering story, tiny ecosystem, slow release cadence (last release 2024-12). Would mean hand-rolling clustering *and* accepting a less capable map core.

### Option E — Commercial SDKs (Google Maps, Mapbox, Azure Maps) — eliminated on cost + lock-in

| Provider | Pricing signal (2026-08, confirm before use) | License / lock-in |
|---|---|---|
| Google Maps JS | 10k free map loads/mo, then ~$7 / 1,000 | Proprietary SDK; tiles usable only inside Google's SDK |
| Mapbox GL JS v2+ | 50k free loads/mo, then ~$5 / 1,000 | **Proprietary since v2** (that's why MapLibre exists); telemetry |
| Azure Maps | 5,000 free tile transactions/mo (1 transaction = 15 tiles → 75k tiles), then per-1,000 pricing | Proprietary service; we are an Azure shop, so this is the least-friction *commercial* option if we ever want one |

All three fail "cheapest" (recurring, usage-based cost for a widget that today costs $0 in libraries) and add proprietary lock-in. Azure Maps is worth remembering only if procurement prefers consolidating spend into Azure over a free-tier dependency.

---

## 5. Tile provider decision (orthogonal to the library)

Whatever library we pick, the tiles need a decision because of §1.1:

| Tile source | Cost | Commercial use | Visual parity with today | Notes |
|---|---|---|---|---|
| **CARTO (current)** | Enterprise license (no public price) | Only with Enterprise license | Identical (it *is* today's map) | **First step: check whether the company already holds this license.** Attribution must be re-enabled regardless. |
| **OpenFreeMap** | **$0, unlimited** | ✅ Explicitly allowed, no key, no registration | Very close — serves the same open CARTO cartography (Positron); "nolabels"/dark variants achievable by style-JSON tweak (styles are BSD-3/CC-BY open source) | Donation-funded public instance; **self-hosting supported** (open source) as the hedge if the public instance ever degrades. Requires MapLibre (vector) → pairs with Option A. |
| Self-hosted OpenMapTiles/Protomaps | Infra cost only | ✅ | Same as above | Most control, most ops work. Plan B if free hosted tiles are deemed a risk. |
| MapTiler | Free tier is **non-commercial only**; commercial from $25/mo | Paid | Good (own styles + CARTO-like) | Attribution/logo required on free tier |
| Stadia Maps | Free tier non-commercial; commercial from $20/mo | Paid | Good | |
| Azure Maps | Free 5k transactions/mo, then paid | ✅ (paid) | Different cartography — visual change | Azure-shop synergy |

**Recommended pairing:** Option A + (CARTO vector if we're licensed, otherwise OpenFreeMap with the CARTO-style JSON adjusted to nolabels + dark variant). Attribution control re-enabled in both cases.

---

## 6. Recommendation

**Adopt MapLibre GL JS 6.x with `@vis.gl/react-maplibre` 8.x and `supercluster` (Option A).**

Rationale:

1. Every package is permissively licensed (BSD-3 / MIT / ISC) — clears the policy that triggered this work, with no edge cases.
2. Established, foundation-backed, actively maintained libraries — exactly the "no homegrown wrapper" preference, and the most future-proof choice (this is where the open-source map ecosystem consolidated after Mapbox went proprietary).
3. $0 library cost, and a $0 commercially-legal tile path (OpenFreeMap) that renders the same CARTO cartography we ship today — simultaneously fixing the tile-license gap we found.
4. Small blast radius: 6 files / ~17 % of the widget; 63 % of files untouched; marker/cluster/tooltip CSS in the host app survives verbatim because MapLibre markers are DOM elements.
5. Bonus correctness win: cluster availability averaging moves from today's hack (writing a custom field onto Leaflet marker options) to supercluster's built-in map/reduce aggregation.

Fallback if visual QA rejects WebGL rendering: Option B (Leaflet + ~300-line in-house wrapper) — pixel-identical, still license-clean, still needs the tile decision.

---

## 7. Migration outline (Option A)

Every current call site has a direct equivalent:

| Today (react-leaflet / Leaflet) | After (MapLibre / @vis.gl/react-maplibre) |
|---|---|
| `<MapContainer center zoom zoomControl={false} attributionControl={false} preferCanvas>` | `<Map initialViewState={{longitude, latitude, zoom}} attributionControl={…}>` (re-enable attribution); `preferCanvas` n/a (WebGL) |
| `<TileLayer url attribution>` (raster) | Style URL (vector, recommended) or raster source+layer with the same XYZ tiles |
| Light/dark via swapping raster URL on MUI mode | Same trigger, swapping style URL / `mapStyle` prop |
| `<ZoomControl position="bottomright">` | `<NavigationControl position="bottom-right" showCompass={false}>` |
| `<Marker position icon={L.divIcon(html)} eventHandlers={{click, mouseover, mouseout}}>` | `<Marker longitude latitude onClick …>` with the same HTML as JSX children (same CSS classes; hover via React handlers) |
| `<Tooltip permanent direction="center" className="availability-tooltip">` | Plain `<div className="availability-tooltip">` inside the marker children (it's permanent → no popup machinery needed) |
| `MarkerClusterGroup` + `iconCreateFunction` averaging `marker.options.availability` | `supercluster` with `map`/`reduce` options aggregating availability; cluster rendered as a `<Marker>` with the same cluster HTML/classes |
| `useMap()` → `map.fitBounds(b, {padding:[50,50], maxZoom:12})`, `map.setView(c, z)` | `useMap()` (same hook name) → `map.fitBounds(b, {padding:50, maxZoom:12})`, `map.jumpTo({center, zoom})` |
| `useMapEvents({moveend, zoomend, load})` + `map.getBounds()/getZoom()` | `onMoveEnd`/`onZoomEnd`/`onLoad` props on `<Map>`; `getBounds()`/`getZoom()` identical |
| `bounds.pad(0.2)` / `bounds.contains([lat,lng])` | `LngLatBounds.contains()` exists; `pad` becomes a 5-line helper (or drop culling — supercluster already culls by bbox) |
| `L.LatLngBounds` type in 2 signatures | `LngLatBounds` type |

Known gotchas, planned for:

- **Coordinate order** flips to `[lng, lat]` — contained in the 6 rewritten files; `types.ts` marker models are our own and keep `lat`/`lng` fields.
- **`{s}`/`{r}` URL tokens** (subdomains/retina) are Leaflet-isms — only relevant on the raster route; handled by a URL array + devicePixelRatio pick.

### 7.1 The one functional gap: spiderfy

Today `spiderfyOnMaxZoom` fans out markers that share identical coordinates. supercluster doesn't spiderfy natively. Mitigation (pick during implementation): at max zoom, render co-located leaves in a small circular offset around the point (≈20 lines), or show a click-through list. Needs a product-side "good enough?" confirmation — flagged in Open questions.

### 7.2 Effort & sequence

~1 day map container/controller/viewport listener → ~2 days markers + clustering + cluster icon aggregation → ~1 day styles (nolabels/dark style JSON, attribution) → 1–2 days QA in the host app. **Total: roughly one sprint-week for one dev.**

### 7.3 Test plan (in the host app — the extract doesn't compile standalone)

1. `tsc --noEmit` + ESLint pass.
2. Manual drilldown: World → Country → (USA: State) → City → Store; breadcrumb navigation back up (incl. the state-breadcrumb recenter fix from 2026-06); LocationSwitcher filter sync both directions.
3. Visual diff vs. production: light + dark, marker colors per availability band, cluster averages, permanent tooltips, legend/breadcrumb overlay z-order.
4. Perf sanity on the largest estate (marker count at country level), zoom/pan smoothness.
5. Overlapping-store scenario for the spiderfy replacement.

---

## 8. Open questions for the team

1. **Does the company hold a CARTO Enterprise license?** Decides the tile route in §5 (licensed CARTO vs. OpenFreeMap). Ask legal/procurement.
2. Legal sign-off on the proposed license set (BSD-3, MIT, ISC) — expected trivial, but let's have it on record.
3. Attribution: confirm we re-enable the map attribution control (required by every OSM-derived tile source, including today's).
4. Product: is the §7.1 spiderfy replacement (offset fan-out or list) acceptable UX for co-located stores?
5. Ops appetite: if OpenFreeMap, are we comfortable with a donation-funded public tile instance, or do we want the self-host hedge from day one?

---

## References

- react-leaflet license (npm): Hippocratic-2.1 — https://www.npmjs.com/package/react-leaflet
- CARTO basemap terms: https://docs.carto.com/faqs/carto-basemaps and https://github.com/CartoDB/basemap-styles/blob/master/LICENSE.md
- MapLibre GL JS: https://maplibre.org / https://www.npmjs.com/package/maplibre-gl
- @vis.gl/react-maplibre: https://visgl.github.io/react-maplibre/ / https://www.npmjs.com/package/@vis.gl/react-maplibre
- supercluster: https://github.com/mapbox/supercluster
- OpenFreeMap: https://openfreemap.org
- Azure Maps pricing: https://azure.microsoft.com/en-us/pricing/details/azure-maps/
- Google Maps pricing: https://developers.google.com/maps/billing-and-pricing/overview
- Mapbox pricing: https://www.mapbox.com/pricing
- MapTiler pricing: https://www.maptiler.com/cloud/pricing/ · Stadia Maps pricing: https://stadiamaps.com/pricing/
