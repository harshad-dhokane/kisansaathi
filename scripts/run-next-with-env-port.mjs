import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const mode = process.argv[2];
const forwardedArgs = process.argv.slice(3);
const cwd = process.cwd();
const envFilePath = resolve(cwd, ".env");
const fallbackPort = "3001";

function readEnvValue(key) {
  if (!existsSync(envFilePath)) {
    return undefined;
  }

  const content = readFileSync(envFilePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const candidateKey = trimmed.slice(0, separatorIndex).trim();

    if (candidateKey !== key) {
      continue;
    }

    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    return rawValue.replace(/^['"]|['"]$/g, "");
  }

  return undefined;
}

function resolvePort() {
  const explicitPortIndex = forwardedArgs.findIndex(
    (arg) => arg === "--port" || arg === "-p",
  );

  if (explicitPortIndex !== -1 && forwardedArgs[explicitPortIndex + 1]) {
    return forwardedArgs[explicitPortIndex + 1];
  }

  return process.env.APP_PORT || readEnvValue("APP_PORT") || fallbackPort;
}

if (mode !== "dev" && mode !== "start") {
  console.error(`Unsupported mode "${mode}". Use "dev" or "start".`);
  process.exit(1);
}

const port = resolvePort();
const nextExecutable = resolve(cwd, "node_modules", ".bin", "next");
const commandArgs = [mode, "--port", port, ...forwardedArgs];

const child = spawn(nextExecutable, commandArgs, {
  cwd,
  stdio: "inherit",
  env: {
    ...process.env,
    APP_PORT: port,
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
