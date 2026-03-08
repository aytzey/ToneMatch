const fs = require("node:fs");
const path = require("node:path");

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (!current.startsWith("--")) {
      continue;
    }

    const key = current.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

async function loadFeed(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Could not fetch remote feed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  const absolutePath = path.resolve(process.cwd(), source);
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const source = args.file || "data/sample-catalog-feed.json";
  const supabaseUrl = process.env.SUPABASE_URL;
  const ingestSecret = process.env.CATALOG_INGEST_SECRET;
  const functionUrl =
    args.url ||
    process.env.CATALOG_INGEST_URL ||
    (supabaseUrl ? `${supabaseUrl.replace(/\/$/, "")}/functions/v1/ingest-catalog-feed` : "");

  if (!functionUrl) {
    throw new Error("SUPABASE_URL or --url is required.");
  }

  if (!ingestSecret) {
    throw new Error("CATALOG_INGEST_SECRET is required.");
  }

  const payload = await loadFeed(source);
  if (args.feed) {
    payload.sourceFeed = args.feed;
  }
  if (args["deactivate-missing"] !== undefined) {
    payload.deactivateMissing = args["deactivate-missing"] === "true" || args["deactivate-missing"] === true;
  }

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ingestSecret}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(`Catalog ingest failed: ${JSON.stringify(result)}`);
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
