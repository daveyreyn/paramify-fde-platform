import { createHash, randomUUID } from 'node:crypto';

import { generatePassword, getEnv, hashPassword, languageForFile } from '@paramify/shared';
import { getStorage } from '@paramify/storage';

import { getPrisma } from '../src/index.js';

const prisma = getPrisma();

// Fixture teams so team-scoped flows are testable out of the box.
for (const name of ['fedramp', 'labs']) {
  await prisma.team.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  console.log(`Seeded team: ${name}`);
}

// All users join fedramp; the first user is super and also in labs, so the
// multi-team-scope and super-only flows are exercisable immediately.
for (const [index, email] of getEnv().USERS.entries()) {
  const isSuper = index === 0;
  const teams = isSuper ? ['fedramp', 'labs'] : ['fedramp'];
  const data = {
    isSuper,
    teams: { connect: teams.map((name) => ({ name })) },
  };
  const user = await prisma.user.upsert({
    where: { email },
    update: data,
    create: { email, ...data },
  });
  const label = `${user.email}${isSuper ? ' (super)' : ''} → ${teams.join(', ')}`;
  if (user.passwordHash) {
    console.log(`Seeded user: ${label}`);
  } else {
    // Set an initial password; only the hash is stored, so this prints exactly once.
    const password = generatePassword();
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    });
    console.log(`Seeded user: ${label} — initial password (save it now): ${password}`);
  }
}

// Sample script deliverables so the registry, marketplace, and detail pages
// have realistic content to render. Owned by the super user; `isPublic` ones
// show up in the marketplace, the rest are scoped to their teams.
interface DeliverableFixture {
  name: string;
  title: string;
  description: string;
  tags: string[];
  fileName: string;
  isPublic: boolean;
  teams: string[];
  code: string;
}

const DELIVERABLES: DeliverableFixture[] = [
  {
    name: 'fedramp-evidence-collector',
    title: 'FedRAMP Evidence Collector',
    description:
      'Pulls and timestamps control evidence from AWS and Azure, then files it against the matching control in the evidence store.',
    tags: ['evidence', 'aws', 'azure', 'moderate'],
    fileName: 'fedramp-evidence-collector.py',
    isPublic: true,
    teams: ['fedramp'],
    code: `import boto3
from paramify import evidence, controls

SOURCES = ["cloudtrail", "config", "guardduty"]

def collect(engagement_id: str) -> int:
    store = evidence.Store(engagement_id)
    filed = 0
    for source in SOURCES:
        client = boto3.client(source)
        for item in evidence.pull(client):
            control = controls.match(item.tags)
            store.file(control, item, collected_at=item.timestamp)
            filed += 1
    return filed

if __name__ == "__main__":
    print(f"filed {collect('default')} evidence items")
`,
  },
  {
    name: 'oscal-ssp-exporter',
    title: 'OSCAL SSP Exporter',
    description:
      'Renders the System Security Plan into validated OSCAL JSON and a signed PDF package ready for the 3PAO.',
    tags: ['oscal', 'ssp', 'export'],
    fileName: 'oscal-ssp-exporter.ts',
    isPublic: true,
    teams: ['fedramp'],
    code: `import { loadSSP, toOscal, sign } from '@paramify/oscal'

export async function exportSSP(engagementId: string) {
  const ssp = await loadSSP(engagementId)
  const oscal = toOscal(ssp, { profile: 'FedRAMP-MODERATE' })

  const errors = oscal.validate()
  if (errors.length) throw new Error('OSCAL validation failed')

  const pdf = await oscal.render('pdf')
  return sign({ json: oscal.toJSON(), pdf })
}
`,
  },
  {
    name: 'control-baseline-diff',
    title: 'Control Baseline Diff',
    description:
      "Diffs a tenant's implemented controls against the selected FedRAMP baseline and flags gaps for review.",
    tags: ['controls', 'baseline', 'gap-analysis'],
    fileName: 'control-baseline-diff.py',
    isPublic: false,
    teams: ['fedramp'],
    code: `from paramify import baselines, tenant

def diff(tenant_id: str, baseline: str = "moderate"):
    implemented = tenant.controls(tenant_id)
    required = baselines.load(baseline)
    missing = required - implemented
    extra = implemented - required
    return {
        "missing": sorted(missing),
        "extra": sorted(extra),
        "coverage": len(implemented & required) / len(required),
    }
`,
  },
  {
    name: 'poam-sync',
    title: 'POA&M Sync',
    description:
      "Two-way sync of open POA&M items between the Paramify register and the customer's Jira project.",
    tags: ['poam', 'jira', 'sync'],
    fileName: 'poam-sync.go',
    isPublic: true,
    teams: ['fedramp', 'labs'],
    code: `package poam

func Sync(ctx context.Context, project string) error {
    open, err := register.OpenItems(ctx)
    if err != nil {
        return err
    }
    for _, item := range open {
        issue := jira.Upsert(ctx, project, item)
        register.Link(ctx, item.ID, issue.Key)
    }
    return jira.PullResolved(ctx, project)
}
`,
  },
  {
    name: 'vuln-scan-normalizer',
    title: 'Vuln Scan Normalizer',
    description:
      'Normalizes Nessus, Qualys, and Prisma scan output into the unified findings schema and dedupes by asset.',
    tags: ['vuln', 'nessus', 'qualys', 'findings'],
    fileName: 'vuln-scan-normalizer.py',
    isPublic: false,
    teams: ['fedramp'],
    code: `import pandas as pd
from paramify import findings

PARSERS = {"nessus": parse_nessus, "qualys": parse_qualys, "prisma": parse_prisma}

def normalize(path: str, scanner: str):
    raw = PARSERS[scanner](path)
    df = pd.DataFrame(raw)
    df = df.drop_duplicates(subset=["asset_id", "plugin_id"])
    df["severity"] = df["cvss"].map(findings.to_severity)
    return findings.upload(df.to_dict("records"))
`,
  },
  {
    name: 'inventory-reconciler',
    title: 'Inventory Reconciler',
    description:
      'Reconciles the declared asset inventory against live cloud resources and opens drift tickets for anything new.',
    tags: ['inventory', 'drift', 'aws'],
    fileName: 'inventory-reconciler.sh',
    isPublic: true,
    teams: ['labs'],
    code: `#!/usr/bin/env bash
set -euo pipefail

declared=$(paramify inventory list --format ids)
live=$(aws resourcegroupstaggingapi get-resources \\
  --query "ResourceTagMappingList[].ResourceARN" --output text)

for arn in $live; do
  if ! grep -q "$arn" <<< "$declared"; then
    paramify drift open --resource "$arn"
  fi
done
`,
  },
  {
    name: 'access-review-bot',
    title: 'Access Review Bot',
    description:
      'Assembles the quarterly access-review packet: pulls IAM grants, maps them to roles, and routes to approvers.',
    tags: ['access-review', 'iam', 'quarterly'],
    fileName: 'access-review-bot.ts',
    isPublic: true,
    teams: ['fedramp'],
    code: `import { iam, roles, approvals } from '@paramify/access'

export async function buildPacket(quarter: string) {
  const grants = await iam.listGrants()
  const rows = grants.map((g) => ({
    user: g.principal,
    role: roles.classify(g),
    lastUsed: g.lastUsed,
  }))
  return approvals.route(rows, { quarter })
}
`,
  },
  {
    name: 'boundary-diagram-gen',
    title: 'Boundary Diagram Generator',
    description:
      'Generates the authorization boundary diagram directly from Terraform state so the SSP figure never goes stale.',
    tags: ['boundary', 'terraform', 'diagram'],
    fileName: 'boundary-diagram-gen.py',
    isPublic: false,
    teams: ['labs'],
    code: `import json
from paramify import diagram

def build(state_path: str, out: str = "boundary.svg"):
    with open(state_path) as f:
        state = json.load(f)
    graph = diagram.Graph(title="Authorization Boundary")
    for res in state["resources"]:
        graph.add_node(res["name"], zone=res.get("zone", "internal"))
    graph.draw_edges_from_security_groups(state)
    graph.render(out)
`,
  },
];

if (getEnv().SEED_SAMPLES === '0') {
  console.log('Skipping sample deliverables (SEED_SAMPLES=0)');
  await prisma.$disconnect();
  process.exit(0);
}

const author = await prisma.user.findFirst({ where: { isSuper: true } });
if (!author) {
  throw new Error('seed: no super user found to own the sample deliverables');
}

for (const fixture of DELIVERABLES) {
  const existing = await prisma.deliverable.findUnique({ where: { name: fixture.name } });
  if (existing) {
    console.log(`Deliverable exists: ${fixture.name}`);
    continue;
  }

  // Mirror the upload route: a random storage key, content-addressed metadata.
  const data = new TextEncoder().encode(fixture.code);
  const storageKey = randomUUID();
  await getStorage().put(storageKey, data);

  await prisma.deliverable.create({
    data: {
      name: fixture.name,
      title: fixture.title,
      description: fixture.description,
      tags: fixture.tags,
      fileName: fixture.fileName,
      storageKey,
      size: data.byteLength,
      sha256: createHash('sha256').update(data).digest('hex'),
      language: languageForFile(fixture.fileName),
      isPublic: fixture.isPublic,
      authorId: author.id,
      teams: { connect: fixture.teams.map((name) => ({ name })) },
    },
  });
  console.log(
    `Seeded deliverable: ${fixture.name}${fixture.isPublic ? ' (public)' : ''} → ${fixture.teams.join(', ')}`,
  );
}

await prisma.$disconnect();
