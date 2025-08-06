const fs = require("fs");
const archiver = require("archiver");
const tar = require("tar");

// Helper to zip
function makeZip() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream("repo.zip");
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", () =>
      console.log(`✅ repo.zip (${archive.pointer()} bytes)`) || resolve()
    );
    archive.on("error", err => reject(err));
    archive.pipe(output);
    archive.glob("**/*", { ignore: [".git/**", "node_modules/**", "repo.*"] });
    archive.finalize();
  });
}

// Helper to tar.gz
function makeTarGz() {
  return tar
    .c(
      {
        gzip: true,
        file: "repo.tar.gz",
        filter: path =>
          !path.startsWith(".git") &&
          !path.startsWith("node_modules") &&
          !path.match(/repo\.(zip|tar\.gz|tar\.xz)$/),
      },
      ["."]
    )
    .then(() => console.log("✅ repo.tar.gz created"));
}

// Run both in sequence
async function packAll() {
  try {
    await makeZip();
    await makeTarGz();
  } catch (e) {
    console.error("Packing failed:", e);
    process.exit(1);
  }
}

packAll();
