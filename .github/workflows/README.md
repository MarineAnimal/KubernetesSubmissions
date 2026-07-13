# CI/CD pipeline

GitHub Actions workflows that build and deploy the_project to GKE. These are the
deliverables for exercises 3.6, 3.7 and 3.8.

## main.yaml, build and deploy per branch (3.6, 3.7)

Runs on every push to a branch other than main. It builds the_project image tagged
`<branch>-<sha>`, pushes it to Artifact Registry, then deploys with Kustomize into a
namespace named after the branch (dots become dashes). 3.6 set up the build, push
and deploy pipeline, 3.7 made it deploy each branch into its own namespace, so every
branch gets an isolated environment in the cluster.

## cleanup.yaml, tear down on branch delete (3.8)

Runs on the branch delete event and removes the namespace that matched the deleted
branch, so old environments don't pile up. It refuses to delete the main branch's
namespace.

## gitops-staging.yaml and gitops-production.yaml (4.8, 4.9)

Added later for the GitOps exercises. Staging deploys on every push to main,
production on tagged commits. The manifests live in the separate config repo, ArgoCD
syncs them to the cluster.

## Auth

All workflows authenticate to GKE with Workload Identity Federation, no long-lived
service account keys. The project id, cluster, service account and provider come from
repository secrets.
