import express from "express";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

import {
  connectPrinter,
  disconnectPrinter,
  reconnectPrinter,
  getPrinterStatus,
  printText,
  printQR,
  printImage,
  setPaperStatus,
  setPrinterError,
  getErrorMessage
} from "../printer/mockPrinter.js";

import { writeLog, readLogs } from "../logs/logger.js";

function saveFailedImage(jobId, imageUrl, error) {

  const file = path.join(process.cwd(), "logs", "failed-images.json");

  if (!fs.existsSync(path.dirname(file))) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }

  let items = [];

  if (fs.existsSync(file)) {
    items = JSON.parse(fs.readFileSync(file, "utf8"));
  }

  items.unshift({
    ts: new Date().toISOString(),
    jobId,
    imageUrl,
    error
  });

  fs.writeFileSync(
    file,
    JSON.stringify(items, null, 2),
    "utf8"
  );
}

const router = express.Router();

router.post("/connect", async (req, res) => {
  try {
    const { mode } = req.body;

    if (!mode || !["usb", "lan"].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: "mode usb veya lan olmalı"
      });
    }

    const result = await connectPrinter(mode);

    writeLog({
      op: "connect",
      conn: mode,
      status: "success",
      detail: result.message
    });

    res.json(result);
  } catch (err) {
    writeLog({
      op: "connect",
      status: "error",
      error: {
       code: err.code || "COMM_ERROR",
        detail: err.message
      }
    });

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

router.get("/status", (req, res) => {
  res.json(getPrinterStatus());
});

router.get("/logs", (req, res) => {
  res.json({
    success: true,
    logs: readLogs()
  });
});

router.post("/print/text", async (req, res) => {
  const jobId = uuidv4();

  try {
    const { text, language = "tr" } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "text gerekli"
      });
    }

   const result = await printText(text, language);

    const log = writeLog({
      op: "print_text",
      conn: getPrinterStatus().mode,
      jobId,
      status: "success",
      contentType: "text",
      detail: `[${language || "tr"}] ${text}`
    });

    res.json({
      ...result,
      jobId,
      log
    });
  } catch (err) {
    const log = writeLog({
      op: "print_text",
      conn: getPrinterStatus().mode,
      jobId,
      status: "error",
      contentType: "text",
      error: {
        code: err.code || "COMM_ERROR",
        detail: err.message
      }
    });

    res.status(500).json({
      success: false,
      jobId,
      error: err.message,
      log
    });
  }
});

router.post("/print/qr", async (req, res) => {
  const jobId = uuidv4();

  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "data gerekli"
      });
    }

    const result = await printQR(data);

    const log = writeLog({
      op: "print_qr",
      conn: getPrinterStatus().mode,
      jobId,
      status: "success",
      detail: data
    });

    res.json({
      ...result,
      jobId,
      log
    });

  } catch (err) {

    const log = writeLog({
      op: "print_qr",
      jobId,
      status: "error",
      error: {
        code: err.code || "COMM_ERROR",
        detail: err.message
      }
    });

    res.status(500).json({
      success: false,
      error: err.message,
      log
    });
  }
});

router.post("/print/image", async (req, res) => {
  const jobId = uuidv4();

  try {

    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "imageUrl gerekli"
      });
    }

    const result = await printImage(imageUrl);

    const log = writeLog({
      op: "print_image",
      conn: getPrinterStatus().mode,
      jobId,
      status: "success",
      detail: imageUrl
    });

    res.json({
      ...result,
      jobId,
      log
    });

  } catch (err) {

    saveFailedImage(jobId, req.body.imageUrl, {
        code: err.code || "COMM_ERROR",
        detail: err.message
    });

    const log = writeLog({
    op: "print_image",
    conn: getPrinterStatus().mode,
    jobId,
    status: "error",
    detail: req.body.imageUrl,
    error: {
        code: err.code || "COMM_ERROR",
        detail: err.message
      }
    });

    res.status(500).json({
      success: false,
      error: err.message,
      log
    });
  }
});

router.post("/reprint/:jobId", async (req, res) => {
  const { jobId } = req.params;
  const logs = readLogs();

 const oldJob = logs.find(x =>
  x.jobId === jobId &&
  ["print_text", "print_qr", "print_image"].includes(x.op)
);

  if (!oldJob) {
    return res.status(404).json({
      success: false,
      message: "Job bulunamadı"
    });
  }

  try {
    let result;

    if (oldJob.op === "print_text") {
      result = await printText(oldJob.detail);
    } else if (oldJob.op === "print_qr") {
      result = await printQR(oldJob.detail);
    } else if (oldJob.op === "print_image") {
      result = await printImage(oldJob.detail);
    } else {
      return res.status(400).json({
        success: false,
        message: "Bu iş tekrar basılamaz"
      });
    }

    const log = writeLog({
      op: "reprint",
      conn: getPrinterStatus().mode,
      jobId,
      status: "success",
      detail: "İş tekrar yazdırıldı"
    });

    res.json({
      success: true,
      message: "İş tekrar yazdırıldı",
      result,
      oldJob,
      log
    });

  } catch (err) {
    const log = writeLog({
      op: "reprint",
      conn: getPrinterStatus().mode,
      jobId,
      status: "error",
      error: {
        code: err.code || "COMM_ERROR",
        detail: err.message
      }
    });

    res.status(500).json({
      success: false,
      message: "Tekrar baskı başarısız",
      error: {
        code: err.code || "COMM_ERROR",
        detail: err.message
      },
      log
    });
  }
});

router.get("/logs/export", (req, res) => {
  const logs = readLogs();

 const csvHeader = "ts;op;conn;jobId;status;detail;error\n";

  const csvRows = logs.map(l => {
    return [
      l.ts || "",
      l.op || "",
      l.conn || "",
      l.jobId || "",
      l.status || "",
      String(l.detail || "").replaceAll(",", " "),
      l.error?.detail || ""
    ].join(";");
  });

  const csv = csvHeader + csvRows.join("\n");

res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=logs.csv");
  res.send("\uFEFF" + csv);
});

router.post("/paper", (req, res) => {
  const { hasPaper, count } = req.body;

  setPaperStatus(Boolean(hasPaper), Number(count || 10));

  writeLog({
    op: "paper_status",
    conn: getPrinterStatus().mode,
    status: "success",
    detail: hasPaper ? `Kağıt takıldı (${count || 10} baskı)` : "Kağıt bitti"
  });

  res.json({
    success: true,
    paper: Boolean(hasPaper),
    paperCount: getPrinterStatus().paperCount,
    message: hasPaper ? `Kağıt takıldı (${count || 10} baskı)` : "Kağıt bitti"
  });
});

router.post("/disconnect", async (req, res) => {
  const result = disconnectPrinter();

  writeLog({
    op: "disconnect",
    conn: getPrinterStatus().mode,
    status: "error",
    error: {
      code: "COMM_ERROR",
      detail: "Bağlantı koptu"
    }
  });

  reconnectPrinter().then(reconnectResult => {
    writeLog({
      op: "reconnect",
      conn: reconnectResult.mode || null,
      status: reconnectResult.success ? "success" : "error",
      detail: reconnectResult.message
    });
  });

  res.json({
    ...result,
    reconnect: "started"
  });
});

router.post("/error", (req, res) => {
  const { code } = req.body;

  const allowedErrors = [
    "PAPER_JAM",
    "COVER_OPEN",
    "OVERHEAT",
    "UNKNOWN_COMMAND"
  ];

  if (code && !allowedErrors.includes(code)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "UNKNOWN_COMMAND",
        detail: "Bilinmeyen hata kodu"
      }
    });
  }

  const result = setPrinterError(code || null);

  writeLog({
    op: "set_error",
    conn: getPrinterStatus().mode,
    status: code ? "error" : "success",
    error: code
      ? {
          code,
          detail: getErrorMessage(code)
        }
      : null,
    detail: result.message
  });

  res.json(result);
});

export default router;