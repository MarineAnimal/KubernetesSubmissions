import * as k8s from '@kubernetes/client-node';

// --- Custom resource coordinates -------------------------------------------
const GROUP = 'dummysite.example.com';
const VERSION = 'v1';
const PLURAL = 'dummysites';
const KIND = 'DummySite';
const API_VERSION = `${GROUP}/${VERSION}`;

// Annotation used to detect whether a child resource is already up to date.
const URL_ANNOTATION = `${GROUP}/website-url`;

// How often (ms) to run a full reconcile of every DummySite. The watch gives
// us fast reactions; this loop guarantees eventual consistency and recovery.
const RECONCILE_INTERVAL_MS = Number(process.env.RECONCILE_INTERVAL_MS || 30000);

// --- Client setup -----------------------------------------------------------
const kc = new k8s.KubeConfig();
if (process.env.KUBERNETES_SERVICE_HOST) {
  // Running inside the cluster: use the mounted service-account token.
  kc.loadFromCluster();
} else {
  // Running locally: use the current kubeconfig context.
  kc.loadFromDefault();
}

const customApi = kc.makeApiClient(k8s.CustomObjectsApi);
const appsApi = kc.makeApiClient(k8s.AppsV1Api);
const coreApi = kc.makeApiClient(k8s.CoreV1Api);

function log(message) {
  console.log(`${new Date().toISOString()} ${message}`);
}

// Extract the HTTP status code from a client error across client-node versions.
function statusCode(err) {
  return err?.code ?? err?.statusCode ?? err?.response?.statusCode;
}

// --- Desired-state builders -------------------------------------------------
function childName(siteName) {
  return `dummysite-${siteName}`;
}

function childLabels(siteName) {
  return {
    'app.kubernetes.io/name': 'dummysite',
    'app.kubernetes.io/managed-by': 'dummysite-operator',
    'dummysite.example.com/site': siteName,
  };
}

function ownerReference(site) {
  return {
    apiVersion: API_VERSION,
    kind: KIND,
    name: site.metadata.name,
    uid: site.metadata.uid,
    controller: true,
    blockOwnerDeletion: true,
  };
}

function buildDeployment(site, url) {
  const name = site.metadata.name;
  const labels = childLabels(name);
  // A tiny shell program: fetch the page, retrying temporary failures; if it
  // still fails, write a placeholder so nginx always has something to serve.
  const fetchScript =
    'curl -sSL --fail --retry 5 --retry-delay 3 --max-time 60 ' +
    '-o /site/index.html "$WEBSITE_URL" || ' +
    'echo "<html><body><h1>DummySite</h1><p>Could not fetch $WEBSITE_URL</p></body></html>" > /site/index.html';

  return {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: childName(name),
      namespace: site.metadata.namespace,
      labels,
      annotations: { [URL_ANNOTATION]: url },
      ownerReferences: [ownerReference(site)],
    },
    spec: {
      replicas: 1,
      selector: { matchLabels: labels },
      template: {
        metadata: { labels, annotations: { [URL_ANNOTATION]: url } },
        spec: {
          initContainers: [
            {
              name: 'fetch',
              image: 'curlimages/curl:8.11.0',
              command: ['sh', '-c'],
              args: [fetchScript],
              env: [{ name: 'WEBSITE_URL', value: url }],
              volumeMounts: [{ name: 'site', mountPath: '/site' }],
            },
          ],
          containers: [
            {
              name: 'nginx',
              image: 'nginx:1.27-alpine',
              ports: [{ containerPort: 80 }],
              volumeMounts: [
                { name: 'site', mountPath: '/usr/share/nginx/html' },
              ],
            },
          ],
          volumes: [{ name: 'site', emptyDir: {} }],
        },
      },
    },
  };
}

function buildService(site) {
  const name = site.metadata.name;
  const labels = childLabels(name);
  return {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: childName(name),
      namespace: site.metadata.namespace,
      labels,
      ownerReferences: [ownerReference(site)],
    },
    spec: {
      selector: labels,
      ports: [{ name: 'http', port: 80, targetPort: 80 }],
    },
  };
}

// --- Reconcile helpers ------------------------------------------------------
async function ensureDeployment(site, url) {
  const namespace = site.metadata.namespace;
  const desired = buildDeployment(site, url);
  const name = desired.metadata.name;

  try {
    const existing = await appsApi.readNamespacedDeployment({ name, namespace });
    const currentUrl = existing.metadata?.annotations?.[URL_ANNOTATION];
    if (currentUrl !== url) {
      desired.metadata.resourceVersion = existing.metadata.resourceVersion;
      await appsApi.replaceNamespacedDeployment({ name, namespace, body: desired });
      log(`Updated Deployment ${namespace}/${name} (website_url changed)`);
    }
    // else: already up to date — do nothing (idempotent).
  } catch (err) {
    if (statusCode(err) === 404) {
      await appsApi.createNamespacedDeployment({ namespace, body: desired });
      log(`Created Deployment ${namespace}/${name}`);
    } else {
      throw err;
    }
  }
}

async function ensureService(site) {
  const namespace = site.metadata.namespace;
  const desired = buildService(site);
  const name = desired.metadata.name;

  try {
    await coreApi.readNamespacedService({ name, namespace });
    // Service shape never changes for us, so existence is enough.
  } catch (err) {
    if (statusCode(err) === 404) {
      await coreApi.createNamespacedService({ namespace, body: desired });
      log(`Created Service ${namespace}/${name}`);
    } else {
      throw err;
    }
  }
}

async function reconcileDummySite(site) {
  const { namespace, name } = { namespace: site.metadata.namespace, name: site.metadata.name };
  const url = site.spec?.website_url;
  if (!url) {
    log(`DummySite ${namespace}/${name} has no spec.website_url, skipping`);
    return;
  }
  await ensureDeployment(site, url);
  await ensureService(site);
}

async function reconcileAll() {
  // For a namespaced CRD this path lists objects across all namespaces.
  const res = await customApi.listClusterCustomObject({
    group: GROUP,
    version: VERSION,
    plural: PLURAL,
  });
  const items = res.items ?? [];
  for (const site of items) {
    try {
      await reconcileDummySite(site);
    } catch (err) {
      const ns = site.metadata?.namespace;
      const nm = site.metadata?.name;
      log(`Error reconciling DummySite ${ns}/${nm}: ${err.message}`);
    }
  }
}

// --- Watch ------------------------------------------------------------------
function startWatch() {
  const watch = new k8s.Watch(kc);
  const path = `/apis/${GROUP}/${VERSION}/${PLURAL}`;

  watch
    .watch(
      path,
      {},
      (type, obj) => {
        const ns = obj.metadata?.namespace;
        const nm = obj.metadata?.name;
        log(`Watch event ${type} for DummySite ${ns}/${nm}`);
        // Re-run the full reconcile; it is idempotent and cheap.
        reconcileAll().catch((err) => log(`Reconcile error: ${err.message}`));
      },
      (err) => {
        // Called when the watch connection ends (normally or with an error).
        log(`Watch ended${err ? `: ${err.message}` : ''}. Restarting in 5s.`);
        setTimeout(startWatch, 5000);
      },
    )
    .catch((err) => {
      log(`Failed to start watch: ${err.message}. Retrying in 5s.`);
      setTimeout(startWatch, 5000);
    });
}

// --- Main -------------------------------------------------------------------
async function main() {
  log('DummySite operator starting');
  // Initial reconcile (retry until the API is reachable).
  while (true) {
    try {
      await reconcileAll();
      break;
    } catch (err) {
      log(`Initial reconcile failed: ${err.message}. Retrying in 5s.`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  setInterval(() => {
    reconcileAll().catch((err) => log(`Periodic reconcile error: ${err.message}`));
  }, RECONCILE_INTERVAL_MS);

  startWatch();
  log(`Operator running (reconcile every ${RECONCILE_INTERVAL_MS} ms)`);
}

main().catch((err) => {
  log(`Fatal: ${err.message}`);
  process.exit(1);
});
