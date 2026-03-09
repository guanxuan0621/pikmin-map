import { processRefreshQueue } from "../src/lib/mushrooms/jobs";

async function main() {
  const processed = await processRefreshQueue();
  console.log(`Processed ${processed} refresh job(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
