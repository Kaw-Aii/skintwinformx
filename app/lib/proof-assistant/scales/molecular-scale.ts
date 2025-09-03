
/**
 * Molecular Scale Skin Model
 * Models protein-lipid interactions, molecular transport, and binding kinetics
 */

import type { MultiscaleField } from '../multiscale-tensor-operations';

export interface MolecularComponent {
  id: string;
  type: 'protein' | 'lipid' | 'small_molecule' | 'water';
  molecularWeight: number; // Da
  charge: number;
  hydrophobicity: number; // logP
  bindingSites: BindingSite[];
}

export interface BindingSite {
  id: string;
  affinity: number; // Kd in mol/L
  capacity: number; // max binding molecules
  occupancy: number; // current occupancy 0-1
}

export interface MolecularInteraction {
  participant1: string;
  participant2: string;
  interactionType: 'binding' | 'enzymatic' | 'transport' | 'conformational';
  strength: number;
  energyBarrier: number; // kJ/mol
}

export class MolecularScaleModel {
  private components: Map<string, MolecularComponent>;
  private interactions: MolecularInteraction[];
  private spatialGrid: number[][][]; // 3D concentration grid
  private timeStep: number = 1e-12; // picoseconds

  constructor(gridSize: [number, number, number]) {
    this.components = new Map();
    this.interactions = [];
    this.spatialGrid = Array(gridSize[0]).fill(null).map(() =>
      Array(gridSize[1]).fill(null).map(() =>
        Array(gridSize[2]).fill(0)
      )
    );
    this.initializeBasicComponents();
  }

  /**
   * Add molecular component to the system
   */
  public addComponent(component: MolecularComponent, initialConcentration: number): void {
    this.components.set(component.id, component);
    
    // Distribute initial concentration in spatial grid
    for (let x = 0; x < this.spatialGrid.length; x++) {
      for (let y = 0; y < this.spatialGrid[0].length; y++) {
        for (let z = 0; z < this.spatialGrid[0][0].length; z++) {
          this.spatialGrid[x][y][z] = initialConcentration;
        }
      }
    }
  }

  /**
   * Simulate molecular dynamics for one time step
   */
  public simulateTimeStep(): MultiscaleField {
    // Update molecular positions and interactions
    this.updateDiffusion();
    this.updateBinding();
    this.updateConformationalChanges();

    // Convert to tensor field format
    return this.convertToTensorField();
  }

  /**
   * Model ingredient penetration at molecular level
   */
  public modelIngredientPenetration(
    ingredientId: string,
    surfaceConcentration: number,
    diffusionCoefficient: number
  ): MultiscaleField {
    const component = this.components.get(ingredientId);
    if (!component) {
      throw new Error(`Unknown ingredient: ${ingredientId}`);
    }

    // Apply Fick's laws with molecular specificity
    this.applyFicksLaw(surfaceConcentration, diffusionCoefficient, component);
    
    return this.convertToTensorField();
  }

  private initializeBasicComponents(): void {
    // Keratin proteins
    this.addComponent({
      id: 'keratin_1',
      type: 'protein',
      molecularWeight: 66000,
      charge: -2,
      hydrophobicity: -1.2,
      bindingSites: [
        { id: 'keratin_binding_1', affinity: 1e-6, capacity: 100, occupancy: 0.7 }
      ]
    }, 0.1);

    // Ceramides
    this.addComponent({
      id: 'ceramide_1',
      type: 'lipid',
      molecularWeight: 537.9,
      charge: 0,
      hydrophobicity: 4.2,
      bindingSites: [
        { id: 'lipid_membrane', affinity: 1e-4, capacity: 1000, occupancy: 0.9 }
      ]
    }, 0.05);

    // Water molecules
    this.addComponent({
      id: 'water',
      type: 'water',
      molecularWeight: 18.0,
      charge: 0,
      hydrophobicity: -0.5,
      bindingSites: []
    }, 55.5); // 55.5 M water concentration
  }

  private updateDiffusion(): void {
    // Implement molecular diffusion using random walk
    const newGrid = this.spatialGrid.map(layer => 
      layer.map(row => [...row])
    );

    // Apply diffusion equation: ∂C/∂t = D∇²C
    // Simplified implementation
    for (let x = 1; x < this.spatialGrid.length - 1; x++) {
      for (let y = 1; y < this.spatialGrid[0].length - 1; y++) {
        for (let z = 1; z < this.spatialGrid[0][0].length - 1; z++) {
          const laplacian = this.calculateLaplacian(x, y, z);
          newGrid[x][y][z] += 0.1 * laplacian * this.timeStep;
        }
      }
    }

    this.spatialGrid = newGrid;
  }

  private calculateLaplacian(x: number, y: number, z: number): number {
    const center = this.spatialGrid[x][y][z];
    const neighbors = 
      this.spatialGrid[x-1][y][z] + this.spatialGrid[x+1][y][z] +
      this.spatialGrid[x][y-1][z] + this.spatialGrid[x][y+1][z] +
      this.spatialGrid[x][y][z-1] + this.spatialGrid[x][y][z+1];
    
    return neighbors - 6 * center;
  }

  private updateBinding(): void {
    // Update binding equilibria for all components
    this.components.forEach(component => {
      component.bindingSites.forEach(site => {
        // Simple binding kinetics: dθ/dt = k_on * C * (1-θ) - k_off * θ
        const k_on = 1e6; // association rate constant
        const k_off = site.affinity * k_on; // dissociation rate constant
        const concentration = this.getAverageConcentration();
        
        const dOccupancy = (k_on * concentration * (1 - site.occupancy) - 
                           k_off * site.occupancy) * this.timeStep;
        
        site.occupancy = Math.max(0, Math.min(1, site.occupancy + dOccupancy));
      });
    });
  }

  private updateConformationalChanges(): void {
    // Model protein conformational changes affecting function
    this.components.forEach(component => {
      if (component.type === 'protein') {
        // Simplified conformational dynamics
        const stabilityFactor = this.calculateProteinStability(component);
        if (stabilityFactor < 0.5) {
          // Protein may denature, affecting binding sites
          component.bindingSites.forEach(site => {
            site.affinity *= 0.9; // Reduce binding affinity
          });
        }
      }
    });
  }

  private calculateProteinStability(protein: MolecularComponent): number {
    // Simplified protein stability calculation
    const temperatureFactor = 1.0; // Would depend on actual temperature
    const pHFactor = 1.0; // Would depend on local pH
    const ionicFactor = 1.0; // Would depend on ionic strength
    
    return temperatureFactor * pHFactor * ionicFactor;
  }

  private applyFicksLaw(
    surfaceConc: number,
    diffusionCoeff: number,
    component: MolecularComponent
  ): void {
    // Apply Fick's first law: J = -D * ∇C
    const gradientZ = this.calculateConcentrationGradient();
    const flux = -diffusionCoeff * gradientZ;
    
    // Update surface layer with flux
    for (let x = 0; x < this.spatialGrid.length; x++) {
      for (let y = 0; y < this.spatialGrid[0].length; y++) {
        this.spatialGrid[x][y][0] = surfaceConc;
        if (this.spatialGrid[0][0].length > 1) {
          this.spatialGrid[x][y][1] += flux * this.timeStep;
        }
      }
    }
  }

  private calculateConcentrationGradient(): number {
    if (this.spatialGrid[0][0].length < 2) return 0;
    
    // Calculate average gradient in z-direction
    let totalGradient = 0;
    let count = 0;
    
    for (let x = 0; x < this.spatialGrid.length; x++) {
      for (let y = 0; y < this.spatialGrid[0].length; y++) {
        totalGradient += this.spatialGrid[x][y][0] - this.spatialGrid[x][y][1];
        count++;
      }
    }
    
    return count > 0 ? totalGradient / count : 0;
  }

  private getAverageConcentration(): number {
    let total = 0;
    let count = 0;
    
    for (let x = 0; x < this.spatialGrid.length; x++) {
      for (let y = 0; y < this.spatialGrid[0].length; y++) {
        for (let z = 0; z < this.spatialGrid[0][0].length; z++) {
          total += this.spatialGrid[x][y][z];
          count++;
        }
      }
    }
    
    return count > 0 ? total / count : 0;
  }

  private convertToTensorField(): MultiscaleField {
    const flatData = this.spatialGrid.flat().flat();
    
    return {
      dimensions: [this.spatialGrid.length, this.spatialGrid[0].length, this.spatialGrid[0][0].length],
      data: flatData,
      scale: 'molecular',
      coupling_interfaces: [
        {
          from_scale: 'molecular',
          to_scale: 'cellular',
          coupling_strength: 0.8,
          coupling_mechanism: 'concentration_dependent_signaling'
        }
      ],
      metadata: {
        units: 'mol/L',
        description: 'Molecular concentration field',
        timestamp: new Date(),
        components_count: this.components.size,
        interactions_count: this.interactions.length
      }
    };
  }

  /**
   * Get current state for coupling to other scales
   */
  public getCurrentState(): MultiscaleField {
    return this.convertToTensorField();
  }

  /**
   * Apply external influence from higher scales
   */
  public applyUpwardInfluence(influence: MultiscaleField): void {
    // Apply influence from cellular scale (e.g., growth factors, stress signals)
    const influenceStrength = influence.coupling_interfaces[0]?.coupling_strength || 0.1;
    
    // Modify molecular interactions based on cellular state
    this.components.forEach(component => {
      component.bindingSites.forEach(site => {
        site.affinity *= (1 + influenceStrength * 0.1);
      });
    });
  }
}
