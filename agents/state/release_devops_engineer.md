# Current State — Release / DevOps Engineer

Current assignment: None (direct alarm #26 merged; preview of main deployed, #28).
Recent important decision: Per-role `wake:<role>` alarm labels + SessionStart hook (owner-approved). Previews are manual `vercel deploy` from the linked main checkout until Git is connected.
Blocker: Owner must grant the Vercel GitHub app access to the private repo for automatic per-PR previews.
Relevant issue/PR: #24, #26, #28
Wake me: `npm run alarm release-devops-engineer <#> "<reason>" <your-role>` (label `wake:devops`).
Next expected action: Once Git is connected, rely on Vercel's PR preview comments; otherwise deploy previews on request.
