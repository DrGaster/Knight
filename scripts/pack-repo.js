const fs = require("fs");
const archiver = require("archiver");
const tar = require("tar");

async function packAll() {
  // ZIP
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream("repo.zip");
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(output);
    archive.glob("**/*", { ignore: [".git/**","node_modules/**","repo.*"] });
    output.on("close", () => { console.log(`✅ repo.zip (${archive.pointer()} bytes)`); resolve(); });
    archive.on("error", reject);
    archive.finalize();
  });

  // tar.gz
  await tar.c(
    { gzip: true, file: "repo.tar.gz", filter: p => !p.match(/^(\.git|node_modules|repo\.)/) },
    ["."]
  );
  console.log("✅ repo.tar.gz created");
}

packAll().catch(err => {
  console.error("Packing failed:", err);
  process.exit(1);
});
