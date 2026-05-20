# Camping Packing App — Design Spec

**Status:** Draft
**Date:** 2026-05-20
**Author:** Yves (brainstormed with Claude)

---

## 1. Problem

Ein Freundeskreis plant ein Camping-Wochenende. Ohne Koordination werden Pavillons, Stirnlampen und Kaffeemaschinen mehrfach mitgeschleppt, andere Dinge fehlen ganz. Bestehende Apps (PackPoint, Lighterpack, AnyList) sind solo-zentriert; Group-Sharing ist meist view-only oder umständlich (Screenshot-Export, Copy-Paste). Die De-facto-Lösung in den meisten Gruppen ist heute ein Google Sheet — funktional, aber unsexy, kein Mobile-UX, keine Kommentare pro Item.

**Ziel:** Eine simple, mobile-first Web-App, in der eine kleine Gruppe sich abstimmt, **wer was mitbringt**.

## 2. Goals & Non-Goals

### Goals
- Friction-loses Joinen (Code/Link, kein Account-Zwang)
- Klare Sicht „Was wird mitgebracht / was fehlt"
- Pro Item: Wer bringt's, wie viele, Notizen, Kommentare
- Realtime-Sync zwischen Teilnehmenden
- Mobile-first, gut bedienbar mit Daumen

### Non-Goals (für MVP)
- Native Apps (iOS/Android)
- Push-Notifications
- Geteilte Kosten / Splitwise-Funktion
- Itinerary / Routenplanung
- AI-generierte Listen
- User-Accounts mit Passwort
- Permissions (jeder in einer Tour ist gleichberechtigt)
- Foto-Uploads pro Item
- Mehrsprachigkeit (nur DE im MVP)
- Offline-Modus (Online-only reicht für MVP)

## 3. UX-Recherche — Key Findings

| Quelle | Lesson |
|---|---|
| Splid (Splitting-App) | Kein Account, Group-Code, sofort drin. Niedrigste Hürde. |
| Lighterpack | „Email screenshots / copy-paste" ist die Schwäche → Realtime ist ein Differentiator. |
| PackPoint | Auto-Templates sind nett, aber Sharing nur view-only im Free-Tier. |
| AvantStay / Linzi Berry Guides | Best Practice ist: Group-Items 2+ Wochen vorher zuweisen, „kitchen staples" zentral. |
| Splitwise UX Case Study | Listen-first, Balances als Sekundäransicht. Übertragbar: Items-first, Statistik sekundär. |
| Reddit/Medium Camping-Threads | Google Sheet mit Spalten *Kategorie · Item · Wer · Status* dominiert. |

**Destilliertes Pattern:**
1. Items haben eine "Menge benötigt"-Spalte (z.B. 2 Pavillons), mehrere Personen können claimen.
2. Ein-Tap-Claim, keine Modals.
3. Kategorien flach halten (keine Verschachtelung).
4. Nicht blockieren — auch „doppelt" zusagen erlaubt, mit Hinweis.
5. Comments pro Item, nicht pro Liste.

## 4. Personas & Core Flow

### Personas
- **Initiator (Yves):** Legt Tour an, teilt Link in WhatsApp-Gruppe.
- **Buddy:** Klickt Link, gibt Namen ein, sieht Liste, claimt Items, fügt eigene hinzu.

### Happy Path
1. Initiator: `app.de` → „Neue Tour" → Name + Datum → bekommt Share-Link `app.de/t/ABC123`.
2. Initiator wählt Template „Camping-Wochenende" (optional) → Liste mit ~20 Items wird angelegt.
3. Initiator schickt Link in WhatsApp.
4. Buddy: klickt Link → „Wie heißt du?" → drin.
5. Buddy sieht Items, tippt auf „Zelt 4P", drückt „Ich bring eins" → claim sichtbar für alle in Realtime.
6. Buddy fügt eigenes Item hinzu: „Marshmallows" in Kategorie *Essen*.
7. Anderer Buddy kommentiert „bringst du auch Stäbchen mit?"
8. Bis zum Reisetag: Liste ist abgedeckt, niemand bringt das Vorhandene doppelt mit.

## 5. Datenmodell

```
trips
  id            uuid pk
  name          text
  date_from     date
  date_to       date
  location      text nullable
  join_code     text unique (6 alphanum, ohne 0/O/1/I)
  created_at    timestamptz
  created_by    uuid → participants.id (nullable)

participants
  id            uuid pk
  trip_id       uuid → trips.id
  name          text
  avatar_emoji  text  (default zufällig aus Pool: 🏕️🌲🔥🎒…)
  joined_at     timestamptz
  session_token text  (für Re-Identification über Cookie)

items
  id              uuid pk
  trip_id         uuid → trips.id
  name            text
  category        text  (enum: schlafen|kochen|essen|equipment|persoenlich|sonstiges)
  quantity_needed int   default 1
  note            text  nullable
  created_at      timestamptz
  created_by      uuid → participants.id

claims
  id             uuid pk
  item_id        uuid → items.id
  participant_id uuid → participants.id
  quantity       int default 1
  created_at     timestamptz
  unique(item_id, participant_id)  -- ein Claim pro Person/Item, aber quantity > 1 möglich

comments
  id              uuid pk
  item_id         uuid → items.id
  participant_id  uuid → participants.id
  text            text
  created_at      timestamptz
```

**RLS-Strategie:** Eine Postgres-Funktion `current_trip_id()` liest den `session_token` aus dem Cookie, looked up `participant.trip_id` und gibt die zurück. Alle Tabellen haben Policy `trip_id = current_trip_id()`.

## 6. Architektur

```
┌────────────────────────────────────────┐
│  Browser (Mobile-First PWA)            │
│  Next.js 15 App Router                 │
│  ├─ Server Components für Initial Load │
│  ├─ Server Actions für Mutations       │
│  └─ Realtime Subscriber (Supabase JS)  │
└────────────────┬───────────────────────┘
                 │ HTTPS + WSS
                 ▼
┌────────────────────────────────────────┐
│  Supabase                              │
│  ├─ Postgres (Daten + RLS)             │
│  ├─ Realtime (Channels pro Trip)       │
│  └─ Auth-Anon-Key (kein Login nötig)   │
└────────────────────────────────────────┘
                 ▲
                 │
┌────────────────────────────────────────┐
│  Coolify (Just Ship Cloud)             │
│  Deployment via Docker                 │
└────────────────────────────────────────┘
```

**Stack im Detail:**
- **Frontend:** Next.js 15 (App Router), TypeScript strict, TailwindCSS, shadcn/ui für Komponenten-Basics.
- **State:** Server Components + Server Actions; clientseitig minimaler State via React Hooks. Realtime-Subscription invalidiert React-Query-Cache (oder Router-Refresh).
- **Backend:** Supabase (Postgres + Realtime + Storage falls später Fotos).
- **Auth:** Kein klassischer Login. Beim Trip-Join wird ein `participant`-Row angelegt und ein `session_token` als HTTP-only Cookie gesetzt. Cookie + Trip-Code = Identität. Verloren = neuer Name beim nächsten Mal.
- **Hosting:** Coolify auf Just Ship Cloud (passt zu deinem Setup, Vercel bewusst nicht).
- **Deployment:** Dockerfile multi-stage, Coolify pulls aus GitHub.

## 7. Komponenten / Module

Kleine, klar abgegrenzte Bausteine — jede Datei hat einen Zweck:

```
app/
  page.tsx                       Landing (Tour anlegen / beitreten)
  t/[code]/page.tsx              Trip-Hauptansicht
  t/[code]/join/page.tsx         Name-Eingabe für neue Teilnehmer
  api/                           (nur Webhooks falls je nötig — sonst Server Actions)

components/
  ItemCard.tsx                   Einzelnes Item mit Claim-Avatare + Counter
  ItemSheet.tsx                  Bottom-Sheet mit Details, Claim, Comments
  CategorySection.tsx            Collapsible Kategorie-Block
  AddItemFAB.tsx                 Floating Action Button
  ParticipantAvatars.tsx         Header-Avatar-Stack
  ShareButton.tsx                Copy-Link + Native Share API
  Filter.tsx                     Tabs: Alle / Offen / Meine

lib/
  supabase/server.ts             Server-Client (Service-Role für Setup)
  supabase/browser.ts            Browser-Client (Anon-Key)
  realtime.ts                    Channel-Subscription-Hook
  session.ts                     Cookie-Lese/Setz-Logic
  codes.ts                       Join-Code Generator (avoid lookalikes)
  templates.ts                   Vordefinierte Listen (Camping-Wochenende)

server-actions/
  trips.ts                       createTrip, joinTrip
  items.ts                       addItem, updateItem, deleteItem
  claims.ts                      claimItem, unclaimItem
  comments.ts                    addComment, deleteComment

db/
  migrations/                    SQL via Supabase CLI
```

**Boundaries-Check:**
- `lib/supabase/*` kennt Supabase, sonst nichts.
- `server-actions/*` kennt DB und Business-Rules, gibt typisierte Results zurück.
- `components/*` kennt UI, ruft Server-Actions auf, kennt keine DB.
- Realtime-Hook liegt isoliert in `lib/realtime.ts`, kann ohne UI getestet werden.

## 8. UX / Visual Design

### Layout-Prinzipien
- **Single-Column** auf Mobile (< 640px), max-width 720px auf Desktop.
- Sticky Header mit Tour-Info + Avatare.
- Sticky Filter-Tabs unterhalb des Headers.
- Floating-Action-Button (FAB) unten rechts für „+ Item".
- Bottom-Sheet (nicht Modal) für Item-Details — daumenfreundlich.

### Item-Card (das wichtigste UI-Element)
```
┌─────────────────────────────────────────┐
│ 🛏️  Schlafsack                    💬 2 │
│ 1 / 4 zugesagt   👤👤              [+] │
└─────────────────────────────────────────┘
```
- Icon = Kategorie-Emoji
- Avatare = Claimer
- Counter „1 / 4 zugesagt" = Mengen-Indikator
- `[+]` = Quick-Claim ohne Sheet öffnen
- 💬 2 = Kommentar-Counter

### Farb-/Tonalität
- Hell + freundlich, kein Corporate-Look.
- Akzentfarbe: Camping-Orange (#F97316) oder Lagerfeuer-Rot — wird in der Implementierungsphase festgelegt.
- Dark Mode: ja, via System-Preference.

### Touch-Targets
- Min 44×44px pro Studio. Buttons mit ausreichend Padding.
- Swipe-to-Delete für eigene Items (mit Undo-Toast).

### Empty States
- Leere Liste: „Noch keine Items. Tipp auf + um was hinzuzufügen, oder wähle eine Vorlage."
- Keine Claims: subtiler Hinweis-Banner „2 Items hat noch niemand zugesagt — fehlt eine Stirnlampe?"

### Templates
Eine eingebaute Vorlage „Camping-Wochenende" mit:
- *Schlafen:* Zelt 4P, Schlafsack, Isomatte, Kopfkissen
- *Kochen:* Gaskocher, Topf, Pfanne, Geschirr, Besteck
- *Essen:* Wasser, Frühstück, Snacks
- *Equipment:* Pavillon, Stirnlampen, Feuerzeug, Müllsäcke, Klappstuhl
- *Persönliches:* (bewusst leer — bringt jeder selbst)

Weitere Templates (Festival, Wandern) bewusst NICHT im MVP.

## 9. Error Handling & Edge Cases

| Fall | Verhalten |
|---|---|
| Join-Code nicht gefunden | Inline-Fehler „Diesen Code gibt's nicht. Schau nochmal." |
| Cookie verloren / neuer Browser | User wird neu nach Namen gefragt, neuer Participant-Row. Claims des alten gehen verloren. (Toleriert im MVP.) |
| Realtime-Disconnect | Banner „Verbindung verloren. Tippe zum Neuladen." Polling-Fallback alle 30s. |
| Race auf gleiches Item | Postgres-`unique(item_id, participant_id)` verhindert Doppel-Claim derselben Person. Mehrere Personen claimen ok — das ist Feature, nicht Bug. |
| Quantity-Übersicht | Wenn zugesagt > benötigt: kleines „Schon abgedeckt"-Badge, kein Block. |
| Item gelöscht während Sheet offen | Sheet schließt sich mit Toast „Item wurde gelöscht". |
| Sehr alte Trips | Auto-Cleanup nach 6 Monaten via Cron (Supabase Edge Function, später). Für MVP nicht nötig. |
| Falsche Sprache im Browser | UI fest deutsch. |

## 10. Testing-Strategie

- **Unit:** `lib/codes.ts`, `lib/session.ts`, `lib/templates.ts` — pure Funktionen, Vitest.
- **Component:** ItemCard, ItemSheet — React Testing Library mit Mock-Daten.
- **Integration:** Server-Actions gegen Test-Supabase-Schema (lokales `supabase start`), Vitest oder Playwright API-Tests.
- **E2E:** 1 Smoke-Test in Playwright — „Trip anlegen, joinen, Item claimen, sehen" — auf Mobile-Viewport.
- **Manuelles QA:** Auf echtem Phone (Yves + ein Buddy) vor Reisetag.

Coverage-Ziel: keine harte Schwelle, aber Server-Actions zu ≥ 80%.

## 11. Open Questions / Punkte zur Klärung später

Nicht blockierend für die Implementierung, aber zu klären, wenn relevant:

- **Branding/Name:** Heißt die App einfach „Camping Packen" oder bekommt sie einen Eigennamen?
- **Domain:** Subdomain unter `yvesschleich.com` oder eigene? (Vorschlag: `packen.yvesschleich.com` als Default.)
- **Login-Persistenz:** Magic-Link via E-Mail als Opt-in für „mehrere Trips merken"? — fürs MVP nicht, später denkbar.
- **Templates erweitern:** Festival, Wandern, Skiurlaub — wenn die App über deine eine Tour hinaus genutzt wird.

## 12. Deferred / Aus Scope

Bewusst weggeschoben, aber Architektur lässt es zu:
- Foto-Upload pro Item (Storage-Bucket vorbereitet)
- Mehrere Trips pro User (via Magic-Link Account)
- Push-Notifications (Web-Push API)
- Festival/Wandern-Templates
- Export als PDF / Druck-Ansicht
- i18n (en, fr)

## 13. Done-Definition für den MVP

Die App ist fertig, wenn diese User Stories durchlaufen:

1. ✅ Ein User legt auf seinem Phone eine Tour an und bekommt einen Share-Link.
2. ✅ Ein zweiter User öffnet den Link, gibt seinen Namen ein, sieht die Liste.
3. ✅ Beide User claimen Items, sehen die Claims des anderen in < 2 Sekunden.
4. ✅ Jeder kann Items hinzufügen, eigene Items löschen.
5. ✅ Jeder kann auf ein Item kommentieren, alle sehen den Kommentar in Realtime.
6. ✅ Beim Re-Open im selben Browser bleibt die Identität erhalten (Cookie).
7. ✅ Mindestens eine eingebaute Vorlage „Camping-Wochenende" funktioniert.
8. ✅ Deployment läuft auf Coolify mit eigener Subdomain.
9. ✅ Mobile Safari + Chrome Android getestet.

Wenn diese 9 Punkte stehen, fahren wir Campingplatz an.
