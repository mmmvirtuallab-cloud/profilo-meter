import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../experiment/ui/button";
import { Card } from "../experiment/ui/card";


const CalculationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state?.data;

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-6">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Data Available</h2>
          <p className="mb-6">Please complete the experiment first.</p>
          <Button onClick={() => navigate("/experiment")}>Go to Experiment</Button>
        </Card>
      </div>
    );
  }

  const { ra, rz, workpiece } = data;

  const workpieceNames = {
    machined: "Machined Surface",
    polished: "Polished Surface",
    rough: "Rough Cast Surface"
  };


return (
  <div className="min-h-screen bg-slate-800 text-slate-200 p-6 md:p-12 relative">
    
    {/* Back Button - Simple & Clean */}
    <Button
      onClick={() => navigate("/lab")}
      variant="outline"
      className="absolute top-6 left-6 gap-2 bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all"
    >
      Back to Lab
    </Button>

    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pt-10">
      
      {/* Header - Professional White */}
      <div className="text-center space-y-2 border-b border-slate-800 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          Model Calculations
        </h1>
        <p className="text-slate-400">
          Analysis of Surface Roughness Parameters
        </p>
      </div>

      {/* Workpiece Info - Simple Slate Card */}
      <Card className="p-6 bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-400">Measured Workpiece</h2>
          <p className="text-xl font-bold text-white">{workpieceNames[workpiece]}</p>
        </div>
      </Card>

      {/* Ra Calculation - Engineering Style */}
      <Card className="p-0 bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
            Ra <span className="text-slate-500 font-normal text-base">- Arithmetic Average Roughness</span>
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Formula Box */}
            <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
              <p className="text-sm text-slate-500 mb-2 uppercase tracking-wider font-semibold">Formula</p>
              <p className="text-lg font-mono text-slate-300">Ra = (1/n) × Σ|yi|</p>
            </div>

            {/* Value Box - Matches Lab Display (Green Text) */}
            <div className="bg-black/40 rounded-lg p-4 border border-slate-800 flex flex-col justify-center">
              <p className="text-sm text-slate-500 mb-1 uppercase tracking-wider font-semibold">Calculated Value</p>
              <p className="text-3xl font-mono font-bold text-green-400">
                {ra.toFixed(4)} <span className="text-lg text-green-400/70">μm</span>
              </p>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              where yi is the vertical deviation from the mean line at point i
            </p>
          </div>
          
          <p className="text-slate-400 text-sm leading-relaxed border-t border-slate-800 pt-4">
            <strong>Definition:</strong> Ra represents the arithmetic average of the absolute values of the profile deviations from the mean line. It is the most commonly used parameter to quantify surface roughness.
          </p>
           
        </div>
      </Card>

      {/* Rz Calculation - Same Professional Style */}
      <Card className="p-0 bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
            Rz <span className="text-slate-500 font-normal text-base">- Maximum Height of Profile</span>
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Formula Box */}
            <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
              <p className="text-sm text-slate-500 mb-2 uppercase tracking-wider font-semibold">Formula</p>
              <p className="text-lg font-mono text-slate-300">Rz = Zmax - Zmin</p>
            </div>

            {/* Value Box */}
            <div className="bg-black/40 rounded-lg p-4 border border-slate-800 flex flex-col justify-center">
              <p className="text-sm text-slate-500 mb-1 uppercase tracking-wider font-semibold">Calculated Value</p>
              <p className="text-3xl font-mono font-bold text-green-400">
                {rz.toFixed(4)} <span className="text-lg text-green-400/70">μm</span>
              </p>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              where Zmax is the highest peak and Zmin is the lowest valley
            </p>
          </div>
          
          <p className="text-slate-400 text-sm leading-relaxed border-t border-slate-800 pt-4">
            <strong>Definition:</strong> Rz represents the vertical distance between the highest peak and the lowest valley within the evaluation length. It detects extreme surface features more effectively than Ra.
          </p>
          
        </div>
      </Card>

      {/* Download Button - Solid Blue, Professional */}
     
      
    </div>
  </div>
);
   
};

export default CalculationPage;
