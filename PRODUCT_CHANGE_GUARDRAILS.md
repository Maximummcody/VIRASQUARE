# ViraSquare Product Change Guardrails

## Preserve the existing workflow

When a user requests a correction or refinement to one part of ViraSquare, treat the pre-existing workflow in adjacent parts of the product as stable. A correction to feature **B** must not materially change the intended workflow of feature **A** merely because the two are connected.

Before making a change that could alter an existing workflow, the implementation must explain the impact in plain language, identify the affected workflow, and request approval. This applies even when the proposed change appears to be an improvement, a resilience measure, or a simplification.

## Allowed implementation without workflow approval

Targeted defect fixes, copy corrections, accessibility repairs, narrow performance fixes, and error handling that preserve the current user flow may proceed. Any wider product behaviour change requires explicit approval first.

## Support-channel timing

ViraSquare-owned support channels should be designed when the product is approaching real-user operations and there is enough user volume, support demand, or operational complexity to justify a support workflow. This is a future product milestone, not an automatically scheduled feature.
