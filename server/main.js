import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { SerialPort, ReadlineParser } from "serialport";
import fs from "fs";

// --- SERVIDOR HTTP / EXPRESS ---
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

// --- LEER SERIAL DEL ARDUINO ---
const port = new SerialPort({ path: "COM4", baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: "." }));

// Archivo donde guardamos las lecturas
const FILE_PATH = "./historial.json";

// Si no existe, lo creamos
if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2));
}

parser.on("data", raw => {
  try {
    const [angle, distance] = raw.split(",").map(Number);

    if (!isNaN(angle) && !isNaN(distance)) {
      const entry = {
        angle,
        distance,
        fecha_hora: new Date().toISOString()
      };

      console.log(entry);

      // --- GUARDAR EN JSON ---
      const jsonData = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
      jsonData.push(entry);
      fs.writeFileSync(FILE_PATH, JSON.stringify(jsonData, null, 2));

      // --- ENVIAR A REACT ---
      io.emit("radar-data", entry);
    }
  } catch (err) {
    console.log("Error parseando datos:", err);
  }
});

// --- ERRORES DEL PUERTO SERIAL ---
port.on("error", err => {
  console.log("Error en el puerto serial:", err.message);
});

// --- SOCKET.IO ---
io.on("connection", socket => {
  console.log("Cliente conectado:", socket.id);

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

// --- INIT SERVER ---
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});
