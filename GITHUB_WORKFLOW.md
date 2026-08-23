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

When you are ready to create or update a GitHub repository, open the project’s **Settings → GitHub** panel and authorize GitHub if prompted. You can then export the current project to a repository under the selected GitHub account or organization.

Use that repository as the external history and collaboration copy for ViraSquare. Before each planned external handoff, confirm the preview, test suite, type check, and build are green, then export the latest project revision. Do not publish the website merely to create a GitHub copy.

## Preserved product foundation

The managed project retains the existing public ViraSquare landing page, managed sign-in entry point, business-profile onboarding, personalized daily-content workspace, weekly planning, content ideation, post generation, completion tracking, and supporting data model. Future feature requirements from the product brief should extend this foundation rather than replace it.
