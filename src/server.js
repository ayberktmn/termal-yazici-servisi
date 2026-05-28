import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import printerRoutes from "./routes/printer.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

function tokenAuth(req, res, next) {
  if (req.path === "/" || req.path === "/health" || req.path.startsWith("/api/status")) {
    return next();
  }

  const token = req.headers["x-api-token"];

  if (token !== process.env.API_TOKEN) {
    return res.status(401).json({
      success: false,
      message: "Yetkisiz istek. x-api-token hatalı veya eksik."
    });
  }

  next();
}

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "thermal-printer-service"
  });
});

app.use("/api", tokenAuth, printerRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server çalıştı: http://localhost:${PORT}`);
});