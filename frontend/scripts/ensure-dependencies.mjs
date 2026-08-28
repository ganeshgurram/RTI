import { existsSync, readFileSync, statSync } from "node:fs"
import { execFileSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const frontendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const manifestPath = path.join(frontendDirectory, "package.json")
const lockfilePath = path.join(frontendDirectory, "package-lock.json")
const installedLockfilePath = path.join(frontendDirectory, "node_modules", ".package-lock.json")
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
const directDependencies = Object.keys({
  ...manifest.dependencies,
  ...manifest.devDependencies,
})

function packageDirectory(packageName) {
  return path.join(frontendDirectory, "node_modules", ...packageName.split("/"))
}

function isNewerThanInstalledLockfile(filePath) {
  return statSync(filePath).mtimeMs > statSync(installedLockfilePath).mtimeMs
}

const dependenciesMissing = directDependencies.some((packageName) => !existsSync(packageDirectory(packageName)))
const installationIsOutdated =
  !existsSync(installedLockfilePath) ||
  dependenciesMissing ||
  isNewerThanInstalledLockfile(manifestPath) ||
  isNewerThanInstalledLockfile(lockfilePath)

if (installationIsOutdated) {
  console.log("Synchronizing frontend dependencies from package-lock.json...")
  const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "npm"
  const argumentsForCommand = process.platform === "win32"
    ? ["/d", "/s", "/c", "npm install --no-package-lock --ignore-scripts --no-audit --no-fund"]
    : ["install", "--no-package-lock", "--ignore-scripts", "--no-audit", "--no-fund"]

  execFileSync(command, argumentsForCommand, {
    cwd: frontendDirectory,
    stdio: "inherit",
  })
}