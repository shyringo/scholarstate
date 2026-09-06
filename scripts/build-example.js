import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { sealEvent } from "../src/core/canonical.js";
import { assertValidEvent } from "../src/core/validate.js";

const target = resolve("examples/flashattention/events.jsonl");
const human = { id: "https://example.org/people/demo-curator", kind: "human", name: "Demo curator" };
const extractor = { id: "urn:scholarstate:agent:example-extractor", kind: "ai", name: "Example extraction agent" };
const base = "2026-09-07T00:00:00.000Z";

const drafts = [
  {
    type: "profile.publish",
    createdAt: base,
    actor: human,
    humanAnchors: [human.id],
    payload: {
      profileId: "profile:ai-research",
      version: "0.1.0",
      title: "AI research profile",
      description: "An illustrative, forkable vocabulary for claims, methods, code, tests, and review in AI research.",
      objectTypes: ["ai:paper", "ai:claim", "ai:method", "ai:software", "ai:evidence"],
      relationTypes: ["ai:claims", "ai:describes", "ai:implements", "ai:tests", "ai:supports"],
      statusPolicy: "Statuses are derived views. Formal decisions require a jurisdiction-specific policy and human accountability."
    }
  },
  {
    type: "object.publish",
    createdAt: "2026-09-07T00:01:00.000Z",
    actor: extractor,
    humanAnchors: [],
    payload: {
      objectId: "arxiv:2205.14135",
      objectType: "ai:paper",
      versionId: "arxiv:2205.14135v2",
      title: "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness",
      summary: "The authors present an IO-aware exact attention algorithm based on tiling.",
      attributes: {
        authors: ["Tri Dao", "Daniel Y. Fu", "Stefano Ermon", "Atri Rudra", "Christopher Re"],
        published: "2022-05-27",
        sourceKind: "preprint"
      },
      artifacts: [
        { mediaType: "text/html", url: "https://arxiv.org/abs/2205.14135", role: "landing-page" },
        { mediaType: "application/pdf", url: "https://arxiv.org/pdf/2205.14135", role: "original" }
      ]
    }
  },
  {
    type: "object.publish",
    createdAt: "2026-09-07T00:02:00.000Z",
    actor: extractor,
    humanAnchors: [],
    payload: {
      objectId: "claim:flashattention-io-aware-exact",
      objectType: "ai:claim",
      versionId: "claim:flashattention-io-aware-exact@1",
      title: "FlashAttention is an IO-aware exact attention algorithm",
      summary: "It uses tiling to reduce reads and writes between GPU high-bandwidth memory and on-chip SRAM while computing exact attention.",
      attributes: {
        scope: "The algorithm and hardware model described by arXiv:2205.14135v2",
        extractedFrom: "abstract",
        extractionStatus: "machine-extracted; not independently verified"
      },
      artifacts: []
    }
  },
  {
    type: "object.publish",
    createdAt: "2026-09-07T00:03:00.000Z",
    actor: extractor,
    humanAnchors: [],
    payload: {
      objectId: "method:flashattention-tiling",
      objectType: "ai:method",
      versionId: "method:flashattention-tiling@1",
      title: "Tiled attention with IO-aware memory access",
      summary: "A method record extracted from the paper, retaining its dependency on the exact source version.",
      attributes: { source: "arxiv:2205.14135v2" },
      artifacts: []
    }
  },
  {
    type: "object.publish",
    createdAt: "2026-09-07T00:04:00.000Z",
    actor: extractor,
    humanAnchors: [],
    payload: {
      objectId: "github:Dao-AILab/flash-attention",
      objectType: "ai:software",
      versionId: "github:Dao-AILab/flash-attention@main-observed-2026-09-07",
      title: "Official FlashAttention implementation",
      summary: "The authors' public implementation and test suite. The moving main branch is recorded with an observation date, not presented as an immutable commit.",
      attributes: { provenanceCaveat: "Resolve to a commit before using this version as reproducibility evidence." },
      artifacts: [
        { mediaType: "text/html", url: "https://github.com/Dao-AILab/flash-attention", role: "repository" },
        { mediaType: "text/plain", url: "https://github.com/Dao-AILab/flash-attention/blob/main/tests/test_flash_attn.py", role: "tests" }
      ]
    }
  },
  {
    type: "object.publish",
    createdAt: "2026-09-07T00:05:00.000Z",
    actor: extractor,
    humanAnchors: [],
    payload: {
      objectId: "evidence:official-reference-tests",
      objectType: "ai:evidence",
      versionId: "evidence:official-reference-tests@1",
      title: "Official repository compares outputs and gradients with a reference implementation",
      summary: "The repository states that its tests compare output and gradient error against a PyTorch baseline. This is author-supplied test evidence, not independent replication.",
      attributes: {
        evidenceClass: "author-supplied-test",
        independence: "not-independent",
        execution: "not-run-by-this-demo"
      },
      artifacts: [
        { mediaType: "text/html", url: "https://github.com/Dao-AILab/flash-attention#tests", role: "source" }
      ]
    }
  },
  {
    type: "relation.assert",
    createdAt: "2026-09-07T00:06:00.000Z",
    actor: extractor,
    humanAnchors: [],
    payload: {
      relationId: "relation:paper-claims-io-aware-exact",
      relationType: "ai:claims",
      subject: "arxiv:2205.14135",
      object: "claim:flashattention-io-aware-exact",
      basis: "arxiv:2205.14135v2 abstract"
    }
  },
  {
    type: "relation.assert",
    createdAt: "2026-09-07T00:07:00.000Z",
    actor: extractor,
    humanAnchors: [],
    payload: {
      relationId: "relation:paper-describes-tiling",
      relationType: "ai:describes",
      subject: "arxiv:2205.14135",
      object: "method:flashattention-tiling",
      basis: "paper content"
    }
  },
  {
    type: "relation.assert",
    createdAt: "2026-09-07T00:08:00.000Z",
    actor: extractor,
    humanAnchors: [],
    payload: {
      relationId: "relation:code-implements-method",
      relationType: "ai:implements",
      subject: "github:Dao-AILab/flash-attention",
      object: "method:flashattention-tiling",
      basis: "repository authors identify it as the official implementation"
    }
  },
  {
    type: "relation.assert",
    createdAt: "2026-09-07T00:09:00.000Z",
    actor: extractor,
    humanAnchors: [],
    payload: {
      relationId: "relation:tests-support-claim",
      relationType: "ai:supports",
      subject: "evidence:official-reference-tests",
      object: "claim:flashattention-io-aware-exact",
      basis: "official repository test description; execution not reproduced here"
    }
  },
  {
    type: "activity.record",
    createdAt: "2026-09-07T00:10:00.000Z",
    actor: extractor,
    humanAnchors: [],
    payload: {
      activityId: "activity:extract-flashattention-record",
      activityType: "ai:structured-extraction",
      inputs: ["arxiv:2205.14135", "github:Dao-AILab/flash-attention"],
      outputs: ["claim:flashattention-io-aware-exact", "method:flashattention-tiling", "evidence:official-reference-tests"],
      environment: { agent: "unspecified demonstration extractor", review: "not human reviewed" }
    }
  },
  {
    type: "attestation.issue",
    createdAt: "2026-09-07T00:11:00.000Z",
    actor: extractor,
    humanAnchors: [],
    payload: {
      attestationId: "attestation:source-reports-claim",
      attestationType: "source-report",
      subject: "claim:flashattention-io-aware-exact",
      position: "supports",
      statement: "The cited paper and official repository state that FlashAttention computes exact attention with IO-aware tiling.",
      evidence: ["arxiv:2205.14135", "evidence:official-reference-tests"],
      authority: { decisive: false }
    }
  }
];

const events = drafts.map((draft) => assertValidEvent(sealEvent(draft)));
await mkdir(dirname(target), { recursive: true });
await writeFile(target, `${events.map((event) => JSON.stringify(event)).join("\n")}\n`, "utf8");
console.log(`Wrote ${events.length} events to ${target}`);
