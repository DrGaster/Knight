const fs = require("fs");
const archiver = require("archiver");

const output = fs.createWriteStream("repo.zip");
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
  console.log(`✅ repo.zip (${archive.pointer()} total bytes)`);
});
archive.on("error", err => { throw err; });

archive.pipe(output);
// Include all but .git, node_modules, and any existing zip
archive.glob("**/*", {
  ignore: [".git/**", "node_modules/**", "repo.zip"]
});
archive.finalize();
