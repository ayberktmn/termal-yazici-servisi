let connected = false;
let mode = null;
let paper = true;
let paperCount = 10;
let reconnecting = false;
let lastMode = null;

let printerError = null;

export async function connectPrinter(type) {
  connected = true;
  mode = type;
  lastMode = type;

  return {
    success: true,
    mode,
    message: `${type} yazıcı bağlantısı başarılı`
  };
}

export function disconnectPrinter() {
  connected = false;

  return {
    success: true,
    message: "Bağlantı koptu"
  };
}

export async function reconnectPrinter() {
  if (reconnecting) {
    return {
      success: false,
      message: "Reconnect zaten çalışıyor"
    };
  }

  reconnecting = true;

  const delays = [1000, 2000, 4000];

  for (const delay of delays) {
    await new Promise(resolve => setTimeout(resolve, delay));

    if (lastMode) {
      connected = true;
      mode = lastMode;
      reconnecting = false;

      return {
        success: true,
        mode,
        message: `${mode} yeniden bağlandı`,
        delayMs: delay
      };
    }
  }

  reconnecting = false;

  return {
    success: false,
    message: "Yeniden bağlanılamadı"
  };
}

export function getPrinterStatus() {
  return {
    connected,
    mode,
    paper,
    paperCount,
    coverOpen: printerError === "COVER_OPEN",
    temperature: printerError === "OVERHEAT" ? 85 : 32,
    paperJam: printerError === "PAPER_JAM",
    activeError: printerError,
    queue: 0,
    reconnecting
  };
}

function errorMessage(code) {
  const messages = {
    PAPER_OUT: "Kağıt bitti",
    PAPER_JAM: "Kağıt sıkıştı",
    COVER_OPEN: "Kapak açık",
    OVERHEAT: "Yazıcı aşırı ısındı",
    COMM_ERROR: "Yazıcı bağlantı hatası",
    UNKNOWN_COMMAND: "Bilinmeyen komut"
  };

  return messages[code] || "Bilinmeyen hata";
}

function checkPrinter() {
  if (!connected) {
    const err = new Error(errorMessage("COMM_ERROR"));
    err.code = "COMM_ERROR";
    throw err;
  }

  if (!paper || paperCount <= 0) {
    const err = new Error(errorMessage("PAPER_OUT"));
    err.code = "PAPER_OUT";
    throw err;
  }

  if (printerError) {
    const err = new Error(errorMessage(printerError));
    err.code = printerError;
    throw err;
  }
}

function consumePaper() {
  paperCount--;

  if (paperCount <= 0) {
    paper = false;
    paperCount = 0;
  }
}

export async function printText(text) {
  checkPrinter();
  consumePaper();

  console.log("YAZDIRILIYOR:");
  console.log(text);

  return {
    success: true,
    printedText: text,
    remainingPaper: paperCount
  };
}

export async function printQR(data) {
  checkPrinter();
  consumePaper();

  console.log("QR YAZDIRILIYOR:");
  console.log(data);

  return {
    success: true,
    qrData: data,
    remainingPaper: paperCount
  };
}

export async function printImage(imageUrl) {
  checkPrinter();
  consumePaper();

  console.log("GÖRSEL YAZDIRILIYOR:");
  console.log(imageUrl);

  return {
    success: true,
    imageUrl,
    remainingPaper: paperCount
  };
}

export function setPaperStatus(value, count = 10) {
  paper = value;

  if (value) {
    paperCount = count;
  } else {
    paperCount = 0;
  }
}

export function setPrinterError(code) {
  printerError = code || null;

  return {
    success: true,
    activeError: printerError,
    message: printerError ? errorMessage(printerError) : "Hata temizlendi"
  };
}

export function getErrorMessage(code) {
  return errorMessage(code);
}