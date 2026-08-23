# ViraSquare Continuation and GitHub Workflow

ViraSquare is maintained in this managed workspace as the authoritative working copy during continued product development. The public site remains in preview until the core product features are complete and a deliberate launch decision is made.

## Development loop

Use the managed project preview to review each change. The project includes the following verification commands:

| Command | Purpose |
|---|---|
| `pnpm test` | Runs the application’s automated behavior tests. |
| `pnpm check` | Runs the TypeScript type check. |
| `pnpm build` | Creates a production-ready build. |

## GitHub handoff

The connected repository is **[Maximummcody/VIRASQUARE](https://github.com/Maximummcody/VIRASQUARE)**. The verified managed-workspace checkpoint has been pushed to its `main` branch.

For each future requested build step, first confirm the preview, test suite, type check, and production build. After saving a managed checkpoint, push that same verified `main` revision to the repository. This preserves a matching history in both the managed workspace and GitHub without publishing the website.

## Product-change safeguard

Before implementing a correction, determine whether it would materially change an existing workflow outside the feature the user asked to adjust. If it would, explain the affected existing workflow and the proposed impact in plain language, then obtain explicit user approval before making that broader change. Do not treat a resilience measure, simplification, or adjacent “improvement” as permission to change the product direction. The full working rule is maintained in [PRODUCT_CHANGE_GUARDRAILS.md](./PRODUCT_CHANGE_GUARDRAILS.md).

## Preserved product foundation

The managed project retains the existing public ViraSquare landing page, managed sign-in entry point, business-profile onboarding, personalized daily-content workspace, weekly planning, content ideation, post generation, completion tracking, and supporting data model. Future feature requirements from the product brief should extend this foundation rather than replace it.
