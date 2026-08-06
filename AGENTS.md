## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

Restart the dev server after installing packages — Vite's dependency
pre-bundling goes stale and islands fail to hydrate with `504 Outdated
Optimize Dep`.

Checks: `pnpm check` (Biome lint + format), `pnpm typecheck` (`astro check`),
`pnpm build`, `pnpm test` (Vitest), `pnpm e2e` (Playwright).

`pnpm typecheck` runs three checkers, because each only covers its own files:
`astro check` (.astro), `vue-tsc` (.vue) and `svelte-check` (.svelte, via
`tsconfig.svelte.json`, which excludes the Vue components it cannot resolve).
Checking only `.astro` would leave most of the app untyped.

`astro check` needs TypeScript 6.x; TypeScript 7's native compiler does not yet
expose the API it relies on, so the devDependency is pinned to `^6`.

## Testing

- `pnpm test` — Vitest over `src/lib/**/*.test.ts` (the `@/*` alias is mirrored
  in `vitest.config.ts`; Vitest does not read tsconfig paths on its own): the schema (unit
  conversion, required-when rules, `clearInapplicable`) and the plan math
  (`computePlan` anchors are hand-computed — if you change a constant, recompute
  them, do not fudge the assertions).
- `pnpm e2e` — Playwright (`e2e/`). It builds and serves the app itself on
  **port 4322** (never 4321, so a live dev server can't be mistaken for the
  built app). Full matrix of {vue,svelte} × {metric,imperial} plus regressions:
  the stale-error single-click bug, anon onboarding rejected, duplicate email,
  conditional fields, back/forward persistence.
- e2e gotchas learned the hard way: wait for `astro-island:not([ssr])` before
  interacting (Astro drops the `ssr` attribute after hydration — clicks before
  that are no-ops), and use `\s+` rather than `.` in text regexes (Svelte keeps
  template newlines in text nodes; Vue's compiler condenses them).
- CI (`.github/workflows/ci.yml`) runs check → typecheck → test → build → e2e.

## Architecture

Signup happens in **two phases**: create the account, then onboard. Both are
schema-driven configs rendered by one generic wizard per framework, so the Vue
and Svelte versions can be compared on equal footing. Nothing is duplicated
between them except the rendering layer.

1. `/signup/{vue,svelte}` posts `/api/signup`, which creates the user (scrypt
   password hash, per-user salt — stub-grade, not production auth) and sets an
   http-only session cookie, then redirects to…
2. `/onboarding/{vue,svelte}`, which posts `/api/onboarding`. That route is
   behind `requireSession`, so a profile always belongs to somebody.
3. `/login/{vue,svelte}` posts `/api/login` (verifyCredentials, constant-time
   compare; failures are deliberately **form-level** — "Wrong email or
   password." never blames a field). The response's `onboarded` flag routes the
   redirect: no profile → onboarding, otherwise → settings. "Remember me"
   stretches the session from 7 to 30 days. `/api/logout` clears both the store
   row and the cookie.
4. `/settings/{vue,svelte}` fetches `GET /api/profile` on mount (401 → login,
   404 → onboarding), converts the canonical payload back to a draft with
   `draftFromProfile`, and renders **the same onboarding config** through
   `FormWizard mode="single"`: every step becomes a section, one Save button,
   gated on TanStack's `isDefaultValue` so it stays disabled until something
   actually changed. Saving posts `/api/profile` and shows the recomputed plan.

- `src/lib/schema/account.ts` — email and password, nothing else.
- `src/lib/schema/profile.ts` — the onboarding answers. Numeric
  fields are strings on the way in (that is what a DOM input gives you) and
  numbers on the way out, so the schema is also the parse boundary. Client and
  server both use it.
- `draftFromProfile` is the **inverse** of that boundary, for prefilled edit
  forms. Its one subtlety: total inches are rounded to one decimal *before* the
  ft/in split — splitting first lets 91.4 cm (a stored 3'0") decompose as an
  invalid 2'12". Round-trip tests pin this.
- That boundary is also where **units** are resolved. The wire carries what the
  user typed plus their chosen `unitSystem`; ranges are checked in *their* units
  so messages say "at most 880" to someone entering pounds, and `z.output` is
  canonical metric (`heightCm`, `weightKg`). A `preprocess` step blanks out
  measurements the unit system or goal makes irrelevant, so the API never
  rejects a value it is about to discard.
- `src/lib/forms/types.ts` — framework-agnostic `FieldConfig` / `StepConfig` /
  `WizardConfig`, plus `visibleFields`, `stepIndexOfField`, `errorMessages`,
  `groupErrorMessages`, `validationNames`, `rowFieldName` and `cloneDraft`,
  which both renderers share.
- `src/lib/schema/numeric.ts` — the string-in/number-out helpers (`numeric`,
  `optionalNumeric`, `round1`) shared by the profile and workout schemas.
- `src/data/exercises.json` + `src/lib/data/exercises.ts` — the seeded exercise
  catalogue. The workout config derives its picker options from it, so the data
  drives the form rather than the form hard-coding the data.
- `src/lib/forms/signup-form.ts` and `src/lib/forms/onboarding-wizard.ts` — the
  step and field definitions. **Adding or reordering a field means editing only
  one of these plus its schema; both frameworks pick it up.**
- `src/lib/plan.ts` — pure plan math (Mifflin-St Jeor BMR → TDEE → calorie
  target with safety floors → macros → timeline). No dates, no IO; the server
  computes it in `/api/onboarding` and returns it, and each framework's
  `PlanCard` renders it via the `FormWizard` success slot/snippet.
  `prefer_not_to_say` uses the midpoint sex term (−78). Timelines come from the
  post-floor *effective* deficit, so a floored plan honestly shows more weeks
  than the requested rate implies.
- `src/components/{vue,svelte}/` — per framework: a `FieldRenderer` (one field),
  a generic `FormWizard` (steps, navigation, submit — it drops the step chrome
  when a config has a single step, so the same engine renders both flows), and
  thin `SignupForm` / `OnboardingWizard` wrappers binding config to endpoint.
- `src/server/store.ts` — in-memory users, sessions, profiles and workouts. It resets on
  restart. Passwords are scrypt-hashed with per-user salts and compared in
  constant time — stub-grade, but never plaintext.
- `src/server/` — the Hono app, mounted at `src/pages/api/[...path].ts`. It owns
  the `/api` prefix via `.basePath('/api')` because Astro forwards the original
  URL untouched.

### Repeaters (field arrays)

`/workouts/{vue,svelte}` logs one exercise with N sets, and is the only flow
with a repeated group. What it changed:

- Draft values widened from `Record<string, string>` to **`DraftValues`**
  (`Record<string, string | DraftRow[]>`). `FieldConfig` is now a discriminated
  union of `ScalarFieldConfig | RepeaterFieldConfig`; a repeater declares its
  row shape via `itemFields` + `itemDefaults`.
- TanStack addresses rows **by index**: `sets[2].reps` — brackets for indices,
  dots for keys. `sets.2.reps` is not a valid path. Build names only with
  `rowFieldName`; string concatenation loses the template-literal type.
- Because names are index-derived, `{#each}` / `v-for` over rows is keyed **by
  index**, not by a synthetic id — DOM identity has to follow position or a
  removal leaves a row bound to its old neighbour's name. The e2e "removes the
  middle row" test exists to prove this per framework.
- `FieldRenderer` takes an optional `name` prop that overrides the bound path,
  and **the DOM id follows it too** — otherwise every row renders `id="reps"`
  and the ids collide.
- Add uses `{ ...field.itemDefaults }`; forms are seeded through `cloneDraft`.
  Both exist so rows never alias one shared object. `cloneDraft` rather than
  `structuredClone`, which throws on the reactive proxies both frameworks hand
  back.
- `mode="array"` on the parent `form.Field` is a subscription switch (it watches
  `meta._arrayVersion`), so the group re-renders on add/remove but not on every
  keystroke inside a row.
- A Zod array schema reports its rows' problems too. `groupErrorMessages` keeps
  only path-less issues for the group-level slot, since row issues are already
  rendered under the offending input.
- `fieldErrorsFromIssues` (`src/lib/schema/errors.ts`) folds Zod paths into the
  same names the client binds (`sets[1].reps`). `z.flattenError` only reaches
  the top level and would file every row error under `sets`; flat routes still
  use it because for them the output is identical.

Conventions worth keeping:

- Field metadata lives in config, not in Zod introspection — UI concerns
  (radio-cards vs select, option copy, conditional display) do not belong in the
  schema.
- One TanStack Form instance spans all steps, so back/forward navigation
  preserves answers and there is a single submit.
- Conditional fields are "required when visible": `showIf` governs both display
  and validation on the client. The server re-derives the same rule in
  `signupSchema`'s cross-field check, since it cannot trust UI state. Unit
  variants use nothing more than this — `heightCm` and `heightFt`/`heightIn` are
  ordinary fields with opposite `showIf`s, and the wizard's existing reset of
  hidden fields keeps the unused pair empty.
- `FormWizard`'s `initialValues` prop is read **once** at form creation —
  callers must gate rendering until the fetch completes (see `SettingsForm`).
- The `checkbox` field kind keeps drafts all-string: checked is `'true'`,
  unchecked is `''`. It is also the one kind that labels to the right.
- In Svelte components never name a variable `state` — `$state` then parses as
  a store subscription to it.
- Fields declare **exactly one** validator cause (`onChange`). Declaring several
  leaves stale entries in TanStack's error map — `validateField(_, 'submit')`
  fills every declared cause, but typing only clears `onChange`, so a lingering
  `onBlur` error on a never-blurred field both shows a wrong message and blocks
  the next click. For the same reason the step gate reads `validateField`'s
  return value rather than the field's aggregated meta.
- Errors surface once a field has been blurred or the user has tried to advance,
  then update live — see `isBlurred` / `stepAttempted` in the renderers.
- Each stack keeps its own UI kit beside its renderer: `src/components/vue/ui`
  (shadcn-vue, generated — excluded from linting) and `src/components/svelte/ui`
  (hand-written Bits UI wrappers). Both are styled from the same CSS variables
  in `src/styles/global.css`. `components.json` points the shadcn-vue CLI at
  `@/components/vue/ui`, so `pnpm dlx shadcn-vue@latest add <x>` stays in place.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
