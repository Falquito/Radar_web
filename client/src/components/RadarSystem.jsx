import React, { useState, useEffect, useRef } from 'react';

const RadarSystem = () => {
  const canvasRef = useRef(null);
  const [angle, setAngle] = useState(127);
  const [distance, setDistance] = useState(83);
  const [isConnected, setIsConnected] = useState(false);
  const [serialPort, setSerialPort] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState(3);
  const [totalRecords, setTotalRecords] = useState(1247);
  const [detectionHistory, setDetectionHistory] = useState([
    { id: 1, timestamp: '2025-01-16 14:32:16', distance: 78, angle: 127, status: 'Detectado' },
    { id: 2, timestamp: '2025-01-16 14:32:12', distance: 95, angle: 86, status: 'Detectado' },
    { id: 3, timestamp: '2025-01-16 14:32:09', distance: 52, angle: 45, status: 'Detectado' },
    { id: 4, timestamp: '2025-01-16 14:32:06', distance: 134, angle: 200, status: 'Fuera de rango' },
    { id: 5, timestamp: '2025-01-16 14:32:03', distance: 67, angle: 100, status: 'Detectado' },
  ]);

  // Estados para simulación
  const [simulationMode, setSimulationMode] = useState(true);
  const [lastDetectionTime, setLastDetectionTime] = useState(Date.now());

  // Constantes
  const RANGE_MAX_CM = 400;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      drawRadar();
    }
  }, [angle, distance, detectionHistory]);

  // Simulación
  useEffect(() => {
    if (simulationMode) {
      const interval = setInterval(() => {
        const newAngle = Math.floor(Math.random() * 180);
        const newDistance = Math.floor(Math.random() * 200) + 20;
        
        setAngle(newAngle);
        setDistance(newDistance);
        setLastDetectionTime(Date.now());
        
        // Agregar nueva detección al historial ocasionalmente
        if (Math.random() < 0.3) {
          const newDetection = {
            id: Date.now(),
            timestamp: new Date().toLocaleString('es-ES'),
            distance: newDistance,
            angle: newAngle,
            status: newDistance <= RANGE_MAX_CM ? 'Detectado' : 'Fuera de rango'
          };
          
          setDetectionHistory(prev => [newDetection, ...prev.slice(0, 4)]);
          setTotalRecords(prev => prev + 1);
          
          if (newDistance <= RANGE_MAX_CM) {
            setDetectedObjects(prev => prev + 1);
          }
        }
      }, 150);

      return () => clearInterval(interval);
    }
  }, [simulationMode]);

  const drawRadar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 50;
    const radius = Math.min(canvas.width, canvas.height - 100) / 2;

    // Limpiar canvas
    ctx.fillStyle = '#0a0f1c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar anillos del radar
    ctx.strokeStyle = '#1a4a54';
    ctx.lineWidth = 1;
    
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius * i) / 4, Math.PI, 2 * Math.PI);
      ctx.stroke();
    }

    // Líneas radiales
    ctx.strokeStyle = '#1a4a54';
    for (let i = 0; i <= 180; i += 30) {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      const x = centerX + radius * Math.cos((i * Math.PI) / 180 + Math.PI);
      const y = centerY + radius * Math.sin((i * Math.PI) / 180 + Math.PI);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Etiquetas de distancia
    ctx.fillStyle = '#4ade80';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    
    const distances = ['100cm', '150cm', '200cm', '250cm'];
    distances.forEach((dist, i) => {
      const r = (radius * (i + 1)) / 4;
      ctx.fillText(dist, centerX, centerY - r + 5);
    });

    // Gradiente de barrido
    const gradient = ctx.createConicGradient(0, centerX, centerY);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.1, 'rgba(74, 222, 128, 0.1)');
    gradient.addColorStop(0.2, 'rgba(74, 222, 128, 0.3)');
    gradient.addColorStop(0.3, 'rgba(74, 222, 128, 0.1)');
    gradient.addColorStop(1, 'transparent');

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.restore();

    // Línea de barrido principal
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#4ade80';
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    const sweepX = centerX + radius * Math.cos((angle * Math.PI) / 180 + Math.PI);
    const sweepY = centerY + radius * Math.sin((angle * Math.PI) / 180 + Math.PI);
    ctx.lineTo(sweepX, sweepY);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Dibujar objetos detectados del historial
    detectionHistory.forEach((detection, index) => {
      if (detection.status === 'Detectado' && detection.distance <= RANGE_MAX_CM) {
        const objRadius = (detection.distance / RANGE_MAX_CM) * radius;
        const objX = centerX + objRadius * Math.cos((detection.angle * Math.PI) / 180 + Math.PI);
        const objY = centerY + objRadius * Math.sin((detection.angle * Math.PI) / 180 + Math.PI);
        
        // Efecto de fade para objetos más antiguos
        const opacity = Math.max(0.2, 1 - (index * 0.2));
        
        ctx.fillStyle = `rgba(74, 222, 128, ${opacity})`;
        ctx.beginPath();
        ctx.arc(objX, objY, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Pulso para el objeto más reciente
        if (index === 0) {
          ctx.strokeStyle = `rgba(74, 222, 128, ${0.5 * opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(objX, objY, 8, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    });

    // Ángulos en los bordes
    ctx.fillStyle = '#4ade80';
    ctx.font = '11px monospace';
    [0, 30, 60, 90, 120, 150, 180].forEach(deg => {
      const x = centerX + (radius + 15) * Math.cos((deg * Math.PI) / 180 + Math.PI);
      const y = centerY + (radius + 15) * Math.sin((deg * Math.PI) / 180 + Math.PI);
      ctx.textAlign = 'center';
      ctx.fillText(`${deg}°`, x, y);
    });
  };

  const connectToArduino = async () => {
    try {
      if ('serial' in navigator) {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });
        
        setSerialPort(port);
        setIsConnected(true);
        setSimulationMode(false);
        
        const reader = port.readable.getReader();
        let buffer = '';
        
        const readLoop = async () => {
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              
              const text = new TextDecoder().decode(value);
              buffer += text;
              
              let dotIndex;
              while ((dotIndex = buffer.indexOf('.')) !== -1) {
                const line = buffer.substring(0, dotIndex);
                buffer = buffer.substring(dotIndex + 1);
                
                const parts = line.split(',');
                if (parts.length === 2) {
                  const newAngle = parseInt(parts[0].trim());
                  const newDistance = parseInt(parts[1].trim());
                  
                  if (!isNaN(newAngle) && !isNaN(newDistance)) {
                    setAngle(newAngle);
                    setDistance(newDistance);
                    setLastDetectionTime(Date.now());
                    
                    const newDetection = {
                      id: Date.now(),
                      timestamp: new Date().toLocaleString('es-ES'),
                      distance: newDistance,
                      angle: newAngle,
                      status: newDistance <= RANGE_MAX_CM ? 'Detectado' : 'Fuera de rango'
                    };
                    
                    setDetectionHistory(prev => [newDetection, ...prev.slice(0, 4)]);
                    setTotalRecords(prev => prev + 1);
                  }
                }
              }
            }
          } catch (error) {
            console.log('Error leyendo del puerto serie:', error);
          }
        };
        
        readLoop();
      } else {
        alert('Web Serial API no está disponible en este navegador');
      }
    } catch (error) {
      console.error('Error conectando al Arduino:', error);
    }
  };

  const getTimeSinceLastDetection = () => {
    const now = Date.now();
    const seconds = Math.floor((now - lastDetectionTime) / 1000);
    return `hace ${seconds} segundos`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-teal-600 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-mono text-teal-400 font-bold tracking-wider">
              SISTEMA DE RADAR ARDUINO
            </h1>
            <p className="text-sm text-gray-400">
              Monitoreo en tiempo real de objetos detectados
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-mono">ACTIVO</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 p-4">
        {/* Panel principal del radar */}
        <div className="flex-1">
          <div className="bg-slate-800 border border-teal-600 rounded-lg">
            <div className="border-b border-teal-600 p-3">
              <h2 className="text-teal-400 font-mono">PANTALLA DE RADAR</h2>
            </div>
            <div className="p-4">
              <canvas
                ref={canvasRef}
                className="w-full h-96 border border-teal-700 rounded bg-slate-900"
                style={{ minHeight: '400px' }}
              />
            </div>
          </div>
          
          {/* Historial de detecciones */}
          <div className="mt-4 bg-slate-800 border border-teal-600 rounded-lg">
            <div className="border-b border-teal-600 p-3">
              <h3 className="text-teal-400 font-mono">HISTORIAL DE DETECCIONES</h3>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-mono">
                  <thead>
                    <tr className="border-b border-teal-700">
                      <th className="text-left p-2 text-teal-400">ID</th>
                      <th className="text-left p-2 text-teal-400">Marca de Tiempo</th>
                      <th className="text-left p-2 text-teal-400">Distancia (cm)</th>
                      <th className="text-left p-2 text-teal-400">Ángulo (°)</th>
                      <th className="text-left p-2 text-teal-400">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detectionHistory.map((detection) => (
                      <tr key={detection.id} className="border-b border-slate-700 hover:bg-slate-700">
                        <td className="p-2">#{detection.id.toString().slice(-2)}</td>
                        <td className="p-2">{detection.timestamp}</td>
                        <td className="p-2 text-green-400">{detection.distance}</td>
                        <td className="p-2 text-green-400">{detection.angle}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            detection.status === 'Detectado' 
                              ? 'bg-green-900 text-green-400' 
                              : 'bg-orange-900 text-orange-400'
                          }`}>
                            {detection.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Panel lateral de estadísticas */}
        <div className="w-80 space-y-4">
          {/* Estadísticas */}
          <div className="bg-slate-800 border border-teal-600 rounded-lg">
            <div className="border-b border-teal-600 p-3">
              <h3 className="text-teal-400 font-mono">ESTADÍSTICAS</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-400">Objetos Detectados</span>
                </div>
                <span className="text-green-400 font-mono text-xl">{detectedObjects}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-400">Ángulo Actual</span>
                </div>
                <span className="text-green-400 font-mono text-xl">{angle}°</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-400">Distancia Promedio</span>
                </div>
                <span className="text-green-400 font-mono text-xl">{distance} cm</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-400">Registros en BD</span>
                </div>
                <span className="text-green-400 font-mono text-xl">{totalRecords.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Última detección */}
          <div className="bg-slate-800 border border-teal-600 rounded-lg">
            <div className="border-b border-teal-600 p-3">
              <h3 className="text-teal-400 font-mono">ÚLTIMA DETECCIÓN</h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <span className="text-gray-400 text-sm">Tiempo:</span>
                <div className="text-green-400 font-mono">{getTimeSinceLastDetection()}</div>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Distancia:</span>
                <div className="text-white font-mono">{distance} cm</div>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Ángulo:</span>
                <div className="text-white font-mono">{angle}°</div>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Estado:</span>
                <div className={`font-mono ${
                  distance <= RANGE_MAX_CM ? 'text-green-400' : 'text-orange-400'
                }`}>
                  {distance <= RANGE_MAX_CM ? 'EN RANGO' : 'FUERA DE RANGO'}
                </div>
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="bg-slate-800 border border-teal-600 rounded-lg">
            <div className="border-b border-teal-600 p-3">
              <h3 className="text-teal-400 font-mono">CONTROLES</h3>
            </div>
            <div className="p-4 space-y-3">
              {!isConnected ? (
                <button
                  onClick={connectToArduino}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-mono rounded transition-colors"
                >
                  CONECTAR ARDUINO
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (serialPort) {
                      serialPort.close();
                      setSerialPort(null);
                      setIsConnected(false);
                      setSimulationMode(true);
                    }
                  }}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-mono rounded transition-colors"
                >
                  DESCONECTAR
                </button>
              )}
              
              <button
                onClick={() => setSimulationMode(!simulationMode)}
                className={`w-full px-4 py-2 font-mono rounded transition-colors ${
                  simulationMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {simulationMode ? 'SIMULACIÓN: ON' : 'SIMULACIÓN: OFF'}
              </button>

              <div className={`text-center p-2 rounded font-mono text-sm ${
                isConnected ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
              }`}>
                {isConnected ? 'ARDUINO CONECTADO' : 'ARDUINO DESCONECTADO'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadarSystem;