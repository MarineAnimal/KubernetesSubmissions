# Database, DBaaS vs self-hosted

When deplying a database on kubernetes, there are two main options. This is a comparison of two approaches to running a database for this project on GKE. A managed **Database as a Service**(DBaas for short), like Google cloud SQL vs a self-hosted, DIY database running as a Kubernetes workload (e.g. a PostgreSQL Deployment/StatefulSet backed by a PersistentVolumeClaim, similar to how this project already runs its image cache).

The main difference is that with Dbaas in this case, google handles most of the operations. In the case of a diy database you're responsible for configuration, maintenance and recovery.

### Initial setup

**DBaaS, google cloud sql**
1. Provisioned in minutes via `gcloud sql instances create` or the console. no YAML, no container image to choose, no storage sizing decisions beyond a disk size field.
2. Networking (private IP / VPC peering, or Cloud SQL Auth Proxy for public IP) needs a one-time setup, but is well documented and mostly point and click.
3. Version, HA topology (single zone vs regional), and storage type are simple dropdown choices.

**DIY, self-hosted in the cluster**
1. Requires writing and maintaining the Deployment/StatefulSet, Service, PVC, Secret (for credentials), and often a ConfigMap for the database configuration file, several manifests to get right versus none.
2. Choosing the right access mode (`ReadWriteOnce` typically, since most databases don't support concurrent writers) and StorageClass is on the user.
3. Achieving high availability (replication, failover) is significantly more work, this usually means adopting a Kubernetes Operator (e.g. Zalando's Postgres Operator, CloudNativePG) rather than a bare Deployment, which adds another moving part to learn and trust.

**Verdict!:** DBaaS wins clearly on time-to-first-database. DIY's setup cost is proportional to how much reliability you want, a single-pod database is nearly as fast to stand up as Cloud SQL, but a genuinely production-grade HA setup takes significant amount of time and engineering effort.


### Ongoing maintenance

**DBaaS**
1. Google handles OS patching, database engine minor-version updates, and underlying hardware failures transparently.
2. Storage autoresize is available so a full disk doesn't cause an outage.
3. Monitoring/metrics are built in (Cloud Monitoring integration) without extra setup.

**DIY**
1. The team is responsible for image updates, applying security patches, and testing upgrades before rolling them out. This is the same operational burden as running any other stateful service.
2. A node failure or eviction can take the database down until Kubernetes reschedules the pod and reattaches the PVC (briefly stateful, briefly unavailable) unless a proper HA operator is in place.
3. Monitoring has to be added deliberately, and it doesn't come for free the way it does with Cloud SQL.

**Verdict:** I do not want to be biased, but DBaaS clearly reduces day-two operational load. It converts a recurring maintenance burden into a fixed monthly cost, which DIY can hardly match. It also happens to be one of the greatest reasons for why Dbaas is so popular.

### Backups

**DBaaS**
1. Automated daily backups and point-in-time recovery are built-in features, enabled with a checkbox and a retention period.
2. Restoring is a single `gcloud sql backups restore` command or a console click, no manual dump/restore scripting required.

**DIY**
1. One has to manually take care of backups. This is typically a CronJob that runs `pg_dump` or smth similar and pushes the result to a Cloud Storage bucket.
2. Point-in-time recovery is possible, for example with WAL archiving, but is meaningfully more setup and testing effort than DBaaS built-in equivalent.
3. Restore is a manual, scripted process, and it's only as reliable as the backup CronJob and the restore procedure have actually been tested to be. It's easy to have "backups" running for months that turn out to be broken the first time they're needed. That can give a lot of extra work to a team that is already busy with other things.

**Verdict:** this is where DBaas advantage is definitely most visible. Backup and restore for a self-hosted database is not hard to set up, but it is easy to get wrong without noticing a thing. DIY restore procedures are rarely exercised until the day they're actually needed, and as mentioned, if they fail, they fail. That can be at worst at a business critical moment.

### Cost

**DBaaS**
1. Priced per instance size/tier plus storage, generally higher per-GB and per-vCPU than a comparable self-hosted setup on the same cluster's compute.
2. No engineering time spent on setup, maintenance or backups is itself a cost saving that's easy to underweight when just comparing prices.

**DIY**
1. Technically cheaper in raw infrastructure cost. It reuses cluster compute/storage you're already paying for.
2. The "true" cost includes the engineering time spent building, patching, and babysitting the database, which is harder to see on a bill but is real. 

**verdict:**

if you count all the hours you spent on patching, building and watching you DB, and then multiply it with the median salary of a software dev or database engineer, i bet  you'll realize how much more enticing Dbaas is than DIY in cost.

### Summary

For this project specifically a DBaaS would be the pragmatic choice. The application is small, and will likely not need to scale, (especially because its coursework). The operational and backup guarantees it provides outweigh the cost savings of DIY, especially given the project is maintained by a single person rather than a team.
