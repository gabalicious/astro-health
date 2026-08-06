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

- `pnpm test` — Vitest over `src/lib/**/*.test.ts`: the schema (unit
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

1. `/signup/{vue,svelte}` posts `/api/signup`, which creates the user and sets an
   http-only session cookie, then redirects to…
2. `/onboarding/{vue,svelte}`, which posts `/api/onboarding`. That route is
   behind `requireSession`, so a profile always belongs to somebody.

- `src/lib/schema/account.ts` — email and password, nothing else.
- `src/lib/schema/profile.ts` — the onboarding answers. Numeric
  fields are strings on the way in (that is what a DOM input gives you) and
  numbers on the way out, so the schema is also the parse boundary. Client and
  server both use it.
- That boundary is also where **units** are resolved. The wire carries what the
  user typed plus their chosen `unitSystem`; ranges are checked in *their* units
  so messages say "at most 880" to someone entering pounds, and `z.output` is
  canonical metric (`heightCm`, `weightKg`). A `preprocess` step blanks out
  measurements the unit system or goal makes irrelevant, so the API never
  rejects a value it is about to discard.
- `src/lib/forms/types.ts` — framework-agnostic `FieldConfig` / `StepConfig` /
  `WizardConfig`, plus `visibleFields`, `stepIndexOfField` and `errorMessages`,
  which both renderers share.
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
- `src/server/store.ts` — in-memory users, sessions and profiles. It resets on
  restart, and passwords are deliberately not stored until hashing lands with a
  real database.
- `src/server/` — the Hono app, mounted at `src/pages/api/[...path].ts`. It owns
  the `/api` prefix via `.basePath('/api')` because Astro forwards the original
  URL untouched.

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
