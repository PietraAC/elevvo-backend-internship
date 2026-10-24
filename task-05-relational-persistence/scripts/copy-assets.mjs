import { cp, mkdir, rm } from "node:fs/promises";

const source = new URL("../src/public/", import.meta.url);
const destination = new URL("../dist/src/public/", import.meta.url);

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
console.log("Static demonstration assets copied to dist/src/public.");
