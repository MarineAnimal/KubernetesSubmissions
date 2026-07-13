# DevOps with Kubernetes 2026

My exercise submissions for the University of Helsinki
[DevOps with Kubernetes](https://devopswithkubernetes.com/) course.

Each link points to the exercise's release tag and the relevant folder. The course
project (the todo app) lives in [the_project](the_project). From chapter 4 onward the
Kubernetes configuration is split into a separate GitOps repo,
[KubernetesSubmissions-config](https://github.com/MarineAnimal/KubernetesSubmissions-config).

## Chapter 1, the basics

- [1.1.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/1.1/log_output)
- [1.2.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/1.2/1.2)
- [1.3.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/1.3/1.3)
- [1.4.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/1.4/1.4)
- [1.5.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/1.5/1.5)
- [1.6.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/1.6/1.6)
- [1.7.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/1.7/1.7)
- [1.8.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/1.8/1.8)
- [1.9.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/1.9/1.9)
- [1.10.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/1.10/1.10)
- [1.11.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/1.11/1.11)
- [1.12.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/1.12/1.12)
- [1.13.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/1.13/1.13)

## Chapter 2, ConfigMaps, StatefulSets, monitoring

- [2.1.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/2.1/2.1)
- [2.2.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/2.2/2.2)
- [2.3.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/2.3/2.3)
- [2.4.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/2.4/2.3/2.3-fixed) (2.3 covers both 2.3 and 2.4, same folder)
- [2.5.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/2.5/2.5)
- [2.6.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/2.6/2.6)
- [2.7.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/2.7/2.7)
- [2.8.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/2.8/2.8)
- [2.9.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/2.9/2.9)
- [2.10.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/2.10/2.10)

## Chapter 3, GKE, Ingress, Gateway API, GitOps pipeline

- [3.1.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/3.1/3.1-pingpong-gke)
- [3.2.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/3.2/3.2-log-output-pingpong-ingress)
- [3.3.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/3.3/3.3-to-the-gateway)
- [3.4.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/3.4/3.4-route-rewrite)
- [3.5.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/3.5/3.5-project-kustomize)
- [3.6.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/3.6/.github/workflows) automatic deploy pipeline for the_project
- [3.7.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/3.7/.github/workflows) per branch deployment environments
- [3.8.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/3.8/.github/workflows) delete the namespace when a branch is deleted
- [3.9.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/3.9/the_project) DBaaS vs DIY comparison, written in the project readme
- [3.10.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/3.10/the_project) database backup CronJob to Google Object Storage
- [3.11.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/3.11/the_project) resource requests and limits
- [3.12.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/3.12/the_project) GKE monitoring, logs screenshot

## Chapter 4, probes, monitoring, canary, messaging, GitOps

- [4.1.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/4.1/the_project) readiness and liveness probes
- [4.2.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/4.2/the_project) liveness probe that restarts a broken pod
- [4.3.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/4.3/the_project) Prometheus monitoring
- [4.4.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/4.4/the_project) Argo Rollouts canary with a Prometheus analysis
- [4.5.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/4.5/the_project) mark todos done
- [4.6.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/4.6/the_project) broadcaster, NATS messaging to Discord
- [4.7.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/4.7/the_project) log-output under GitOps, config in the [config repo](https://github.com/MarineAnimal/KubernetesSubmissions-config/blob/main/base/deployment-log-output.yaml)
- [4.8.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/4.8/the_project) project under GitOps, config in the [config repo base](https://github.com/MarineAnimal/KubernetesSubmissions-config/tree/main/base)
- [4.9.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/4.9/the_project) staging and production split: [staging overlay](https://github.com/MarineAnimal/KubernetesSubmissions-config/tree/main/overlays/staging), [production overlay](https://github.com/MarineAnimal/KubernetesSubmissions-config/tree/main/overlays/production)
- [4.10.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/4.10/the_project) code and config in separate repos: [config repo](https://github.com/MarineAnimal/KubernetesSubmissions-config)

## Chapter 5, operators, service mesh, serverless

- [5.1.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/5.1/5.1) DIY CRD and controller, the DummySite operator
- [5.2.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/5.2/5.2) getting started with the Istio service mesh
- [5.3.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/5.3/5.3) log app on the service mesh, 75/25 traffic split
- [5.4.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/5.4/5.4) Wikipedia with init and sidecar containers
- [5.5.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/5.5/5.5) platform comparison essay, Rancher vs OpenShift
- [5.6.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/5.6/5.6) trying serverless with Knative
- [5.7.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/5.7/5.7) deploy ping-pong to serverless
- [5.8.](https://github.com/MarineAnimal/KubernetesSubmissions/tree/5.8/5.8) CNCF Cloud Native Landscape
- 5.9. the repo link, this repository
