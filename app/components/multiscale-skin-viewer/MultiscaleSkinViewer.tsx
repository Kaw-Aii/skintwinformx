
/**
 * Multiscale Skin Model Viewer
 * Interactive component for visualizing skin model across different scales
 */

import React, { useState, useEffect, useRef } from 'react';
import { MultiscaleCoordinator } from '~/lib/proof-assistant/multiscale-coordinator';
import type { MultiscaleState, ScaleType } from '~/lib/proof-assistant/multiscale-coordinator';

interface MultiscaleSkinViewerProps {
  coordinator?: MultiscaleCoordinator;
  onScaleChange?: (scale: ScaleType) => void;
}

export function MultiscaleSkinViewer({ coordinator, onScaleChange }: MultiscaleSkinViewerProps) {
  const [currentScale, setCurrentScale] = useState<ScaleType>('tissue');
  const [skinState, setSkinState] = useState<MultiscaleState | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationTime, setSimulationTime] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (coordinator) {
      setSkinState(coordinator.getState());
    }
  }, [coordinator]);

  useEffect(() => {
    if (skinState && canvasRef.current) {
      renderScale(currentScale);
    }
  }, [skinState, currentScale]);

  const handleScaleChange = (newScale: ScaleType) => {
    setCurrentScale(newScale);
    onScaleChange?.(newScale);
  };

  const startSimulation = () => {
    if (!coordinator) return;
    
    setIsSimulating(true);
    const interval = setInterval(() => {
      const newState = coordinator.advanceSimulation(1); // 1 unit time
      setSkinState(newState);
      setSimulationTime(prev => prev + 1);
      
      if (simulationTime > 1000) { // Stop after 1000 time units
        setIsSimulating(false);
        clearInterval(interval);
      }
    }, 100); // Update every 100ms
  };

  const stopSimulation = () => {
    setIsSimulating(false);
  };

  const renderScale = (scale: ScaleType) => {
    const canvas = canvasRef.current;
    if (!canvas || !skinState) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const scaleData = skinState[scale].state;
    
    switch (scale) {
      case 'molecular':
        renderMolecularScale(ctx, scaleData, canvas.width, canvas.height);
        break;
      case 'cellular':
        renderCellularScale(ctx, scaleData, canvas.width, canvas.height);
        break;
      case 'tissue':
        renderTissueScale(ctx, scaleData, canvas.width, canvas.height);
        break;
      case 'organ':
        renderOrganScale(ctx, scaleData, canvas.width, canvas.height);
        break;
    }
  };

  return (
    <div className="multiscale-skin-viewer p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Multiscale Skin Model</h2>
        
        {/* Scale Selection */}
        <div className="flex space-x-2 mb-4">
          {(['molecular', 'cellular', 'tissue', 'organ'] as ScaleType[]).map(scale => (
            <button
              key={scale}
              onClick={() => handleScaleChange(scale)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                currentScale === scale
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {scale.charAt(0).toUpperCase() + scale.slice(1)}
            </button>
          ))}
        </div>

        {/* Simulation Controls */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={startSimulation}
            disabled={isSimulating}
            className="px-4 py-2 bg-green-500 text-white rounded-md disabled:bg-gray-400"
          >
            {isSimulating ? 'Simulating...' : 'Start Simulation'}
          </button>
          <button
            onClick={stopSimulation}
            disabled={!isSimulating}
            className="px-4 py-2 bg-red-500 text-white rounded-md disabled:bg-gray-400"
          >
            Stop Simulation
          </button>
          <span className="px-4 py-2 bg-gray-100 rounded-md">
            Time: {simulationTime} units
          </span>
        </div>
      </div>

      {/* Visualization Canvas */}
      <div className="mb-6">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-300 rounded-md"
        />
      </div>

      {/* Scale Information */}
      {skinState && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-semibold mb-2">Current Scale: {currentScale}</h3>
            <div className="space-y-1 text-sm">
              <div>Dimensions: {skinState[currentScale].state.dimensions.join(' × ')}</div>
              <div>Time Step: {skinState[currentScale].timeStep}</div>
              <div>Units: {skinState[currentScale].state.metadata.units}</div>
              <div>Last Update: {skinState[currentScale].lastUpdate.toLocaleTimeString()}</div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-semibold mb-2">System Status</h3>
            <div className="space-y-1 text-sm">
              <div>Sync Status: {skinState.syncStatus}</div>
              <div>Global Time: {skinState.globalTime}</div>
              <div>Active Couplings: {skinState[currentScale].state.coupling_interfaces.length}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Rendering functions for different scales
function renderMolecularScale(
  ctx: CanvasRenderingContext2D, 
  data: any, 
  width: number, 
  height: number
) {
  // Render molecules as particles
  ctx.fillStyle = '#3B82F6';
  const pointSize = 2;
  
  for (let i = 0; i < data.data.length; i += 3) {
    const x = (data.data[i] || 0) * width / 100;
    const y = (data.data[i + 1] || 0) * height / 100;
    ctx.fillRect(x - pointSize/2, y - pointSize/2, pointSize, pointSize);
  }
}

function renderCellularScale(
  ctx: CanvasRenderingContext2D, 
  data: any, 
  width: number, 
  height: number
) {
  // Render cells as circles
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 1;
  
  const cellSize = 8;
  const gridW = Math.floor(width / cellSize);
  const gridH = Math.floor(height / cellSize);
  
  for (let x = 0; x < gridW; x++) {
    for (let y = 0; y < gridH; y++) {
      const dataIndex = y * gridW + x;
      if (dataIndex < data.data.length && data.data[dataIndex] > 0) {
        ctx.beginPath();
        ctx.arc(x * cellSize + cellSize/2, y * cellSize + cellSize/2, cellSize/3, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  }
}

function renderTissueScale(
  ctx: CanvasRenderingContext2D, 
  data: any, 
  width: number, 
  height: number
) {
  // Render tissue layers as horizontal bands
  const layerHeight = height / 3; // epidermis, dermis, hypodermis
  
  // Epidermis
  ctx.fillStyle = '#FEF3C7';
  ctx.fillRect(0, 0, width, layerHeight);
  
  // Dermis  
  ctx.fillStyle = '#DBEAFE';
  ctx.fillRect(0, layerHeight, width, layerHeight);
  
  // Hypodermis
  ctx.fillStyle = '#FEE2E2';
  ctx.fillRect(0, layerHeight * 2, width, layerHeight);
  
  // Add layer labels
  ctx.fillStyle = '#000';
  ctx.font = '14px sans-serif';
  ctx.fillText('Epidermis', 10, 20);
  ctx.fillText('Dermis', 10, layerHeight + 20);
  ctx.fillText('Hypodermis', 10, layerHeight * 2 + 20);
}

function renderOrganScale(
  ctx: CanvasRenderingContext2D, 
  data: any, 
  width: number, 
  height: number
) {
  // Render skin surface with temperature/hydration overlay
  const imageData = ctx.createImageData(width, height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      
      // Map data to color (temperature/hydration visualization)
      const dataIndex = Math.floor((y / height) * data.dimensions[0]) * data.dimensions[1] + 
                       Math.floor((x / width) * data.dimensions[1]);
      
      const value = data.data[dataIndex] || 0;
      const normalizedValue = Math.min(255, Math.max(0, value * 10));
      
      imageData.data[pixelIndex] = normalizedValue;     // Red channel
      imageData.data[pixelIndex + 1] = 100;            // Green channel  
      imageData.data[pixelIndex + 2] = 255 - normalizedValue; // Blue channel
      imageData.data[pixelIndex + 3] = 255;            // Alpha channel
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

export default MultiscaleSkinViewer;
