# Exercise 5.8 CNCF Cloud Native Landscape

Landscape: https://landscape.cncf.io/

**Deliverable:** the landscape image with two colors of circles + this list.
- **RED, directly used** things I know I was using (in this course or outside it).
- **GREEN, indirect dependencies** things that something I used depended on

"Part N" = the course chapter/exercise where it was used.

----------------------------------------------------------------------------------------------

## RED directly used (15 circled)

1. **Kubernetes**  the entire course; every exercise runs on it.
2. **Docker**  built and ran all container images (`docker build`); the DevOps with
   Docker prerequisite; Docker Desktop also hosted a local cluster in part 5.
3. **Helm**  installed Prometheus / Kiali and other charts (part 2; part 5).
4. **k3s** (Rancher), the lightweight Kubernetes distro behind my k3d cluster
   (parts 5.6–5.7).
5. **Google Kubernetes Engine (GKE)**, the cloud cluster used in parts 3–4.
6. **Google Cloud**  the cloud platform hosting GKE (parts 3–4).
7. **NGINX**, the ingress controller that routed `/log` and `/pingpong`
   in chapters 1–2 (my Ingress manifests use `ingressClassName: nginx`).
8. **PostgreSQL**  the project's database, ping-pong counter (part 4).
9. **NATS**  messaging between the backend and the broadcaster (part 4).
10. **Argo**  Argo CD for GitOps deployment **and** Argo Rollouts for canary
    releases with a Prometheus AnalysisTemplate (part 4). (One "Argo" card.)
11. **Prometheus**  metrics for the Argo Rollouts analysis (part 4) and the
    monitoring baseline for Kiali (part 5.2).
12. **Grafana**  dashboards in the part 4 monitoring exercise.
13. **Istio**  service mesh in ambient mode (parts 5.2–5.3).
14. **Kiali**  service-mesh observability / traffic graph (parts 5.2–5.3).
15. **Knative**  the serverless platform (parts 5.6–5.7).

## GREEN indirect dependencies (6 circled; not already red)

1. **containerd**  the container runtime under Docker, k3s/k3d, and GKE. Actually ran
   every container I deployed.
2. **CoreDNS**  in-cluster DNS in every cluster; resolved names like
   `pingpong.exercises.svc.cluster.local` and `greeter-svc`.
3. **etcd**  the Kubernetes datastore used by GKE and the Docker Desktop (kind)
   cluster. (My k3s clusters use SQLite/kine instead, so etcd applies to GKE / kind.)
4. **Flannel**  the default CNI (pod networking) in k3s/k3d.
5. **Envoy**  the proxy data plane under both Istio (waypoint/ingress) and Kourier
   (Knative gateway); every mesh and serverless request passed through it.
6. **gRPC**  control-plane communication inside Kubernetes, Istio, and Knative.

-----------------------------------------------------------------------------------------

## Used but not on the landscape 

These were used but have no standalone logo on the landscape, so they aren't circled:

- **k3d**  wrapper that runs k3s in Docker; created the local Knative cluster (parts 5.6–5.7). Only the k3s card exists on the landscape.
- **Kourier**  the Knative networking layer (parts 5.6–5.7); ships as part of Knative net.
- **Gateway API**  `HTTPRoute` traffic splitting in the mesh (part 5.3); a Kubernetes
  SIG spec, not a product card.
- **runc**  the OCI runtime containerd calls; one level deeper than containerd.
  Left out to keep the image meaningful (as the exercise suggests).

## Anything outside the course
*(None, since every tool above was used within this course.)*
