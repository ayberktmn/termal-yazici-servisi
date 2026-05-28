import fs from "fs";
import path from "path";

const logDir = path.join(process.cwd(), "logs");
const logFile = path.join(logDir, "logs.json");

function ensureLogFile() {
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, "[]", "utf8");
}

export function writeLog(data) {
  ensureLogFile();

  const logs = JSON.parse(fs.readFileSync(logFile, "utf8"));

  const logItem = {
    ts: new Date().toISOString(),
    ...data
  };

  logs.unshift(logItem);

  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), "utf8");

  return logItem;
}

export function readLogs() {
  ensureLogFile();
  return JSON.parse(fs.readFileSync(logFile, "utf8"));
}