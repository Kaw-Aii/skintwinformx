/**
 * Enhanced SKIN-TWIN Formulation Proof Assistant UI Component
 *
 * Updated interface that integrates all enhanced subsystems:
 * - JAX CEO subsystem for ML predictions
 * - Deep Tree Echo for cognitive insights
 * - Enhanced formal logic for theorem proving
 * - Integrated verification engine
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BeakerIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  LightBulbIcon,
  CpuChipIcon,
  CalculatorIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

import type {
  VerificationRequest,
  IngredientEffect,
  FormulationConstraint,
} from '~/lib/proof-assistant/types';

import { EnhancedVerificationEngine, type EnhancedVerificationResult } from '~/lib/proof-assistant/enhanced-verification-engine';
import { MultiscaleCoordinator } from '~/lib/proof-assistant/multiscale-coordinator';
import MultiscaleSkinViewer from '../multiscale-skin-viewer/MultiscaleSkinViewer';
import type { ScaleType } from '~/lib/proof-assistant/multiscale-coordinator';

interface EnhancedProofAssistantProps {
  onVerificationComplete?: (result: EnhancedVerificationResult) => void;
  initialHypothesis?: string;
  availableIngredients?: Array<{
    id: string;
    label: string;
    inci_name: string;
    category: string;
    molecular_weight: number;
    safety_rating: string;
  }>;
}

export function EnhancedProofAssistant({
  onVerificationComplete,
  initialHypothesis = '',
  availableIngredients = [],
}: EnhancedProofAssistantProps) {
  // Core state
  const [hypothesis, setHypothesis] = useState(initialHypothesis);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [targetEffects, setTargetEffects] = useState<IngredientEffect[]>([]);
  const [constraints, setConstraints] = useState<FormulationConstraint[]>([]);
  const [verificationResult, setVerificationResult] = useState<EnhancedVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Enhanced subsystem states
  const [activeSubsystems, setActiveSubsystems] = useState({
    ceo: true,
    deepTreeEcho: true,
    enhancedFormalLogic: true,
    legacyVerification: true
  });

  // Visualization states
  const [activeTab, setActiveTab] = useState<'verification' | 'ml' | 'cognitive' | 'formal' | 'integration'>('verification');
  const [coordinator] = useState(() => new MultiscaleCoordinator());
  const [activeScale, setActiveScale] = useState<ScaleType>('tissue');
  const [verificationEngine] = useState(() => new EnhancedVerificationEngine({
    enableCEO: activeSubsystems.ceo,
    enableDeepTreeEcho: activeSubsystems.deepTreeEcho,
    enableEnhancedFormalLogic: activeSubsystems.enhancedFormalLogic,
    enableLegacyVerification: activeSubsystems.legacyVerification
  }));

  // Performance monitoring
  const [systemMetrics, setSystemMetrics] = useState<any>(null);

  useEffect(() => {
    // Update system metrics periodically
    const interval = setInterval(() => {
      const metrics = verificationEngine.getSystemMetrics();
      setSystemMetrics(metrics);
    }, 5000);

    return () => clearInterval(interval);
  }, [verificationEngine]);

  const handleEnhancedVerification = useCallback(async () => {
    if (!hypothesis.trim()) {
      alert('Please enter a hypothesis to verify');
      return;
    }

    if (selectedIngredients.length === 0) {
      alert('Please select at least one ingredient');
      return;
    }

    setIsVerifying(true);

    try {
      const ingredients = availableIngredients.filter((ing) => selectedIngredients.includes(ing.id));

      const request: VerificationRequest = {
        hypothesis,
        ingredients,
        targetEffects,
        constraints,
        skinModel: {
          layers: [
            {
              id: 'stratum_corneum',
              name: 'Stratum Corneum',
              depth: 15,
              cellTypes: ['corneocytes'],
              permeability: 0.1,
              ph: 5.5,
              functions: ['barrier', 'protection'],
            },
            {
              id: 'epidermis',
              name: 'Epidermis',
              depth: 100,
              cellTypes: ['keratinocytes'],
              permeability: 0.3,
              ph: 6.5,
              functions: ['renewal'],
            },
          ],
          barriers: [],
          transport: [],
        },
      };

      const result = await verificationEngine.verifyFormulationEnhanced(request);
      setVerificationResult(result);
      onVerificationComplete?.(result);
    } catch (error) {
      console.error('Enhanced verification failed:', error);
      alert('Enhanced verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [
    hypothesis,
    selectedIngredients,
    targetEffects,
    constraints,
    availableIngredients,
    verificationEngine,
    onVerificationComplete,
  ]);

  const handleOptimizeFormulation = useCallback(async () => {
    if (!verificationResult || verificationResult.confidence > 0.9) {
      return;
    }

    setIsVerifying(true);

    try {
      const ingredients = availableIngredients.filter((ing) => selectedIngredients.includes(ing.id));

      const request: VerificationRequest = {
        hypothesis,
        ingredients,
        targetEffects,
        constraints,
        skinModel: verificationResult.proof.hypothesis as any, // Simplified
      };

      const optimizationResult = await verificationEngine.optimizeFormulation(request, ['safety', 'efficacy']);
      
      // Update form with optimized parameters
      setHypothesis(optimizationResult.optimizedFormulation.hypothesis);
      
      // Re-verify with optimized formulation
      const newResult = await verificationEngine.verifyFormulationEnhanced(optimizationResult.optimizedFormulation);
      setVerificationResult(newResult);
      
    } catch (error) {
      console.error('Optimization failed:', error);
      alert('Formulation optimization failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [verificationResult, hypothesis, selectedIngredients, targetEffects, constraints, availableIngredients, verificationEngine]);

  const addTargetEffect = useCallback(() => {
    setTargetEffects((prev) => [
      ...prev,
      {
        ingredientId: selectedIngredients[0] || '',
        targetLayer: 'epidermis',
        effectType: 'hydration',
        magnitude: 1.0,
        timeframe: 60,
        confidence: 0.8,
        mechanismOfAction: 'barrier_enhancement',
      },
    ]);
  }, [selectedIngredients]);

  const addConstraint = useCallback(() => {
    setConstraints((prev) => [
      ...prev,
      {
        type: 'ph',
        parameter: 'ph_range',
        value: 6.5,
        operator: 'eq',
        required: true,
      },
    ]);
  }, []);

  const toggleSubsystem = useCallback((subsystem: keyof typeof activeSubsystems) => {
    setActiveSubsystems(prev => ({
      ...prev,
      [subsystem]: !prev[subsystem]
    }));
  }, []);

  return (
    <div className="enhanced-proof-assistant-container p-6 max-w-7xl mx-auto">
      {/* Header with System Status */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Enhanced SKIN-TWIN Proof Assistant</h2>
        
        {/* Subsystem Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <SubsystemStatus
            name="CEO (JAX ML)"
            active={activeSubsystems.ceo}
            icon={<CpuChipIcon className="w-5 h-5" />}
            onToggle={() => toggleSubsystem('ceo')}
            metrics={systemMetrics?.subsystemStatus.get('ceo')}
          />
          <SubsystemStatus
            name="Deep Tree Echo"
            active={activeSubsystems.deepTreeEcho}
            icon={<CpuChipIcon className="w-5 h-5" />}
            onToggle={() => toggleSubsystem('deepTreeEcho')}
            metrics={systemMetrics?.subsystemStatus.get('echo')}
          />
          <SubsystemStatus
            name="Enhanced Logic"
            active={activeSubsystems.enhancedFormalLogic}
            icon={<CalculatorIcon className="w-5 h-5" />}
            onToggle={() => toggleSubsystem('enhancedFormalLogic')}
            metrics={systemMetrics?.subsystemStatus.get('formal')}
          />
          <SubsystemStatus
            name="Legacy Engine"
            active={activeSubsystems.legacyVerification}
            icon={<BeakerIcon className="w-5 h-5" />}
            onToggle={() => toggleSubsystem('legacyVerification')}
            metrics={systemMetrics?.subsystemStatus.get('legacy')}
          />
        </div>

        {/* Performance Metrics */}
        {systemMetrics && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Avg Processing Time:</span>
                <span className="ml-2">{systemMetrics.averageProcessingTime.toFixed(0)}ms</span>
              </div>
              <div>
                <span className="font-medium">Consensus Rate:</span>
                <span className="ml-2">{(systemMetrics.consensusRate * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="font-medium">Error Rate:</span>
                <span className="ml-2">{(systemMetrics.errorRate * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="font-medium">System Reliability:</span>
                <span className="ml-2">{(systemMetrics.performanceMetrics.get('systemReliability') || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-6">
          {/* Hypothesis Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formulation Hypothesis
            </label>
            <textarea
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="Enter your formulation hypothesis (e.g., 'Combining 2% niacinamide with 0.5% hyaluronic acid will improve skin hydration by 30%')..."
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Ingredient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Ingredients
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
              {availableIngredients.map((ingredient) => (
                <label key={ingredient.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedIngredients.includes(ingredient.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIngredients(prev => [...prev, ingredient.id]);
                      } else {
                        setSelectedIngredients(prev => prev.filter(id => id !== ingredient.id));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">
                    {ingredient.label} ({ingredient.inci_name})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Target Effects */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Target Effects
              </label>
              <button
                onClick={addTargetEffect}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Effect
              </button>
            </div>
            <div className="space-y-2">
              {targetEffects.map((effect, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <span>{effect.effectType}</span>
                  <span>in {effect.targetLayer}</span>
                  <span>({(effect.confidence * 100).toFixed(0)}% confidence)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Constraints */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Formulation Constraints
              </label>
              <button
                onClick={addConstraint}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Constraint
              </button>
            </div>
            <div className="space-y-2">
              {constraints.map((constraint, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <span>{constraint.type}:</span>
                  <span>{constraint.parameter}</span>
                  <span>{constraint.operator}</span>
                  <span>{constraint.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleEnhancedVerification}
              disabled={isVerifying}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 font-medium"
            >
              {isVerifying ? 'Verifying...' : 'Enhanced Verification'}
            </button>
            
            {verificationResult && verificationResult.confidence < 0.9 && (
              <button
                onClick={handleOptimizeFormulation}
                disabled={isVerifying}
                className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 font-medium"
              >
                Optimize
              </button>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'verification', label: 'Verification', icon: CheckCircleIcon },
                { id: 'ml', label: 'ML Predictions', icon: CpuChipIcon },
                { id: 'cognitive', label: 'Cognitive Insights', icon: CpuChipIcon },
                { id: 'formal', label: 'Formal Logic', icon: CalculatorIcon },
                { id: 'integration', label: 'Integration', icon: ChartBarIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-96">
            {activeTab === 'verification' && (
              <VerificationResultsTab result={verificationResult} />
            )}
            {activeTab === 'ml' && (
              <MLPredictionsTab predictions={verificationResult?.mlPredictions} />
            )}
            {activeTab === 'cognitive' && (
              <CognitiveInsightsTab insights={verificationResult?.cognitiveInsights} />
            )}
            {activeTab === 'formal' && (
              <FormalLogicTab verification={verificationResult?.formalVerification} />
            )}
            {activeTab === 'integration' && (
              <IntegrationMetricsTab metrics={verificationResult?.integrationMetrics} />
            )}
          </div>
        </div>
      </div>

      {/* Multiscale Visualization */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Multiscale Skin Model</h3>
        <MultiscaleSkinViewer
          coordinator={coordinator}
          onScaleChange={setActiveScale}
        />
      </div>
    </div>
  );
}

// Sub-components for different result tabs

function SubsystemStatus({ 
  name, 
  active, 
  icon, 
  onToggle, 
  metrics 
}: { 
  name: string; 
  active: boolean; 
  icon: React.ReactNode; 
  onToggle: () => void;
  metrics?: boolean;
}) {
  return (
    <div className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
      active ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
    }`} onClick={onToggle}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-sm font-medium">{name}</span>
        </div>
        <div className={`w-3 h-3 rounded-full ${
          active && metrics !== false ? 'bg-green-500' : 'bg-gray-400'
        }`} />
      </div>
    </div>
  );
}

function VerificationResultsTab({ result }: { result: EnhancedVerificationResult | null }) {
  if (!result) {
    return (
      <div className="text-center py-12 text-gray-500">
        No verification results yet. Submit a hypothesis to begin enhanced verification.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Result */}
      <div className={`p-4 rounded-lg ${
        result.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center space-x-2">
          {result.isValid ? (
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
          ) : (
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
          )}
          <div>
            <h4 className="font-semibold">
              {result.isValid ? 'Hypothesis Supported' : 'Hypothesis Requires Validation'}
            </h4>
            <p className="text-sm">
              Confidence: {(result.confidence * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Proof Steps */}
      <div>
        <h4 className="font-semibold mb-2">Proof Steps ({result.proof.steps.length})</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {result.proof.steps.map((step, index) => (
            <div key={step.id} className="p-3 bg-gray-50 rounded border">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-sm font-medium">{step.type}</span>
                  <p className="text-sm text-gray-600 mt-1">{step.statement}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {(step.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings and Recommendations */}
      {result.warnings.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 text-yellow-700">Warnings</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
            {result.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {result.recommendations.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 text-blue-700">Recommendations</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
            {result.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MLPredictionsTab({ predictions }: { predictions?: any }) {
  if (!predictions) {
    return (
      <div className="text-center py-12 text-gray-500">
        ML predictions not available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800">Effectiveness</h4>
          <p className="text-2xl font-bold text-blue-900">
            {(predictions.effectiveness * 100).toFixed(1)}%
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold text-green-800">Confidence</h4>
          <p className="text-2xl font-bold text-green-900">
            {(predictions.confidence * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-semibold text-yellow-800">Uncertainty</h4>
        <p className="text-lg text-yellow-900">
          ±{(predictions.uncertainty * 100).toFixed(1)}%
        </p>
      </div>

      {predictions.recommendations.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">ML Recommendations</h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {predictions.recommendations.map((rec: string, index: number) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CognitiveInsightsTab({ insights }: { insights?: any }) {
  if (!insights) {
    return (
      <div className="text-center py-12 text-gray-500">
        Cognitive insights not available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {insights.patterns.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Detected Patterns ({insights.patterns.length})</h4>
          <div className="space-y-2">
            {insights.patterns.map((pattern: any, index: number) => (
              <div key={index} className="p-3 bg-purple-50 rounded border">
                <div className="text-sm">
                  <span className="font-medium">Pattern {index + 1}:</span>
                  <span className="ml-2">Frequency: {pattern.frequency?.toFixed(2)}</span>
                  <span className="ml-2">Amplitude: {pattern.amplitude?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {insights.insights.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Cognitive Insights</h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {insights.insights.map((insight: string, index: number) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {insights.symbolicRepresentation.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Symbolic Representation</h4>
          <div className="bg-gray-100 p-3 rounded font-mono text-sm max-h-32 overflow-y-auto">
            {insights.symbolicRepresentation.map((symbol: string, index: number) => (
              <div key={index}>{symbol}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FormalLogicTab({ verification }: { verification?: any }) {
  if (!verification) {
    return (
      <div className="text-center py-12 text-gray-500">
        Formal verification not available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg ${
          verification.typeCheckPassed ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <h4 className="font-semibold">Type Check</h4>
          <p className={`text-lg font-bold ${
            verification.typeCheckPassed ? 'text-green-700' : 'text-red-700'
          }`}>
            {verification.typeCheckPassed ? 'Passed' : 'Failed'}
          </p>
        </div>
        <div className={`p-4 rounded-lg ${
          verification.theoremProven ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <h4 className="font-semibold">Theorem Proven</h4>
          <p className={`text-lg font-bold ${
            verification.theoremProven ? 'text-green-700' : 'text-red-700'
          }`}>
            {verification.theoremProven ? 'Yes' : 'No'}
          </p>
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800">Formal Confidence</h4>
        <p className="text-xl font-bold text-blue-900">
          {(verification.confidence * 100).toFixed(1)}%
        </p>
      </div>

      {verification.typeViolations.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 text-red-700">Type Violations</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
            {verification.typeViolations.map((violation: string, index: number) => (
              <li key={index}>{violation}</li>
            ))}
          </ul>
        </div>
      )}

      {verification.searchStats && (
        <div>
          <h4 className="font-semibold mb-2">Search Statistics</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Nodes Explored: {verification.searchStats.nodesExplored || 0}</div>
            <div>Max Depth: {verification.searchStats.maxDepth || 0}</div>
            <div>Search Time: {verification.searchStats.searchTime || 0}ms</div>
            <div>Found: {verification.searchStats.found ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function IntegrationMetricsTab({ metrics }: { metrics?: any }) {
  if (!metrics) {
    return (
      <div className="text-center py-12 text-gray-500">
        Integration metrics not available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-indigo-50 rounded-lg">
          <h4 className="font-semibold text-indigo-800">Consensus Score</h4>
          <p className="text-2xl font-bold text-indigo-900">
            {(metrics.consensusScore * 100).toFixed(1)}%
          </p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <h4 className="font-semibold text-purple-800">System Reliability</h4>
          <p className="text-2xl font-bold text-purple-900">
            {(metrics.systemReliability * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-800">Processing Time</h4>
        <p className="text-lg text-gray-900">
          {metrics.processingTime}ms
        </p>
      </div>

      {metrics.conflictingPredictions.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 text-orange-700">Conflicting Predictions</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-orange-700">
            {metrics.conflictingPredictions.map((conflict: string, index: number) => (
              <li key={index}>{conflict}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
