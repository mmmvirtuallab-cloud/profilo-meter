import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
const cn = (...classes) => classes.filter(Boolean).join(" ");

const ProfilometerLab = ({ onComplete, onStepChange }: { onComplete?: (data: { ra: number; rz: number; workpiece: string }) => void, onStepChange?: (step: string) => void }) => {
  const [selectedWorkpiece, setSelectedWorkpiece] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isZeroing, setIsZeroing] = useState(false);
  const [ra, setRa] = useState(null);
  const [rz, setRz] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [view, setView] = useState("top");
  const [stylusPosition, setStylusPosition] = useState(-10);
  const [isZeroed, setIsZeroed] = useState(false);

  useEffect(() => {
    if (!selectedWorkpiece) {
      onStepChange?.("select");
    } else if (!isZeroed) {
      onStepChange?.("zero");
    } else if (!isScanning && !ra) {
      onStepChange?.("scan");
    } else if (ra && rz) {
      onStepChange?.("complete");
    }
  }, [selectedWorkpiece, isZeroed, isScanning, ra, rz, onStepChange]);

  const workpieces = [
    {
      id: "machined",
      label: "Machined Surface",
      description: "Standard machined finish",
      color: "#6b7280",
      pattern: "machined"
    },
    {
      id: "polished",
      label: "Polished Surface",
      description: "High polish finish",
      color: "#94a3b8",
      pattern: "polished"
    },
    {
      id: "rough",
      label: "Rough Cast Surface",
      description: "As-cast rough surface",
      color: "#78716c",
      pattern: "rough"
    }
  ];

  const handleWorkpieceSelect = (id) => {
    if (!isScanning && !isZeroing) {
      setSelectedWorkpiece(id);
      setRa(null);
      setRz(null);
      setGraphData([]);
      setStylusPosition(-10);
      setIsZeroed(false);
    }
  };

  const handleZero = () => {
    if (!selectedWorkpiece || isScanning || isZeroing) return;
    
    setIsZeroing(true);
    
    setTimeout(() => {
      setStylusPosition(0);
      setTimeout(() => {
        setIsZeroing(false);
        setIsZeroed(true);
      }, 800);
    }, 100);
  };

  const handleStartMeasurement = () => {
    if (!selectedWorkpiece || !isZeroed || isScanning) return;

    setIsScanning(true);
    setRa(null);
    setRz(null);
    setGraphData([]);

    const generateProfile = () => {
      const points = 80;
      const data = [];
      
      for (let i = 0; i < points; i++) {
        let height = 0;
        
        switch (selectedWorkpiece) {
          case "polished":
            height = Math.sin(i * 0.3) * 0.2 + Math.random() * 0.15;
            break;
          case "machined":
            height = Math.sin(i * 0.5) * 0.8 + Math.random() * 0.5;
            break;
          case "rough":
            height = Math.sin(i * 0.2) * 2 + Math.cos(i * 0.7) * 1.5 + Math.random() * 1.8;
            break;
        }
        
        data.push({ x: i, height: height });
      }
      
      return data;
    };

    const profile = generateProfile();
    let currentPoint = 0;
    
    const scanInterval = setInterval(() => {
      if (currentPoint <= profile.length) {
        setGraphData(profile.slice(0, currentPoint));
        setStylusPosition((currentPoint / profile.length) * 100);
        currentPoint += 1;
      } else {
        clearInterval(scanInterval);
        
        const heights = profile.map(p => Math.abs(p.height));
        const raValue = heights.reduce((a, b) => a + b, 0) / heights.length;
        const rzValue = Math.max(...heights) - Math.min(...profile.map(p => p.height));
        
        setRa(raValue);
        setRz(rzValue);
        setIsScanning(false);
        if (onComplete) onComplete({ ra: raValue, rz: rzValue, workpiece: selectedWorkpiece });
      }
    }, 60);
  };

  const handleReset = () => {
    if (isScanning || isZeroing) return;
    setStylusPosition(-10);
    setIsZeroed(false);
  };

  const getWorkpieceColor = () => {
    const workpiece = workpieces.find(w => w.id === selectedWorkpiece);
    return workpiece?.color || "transparent";
  };

  const getWorkpiecePattern = () => {
    const workpiece = workpieces.find(w => w.id === selectedWorkpiece);
    return workpiece?.pattern || "";
  };
  const navigate = useNavigate();

  const handleGoToCalculations = () => {
    // Optional: Prevent going if no data is collected yet
    if (ra === null || rz === null || !selectedWorkpiece) {
      alert("Please complete the experiment scan first to generate data!");
      return;
    }

    // Navigate and pass the REAL state data
    navigate('/calculations', {
      state: {
        data: {
          ra: ra, 
          rz: rz,
          workpiece: selectedWorkpiece // Assuming this stores the ID string like 'machined'
        }
      }
    });
  };

  const getStepInfo = () => {
    if (!selectedWorkpiece) return { step: 1, title: "Select Sample", desc: "Choose a workpiece material from the left sidebar to begin." };
    if (!isZeroed) return { step: 2, title: "Calibrate Stylus", desc: "Click the 'Zero Stylus' button in the Controls panel below." };
    if (isScanning) return { step: 3, title: "Scanning...", desc: "Please wait while the profilometer records surface data." };
    if (!ra) return { step: 3, title: "Start Measurement", desc: "Click 'Start Measurement' to begin the surface scan." };
    return { step: 4, title: "Experiment Complete", desc: "Review the results below or click 'Calculations' in the top bar." };
  };

  const currentStep = getStepInfo();

  return (
    // 1. Change min-h-screen to h-screen and add flex-col to lock the height
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700 overflow-hidden">
      
      {/* --- TOP BAR (Fixed) --- */}
      <nav className="flex-none w-full flex justify-between items-center px-6 py-3 bg-slate-900/50 backdrop-blur-sm shadow-md border-b border-white/10 z-50">
        <h1 className="text-2xl font-bold text-white">
          Virtual Profilometer Lab
        </h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleGoToCalculations}
            disabled={!ra} 
            className={`
              px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors
              ${!ra 
                ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed border border-white/5' 
                : 'bg-green-600 text-white hover:bg-green-500'
              }
            `}
          >
            Calculations
          </button>
          <button 
            onClick={() => navigate('/')}
            className="bg-white text-slate-900 px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-100 transition-colors"
          >
            Introduction
          </button>
        </div>
      </nav>
      <div className="flex-none w-full bg-blue-600/10 border-b border-blue-500/20 backdrop-blur-md px-6 py-3 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* Step Number Bubble */}
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm
            ${currentStep.step === 4 ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}
          `}>
            {currentStep.step}
          </div>

          {/* Text Content */}
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
            <span className={`font-bold text-base ${currentStep.step === 4 ? 'text-green-400' : 'text-blue-400'}`}>
              {currentStep.title}:
            </span>
            <span className="text-sm text-slate-300">
              {currentStep.desc}
            </span>
          </div>

          {/* Progress Indicator (Dots) */}
          <div className="hidden md:flex gap-1.5 ml-8">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === currentStep.step 
                    ? (i === 4 ? 'bg-green-500 scale-125' : 'bg-blue-500 scale-125') 
                    : i < currentStep.step 
                      ? 'bg-blue-500/40' 
                      : 'bg-gray-600'
                }`} 
              />
            ))}
          </div>

        </div>
      </div>

      {/* --- MAIN CONTENT WRAPPER (Fills remaining space) --- */}
      <div className="flex-1 overflow-hidden relative">
        <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-0">
          
          {/* --- LEFT SIDEBAR (Scrollable) --- */}
          <div className="lg:col-span-1 h-full overflow-y-auto border-r border-white/10 bg-white/5 p-6 custom-scrollbar">
            <div className="space-y-10">
              <Card className="p-4 bg-transparent border-none shadow-none">
                <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Workpiece Selection</h2>
                <div className="space-y-3">
                  {workpieces.map((workpiece) => (
                    <Card
                      key={workpiece.id}
                      className={cn(
                        "p-3 cursor-pointer transition-all duration-300 hover:shadow-lg border-2 relative",
                        selectedWorkpiece === workpiece.id
                          ? "border-accent bg-accent/10 shadow-lg ring-2 ring-accent/50"
                          : "border-border hover:border-accent/50",
                        (isScanning || isZeroing) && "opacity-50"
                      )}
                      onClick={() => handleWorkpieceSelect(workpiece.id)}
                    >
                      {selectedWorkpiece === workpiece.id && (
                        <div className="absolute top-2 right-2 bg-accent text-accent-foreground rounded-full p-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                      )}
                      <div className="space-y-2">
                        <div
                          className="w-full h-10 rounded shadow-md relative overflow-hidden"
                          style={{
                            backgroundColor: workpiece.color,
                            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)"
                          }}
                        >
                          {/* Patterns */}
                          {workpiece.pattern === "rough" && (
                            <div className="absolute inset-0 opacity-60" style={{
                              backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px), repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.3) 3px, rgba(0,0,0,0.3) 5px)"
                            }} />
                          )}
                          {workpiece.pattern === "polished" && (
                            <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-white/20" />
                          )}
                          {workpiece.pattern === "machined" && (
                            <div className="absolute inset-0 opacity-40" style={{
                              backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)"
                            }} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-xs">{workpiece.label}</h3>
                          <p className="text-xs text-muted-foreground">{workpiece.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </div>
            
          </div>

          {/* --- RIGHT MAIN CONTENT (Scrollable) --- */}
          <div className="lg:col-span-4 h-full overflow-y-auto p-6 custom-scrollbar">
            <div className="space-y-6 pb-20"> {/* pb-20 adds space at bottom for scrolling */}
              
              {/* Animation View */}
              <Card className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-none shadow-xl">
                {view === "top" ? (
                  <TopView 
                    selectedWorkpiece={selectedWorkpiece}
                    getWorkpieceColor={getWorkpieceColor}
                    getWorkpiecePattern={getWorkpiecePattern}
                    stylusPosition={stylusPosition}
                    isScanning={isScanning}
                    isZeroing={isZeroing}
                    isZeroed={isZeroed}
                    handleStartMeasurement={handleStartMeasurement}
                    handleZero={handleZero}
                    handleReset={handleReset}
                  />
                ) : (
                  <FrontView
                    selectedWorkpiece={selectedWorkpiece}
                    getWorkpieceColor={getWorkpieceColor}
                    getWorkpiecePattern={getWorkpiecePattern}
                    stylusPosition={stylusPosition}
                    isScanning={isScanning}
                    isZeroing={isZeroing}
                    isZeroed={isZeroed}
                    handleStartMeasurement={handleStartMeasurement}
                    handleZero={handleZero}
                    handleReset={handleReset}

                  />
                )}
              </Card>

              {/* View Toggles & Controls Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column: View Toggles & Controls */}
                <div className="space-y-6">
                  <div className="flex flex-col gap-4">
  <button
    onClick={() => setView("top")}
    className={cn(
      "w-full px-6 py-2 rounded-lg font-medium transition-all", // Changed flex-1 to w-full
      view === "top"
        ? "bg-accent text-accent-foreground shadow-lg"
        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
    )}
  >
    Top View
  </button>
  <button
    onClick={() => setView("front")}
    className={cn(
      "w-full px-6 py-2 rounded-lg font-medium transition-all", // Changed flex-1 to w-full
      view === "front"
        ? "bg-accent text-accent-foreground shadow-lg"
        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
    )}
  >
    Front View
  </button>
</div>

                  
                </div>

                {/* Right Column: Results */}
                <div className="space-y-6">
  <Card className="p-3 h-full flex flex-col justify-center">
    <h2 className="text-sm font-semibold mb-2">Results</h2>
    <div className="flex gap-2">
      
      {/* Ra Result */}
      <div className="flex-1">
        <div className="text-[10px] text-muted-foreground mb-1 truncate">Ra (Avg)</div>
        <div className="bg-gray-900 text-green-400 rounded p-2 font-mono text-sm text-center shadow-inner">
          {isScanning ? "..." : ra !== null ? `${ra.toFixed(2)}` : "--"} <span className="text-[10px] text-green-600">μm</span>
        </div>
      </div>

      {/* Rz Result */}
      <div className="flex-1">
        <div className="text-[10px] text-muted-foreground mb-1 truncate">Rz (Max)</div>
        <div className="bg-gray-900 text-green-400 rounded p-2 font-mono text-sm text-center shadow-inner">
          {isScanning ? "..." : rz !== null ? `${rz.toFixed(2)}` : "--"} <span className="text-[10px] text-green-600">μm</span>
        </div>
      </div>

    </div>
  </Card>
</div>
              </div>

              {/* Graph Section */}
              <Card className="p-6 shadow-xl">
                <h2 className="text-xl font-semibold mb-4">Surface Profile Monitor</h2>
                <div className="bg-gray-900 rounded-lg p-4 h-64 border border-gray-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="x" stroke="#4ade80" tick={{ fill: "#4ade80" }} label={{ value: "Position (mm)", position: "insideBottom", offset: -5, fill: "#4ade80" }} />
                      <YAxis stroke="#4ade80" tick={{ fill: "#4ade80" }} label={{ value: "Height (μm)", angle: -90, position: "insideLeft", fill: "#4ade80" }} />
                      <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #4ade80" }} />
                      <Line type="monotone" dataKey="height" stroke="#4ade80" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </div>
);
};




const FrontView = ({ selectedWorkpiece, getWorkpieceColor, getWorkpiecePattern, stylusPosition, isScanning, isZeroing, handleReset, handleZero, isZeroed, handleStartMeasurement }) => {
  return (
    // Added 'gap-8' and 'px-4' for spacing between machine and controls
    <div className="relative w-full h-96 flex items-center justify-center overflow-x-auto custom-scrollbar gap-8 px-4">
      
      {/* --- MACHINE VISUALIZATION (Fixed Width) --- */}
      <div className="relative flex items-end justify-center shrink-0" style={{ width: '900px', height: '320px' }}>
        
        {/* Base platform */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-b from-gray-900 to-black rounded shadow-2xl border-t-2 border-gray-700" />

        {/* Table/workpiece holder */}
        <div className="absolute left-1/2 bottom-10 w-64 h-20 transform -translate-x-1/2" style={{ marginLeft: '-125px' }}>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-4 bg-gradient-to-b from-gray-700 to-gray-800 shadow-xl rounded" />
          
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-56 h-16 bg-gradient-to-b from-gray-800 to-gray-700 rounded shadow-inner border-2 border-gray-900">
            
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-12 bg-gradient-to-b from-gray-600 to-gray-700 shadow-lg rounded border-2 border-gray-800">
              
              {/* Workpiece */}
              {selectedWorkpiece && (
                <div
                  className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 w-40 h-8 rounded shadow-xl relative overflow-hidden"
                  style={{
                    backgroundColor: getWorkpieceColor(),
                    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4)"
                  }}
                >
                  {getWorkpiecePattern() === "polished" && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-white/30 rounded" />
                  )}
                  {getWorkpiecePattern() === "rough" && (
                    <div className="absolute inset-0 opacity-60" style={{
                      backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)"
                    }} />
                  )}
                  {getWorkpiecePattern() === "machined" && (
                    <div className="absolute inset-0 opacity-40" style={{
                      backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)"
                    }} />
                  )}
                </div>
              )}
              
              {/* Clamps */}
              {selectedWorkpiece && (
                <>
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-10 bg-gray-900 rounded shadow-lg" />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-10 bg-gray-900 rounded shadow-lg" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Vertical column and measurement arm */}
        <div className="absolute left-1/2 bottom-10 w-20 h-72 transform -translate-x-1/2" style={{ marginLeft: '100px' }}>
          <div className="absolute bottom-0 w-full h-12 bg-gradient-to-b from-gray-700 to-gray-800 rounded shadow-xl" />
          
          {/* Vertical post */}
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-12 h-60 bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 rounded-sm shadow-xl border-l-2 border-r-2 border-gray-400">
            <div className="absolute inset-0 flex flex-col justify-around py-2">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="h-0.5 bg-gray-800 opacity-50 mx-1" />
              ))}
            </div>
          </div>
          
          {/* Readout unit with arm */}
          <div className="absolute top-23 -right-32 w-72 h-28 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl border-2 border-gray-700 z-30">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
            {/* Display screen */}
            <div className="absolute top-4 left-6 right-6 h-14 bg-gray-900 rounded border-2 border-gray-800 flex items-center justify-center z-40">
              <span className="text-green-400 font-mono text-sm">
                {isScanning ? "SCANNING" : selectedWorkpiece ? "READY" : "---"}
              </span>
            </div>
            {/* Status LED */}
            <div className="absolute bottom-3 left-6 flex gap-2 z-40">
              <div className={cn("w-2 h-2 rounded-full", isScanning ? "bg-green-400 animate-pulse" : "bg-gray-600")} />
            </div>

            {/* Horizontal arm with stylus */}
            <div 
              className="absolute left-0 top-1/2 transform -translate-y-1/2 h-8 bg-gradient-to-l from-gray-600 to-gray-700 rounded-l shadow-2xl border-2 border-gray-500 transition-all z-10"
              style={{ 
                width: '250px',
                transform: `translateX(${(-40 - ((stylusPosition ) / 110) * 180)}px) translateY(-50%)`,
                transitionDuration: isZeroing ? '800ms' : '100ms'
              }}
            >
              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full border-2 border-gray-700 shadow-xl" />
              <div className="absolute left-0 top-full w-10 h-6 bg-gradient-to-br from-gray-600 to-gray-700 rounded shadow-lg border-2 border-gray-500" />
              <div className="absolute left-5 top-full transform -translate-x-1/2 w-1.5 h-6 bg-gradient-to-b from-gray-500 via-gray-400 to-orange-500 rounded-full shadow-md mt-6" />
              <div className="absolute left-5 top-full transform -translate-x-1/2 w-1 h-1.5 bg-orange-600 rounded-full shadow-sm mt-12" />
              {(isScanning || isZeroing) && (
                <div className="absolute left-5 top-full transform -translate-x-1/2 w-3 h-3 bg-orange-400 rounded-full opacity-50 blur-sm animate-pulse mt-12" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- SIDEBAR CONTROLS (Fixed Width & Dark Theme) --- */}
      <Card className="w-48 shrink-0 p-3 bg-slate-900/50 backdrop-blur-md border border-white/10 shadow-xl z-20">
        <h2 className="text-sm font-semibold mb-2 text-white">Controls</h2>
        <div className="space-y-2">
          <button
            onClick={handleZero}
            disabled={!selectedWorkpiece || isScanning || isZeroing || isZeroed}
            className={cn(
              "w-full py-1.5 px-3 rounded text-xs font-medium transition-all",
              !selectedWorkpiece || isScanning || isZeroing || isZeroed
                ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow hover:shadow-blue-500/20"
            )}
          >
            {isZeroing ? "Zeroing..." : isZeroed ? "✓ Zeroed" : "Zero Stylus"}
          </button>
          
          <button
            onClick={handleStartMeasurement}
            disabled={!isZeroed || isScanning}
            className={cn(
              "w-full py-1.5 px-3 rounded text-xs font-medium transition-all",
              !isZeroed || isScanning
                ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5"
                : "bg-green-600 hover:bg-green-500 text-white shadow hover:shadow-green-500/20"
            )}
          >
            {isScanning ? "Measuring..." : "Start Measurement"}
          </button>
          
          <button
            onClick={handleReset}
            disabled={isScanning || isZeroing || stylusPosition === -10}
            className={cn(
              "w-full py-1.5 px-3 rounded text-xs font-medium transition-all",
              isScanning || isZeroing || stylusPosition === -10
                ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5"
                : "bg-orange-600 hover:bg-orange-500 text-white shadow hover:shadow-orange-500/20"
            )}
          >
            Reset Position
          </button>
        </div>
      </Card>

    </div>
  );
};

const TopView = ({ selectedWorkpiece, getWorkpieceColor, getWorkpiecePattern, stylusPosition, isScanning, isZeroing,handleReset, handleZero, isZeroed, handleStartMeasurement }) => {
  return (
    <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden">
      {/* Black table surface background - centered */}
      <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-2xl shadow-2xl border-4 border-slate-700" style={{ width: '1100px', height: '380px', padding: '50px' }}>
        {/* Centered container for entire setup - shifted right */}
        <div className="relative flex items-center justify-center w-full h-full" style={{ marginLeft: '100px' }}>
        
        {/* Main base/table */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-80 h-48 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded shadow-inner border-2 border-gray-800">
          {/* Table lines */}
          <div className="absolute inset-0 flex flex-col justify-around py-2">
            {[...Array(14)].map((_, i) => (
              <div key={i} className="h-0.5 w-full bg-gray-900 opacity-40" />
            ))}
          </div>

          {/* Workpiece on table */}
          {selectedWorkpiece && (
            <div
              className="absolute top-1/2 transform -translate-y-1/2 w-48 h-24 rounded shadow-xl relative overflow-hidden"
              style={{
                left: '85px',
                backgroundColor: getWorkpieceColor(),
                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4)"
              }}
            >
              {getWorkpiecePattern() === "rough" && (
                <div className="absolute inset-0 opacity-60" style={{
                  backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px), repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.3) 3px, rgba(0,0,0,0.3) 5px)"
                }} />
              )}
              {getWorkpiecePattern() === "polished" && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20" />
              )}
              {getWorkpiecePattern() === "machined" && (
                <div className="absolute inset-0 opacity-50" style={{
                  backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)"
                }} />
              )}
            </div>
          )}
        </div>

        {/* Readout unit with integrated display */}
        <div className="absolute left-96 top-1/2 transform -translate-y-1/2 w-56 h-32 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg shadow-2xl border-2 border-gray-600 z-10">
          {/* Inner panel */}
          <div className="absolute inset-2 bg-gradient-to-br from-gray-600 via-gray-500 to-gray-600 rounded shadow-inner" />
          
          {/* Display screen - integrated into readout unit */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-16 bg-gray-900 rounded border-2 border-gray-800 flex items-center justify-center z-10">
            <span className="text-green-400 font-mono text-base font-bold">
              {isScanning ? "SCANNING" : selectedWorkpiece ? "READY" : "NO SAMPLE"}
            </span>
          </div>
          
          {/* Status indicators */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
            <div className={cn("w-2 h-2 rounded-full", isScanning ? "bg-green-400 animate-pulse" : "bg-gray-600")} />
            <div className={cn("w-2 h-2 rounded-full", selectedWorkpiece ? "bg-yellow-400" : "bg-gray-600")} />
          </div>

          {/* Horizontal arm extending LEFT - moves from left to right */}
          <div 
            className="absolute right-full top-1/2 transform -translate-y-1/2 h-10 bg-gradient-to-l from-gray-600 to-gray-700 shadow-xl border-2 border-gray-500 transition-all"
            style={{ 
              width: '370px',
              left: `${-100 - ((stylusPosition + 10) / 110) * 192}px`,
              transitionDuration: isZeroing ? '800ms' : '100ms'
            }}
          >
            {/* Stylus holder and stylus at LEFT end of arm */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-gray-600 via-gray-500 to-gray-600 rounded shadow-xl border-2 border-gray-400">
              <div className="absolute top-1 left-1.5 w-1 h-1 bg-gray-800 rounded-full" />
              <div className="absolute top-1 right-1.5 w-1 h-1 bg-gray-800 rounded-full" />
            </div>

            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full shadow-lg border-2 border-gray-700">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-orange-600 rounded-full" />
            </div>
            
            {(isScanning || isZeroing) && (
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-orange-400 rounded-full opacity-50 blur-sm animate-pulse" />
            )}
          </div>
        </div>

        {/* Data collection unit - hidden underneath readout unit */}
        <div className="absolute left-96 top-1/2 transform -translate-y-1/2 w-56 h-32 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg shadow-2xl border-2 border-gray-600 z-0">
          {/* Internal panel */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-20 bg-gradient-to-br from-gray-600 via-gray-500 to-gray-600 rounded shadow-inner border-2 border-gray-400">
            <div className="absolute inset-0 flex flex-col justify-around py-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-0.5 w-full bg-gray-800 opacity-40" />
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
      <Card className="w-48 shrink-0 p-3 bg-slate-900/50 backdrop-blur-md border border-white/10 shadow-xl z-20">
        <h2 className="text-sm font-semibold mb-2 text-white">Controls</h2>
        <div className="space-y-2">
          <button
            onClick={handleZero}
            disabled={!selectedWorkpiece || isScanning || isZeroing || isZeroed}
            className={cn(
              "w-full py-1.5 px-3 rounded text-xs font-medium transition-all",
              !selectedWorkpiece || isScanning || isZeroing || isZeroed
                ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow hover:shadow-blue-500/20"
            )}
          >
            {isZeroing ? "Zeroing..." : isZeroed ? "✓ Zeroed" : "Zero Stylus"}
          </button>
          
          <button
            onClick={handleStartMeasurement}
            disabled={!isZeroed || isScanning}
            className={cn(
              "w-full py-1.5 px-3 rounded text-xs font-medium transition-all",
              !isZeroed || isScanning
                ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5"
                : "bg-green-600 hover:bg-green-500 text-white shadow hover:shadow-green-500/20"
            )}
          >
            {isScanning ? "Measuring..." : "Start Measurement"}
          </button>
          
          <button
            onClick={handleReset}
            disabled={isScanning || isZeroing || stylusPosition === -10}
            className={cn(
              "w-full py-1.5 px-3 rounded text-xs font-medium transition-all",
              isScanning || isZeroing || stylusPosition === -10
                ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5"
                : "bg-orange-600 hover:bg-orange-500 text-white shadow hover:shadow-orange-500/20"
            )}
          >
            Reset Position
          </button>
        </div>
      </Card>
    </div>
  );
};

export default ProfilometerLab;
