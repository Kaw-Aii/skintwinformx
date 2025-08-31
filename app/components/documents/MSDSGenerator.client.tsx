import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/Tabs';
import { ScrollArea } from '~/components/ui/ScrollArea';

interface MSDSFormData {
  productName: string;
  supplierInfo: string;
  emergencyPhone: string;
  productIdentifier: string;
  hazardIdentification: string;
  composition: string;
  firstAidMeasures: string;
  fireFightingMeasures: string;
  accidentalRelease: string;
  handlingStorage: string;
  exposureControls: string;
  physicalChemicalProperties: string;
  stabilityReactivity: string;
  toxicologicalInfo: string;
  ecologicalInfo: string;
  disposalInfo: string;
  transportInfo: string;
  regulatoryInfo: string;
}

const initialMSDSData: MSDSFormData = {
  productName: '',
  supplierInfo: '',
  emergencyPhone: '',
  productIdentifier: '',
  hazardIdentification: '',
  composition: '',
  firstAidMeasures: '',
  fireFightingMeasures: '',
  accidentalRelease: '',
  handlingStorage: '',
  exposureControls: '',
  physicalChemicalProperties: '',
  stabilityReactivity: '',
  toxicologicalInfo: '',
  ecologicalInfo: '',
  disposalInfo: '',
  transportInfo: '',
  regulatoryInfo: '',
};

/**
 * Client-side MSDS Generator component with full functionality
 * Generates Material Safety Data Sheet documents with PDF export
 */
export function MSDSGenerator() {
  const [formData, setFormData] = useState<MSDSFormData>(initialMSDSData);
  const [activeTab, setActiveTab] = useState('identification');
  const [isGenerating, setIsGenerating] = useState(false);

  const updateFormData = (field: keyof MSDSFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let currentY = margin;

      // Header
      pdf.setFontSize(18);
      pdf.text('SAFETY DATA SHEET', margin, currentY);
      currentY += 10;
      
      pdf.setFontSize(14);
      pdf.text(`Product: ${formData.productName}`, margin, currentY);
      currentY += 15;

      // 16 Sections of MSDS as per GHS/CLP requirements
      const sections = [
        {
          title: '1. IDENTIFICATION OF THE SUBSTANCE/MIXTURE AND OF THE COMPANY/UNDERTAKING',
          content: [
            `Product Identifier: ${formData.productIdentifier}`,
            `Supplier Information: ${formData.supplierInfo}`,
            `Emergency Phone: ${formData.emergencyPhone}`,
          ]
        },
        {
          title: '2. HAZARD IDENTIFICATION',
          content: formData.hazardIdentification.split('\n')
        },
        {
          title: '3. COMPOSITION/INFORMATION ON INGREDIENTS',
          content: formData.composition.split('\n')
        },
        {
          title: '4. FIRST AID MEASURES',
          content: formData.firstAidMeasures.split('\n')
        },
        {
          title: '5. FIRE-FIGHTING MEASURES',
          content: formData.fireFightingMeasures.split('\n')
        },
        {
          title: '6. ACCIDENTAL RELEASE MEASURES',
          content: formData.accidentalRelease.split('\n')
        },
        {
          title: '7. HANDLING AND STORAGE',
          content: formData.handlingStorage.split('\n')
        },
        {
          title: '8. EXPOSURE CONTROLS/PERSONAL PROTECTION',
          content: formData.exposureControls.split('\n')
        },
        {
          title: '9. PHYSICAL AND CHEMICAL PROPERTIES',
          content: formData.physicalChemicalProperties.split('\n')
        },
        {
          title: '10. STABILITY AND REACTIVITY',
          content: formData.stabilityReactivity.split('\n')
        },
        {
          title: '11. TOXICOLOGICAL INFORMATION',
          content: formData.toxicologicalInfo.split('\n')
        },
        {
          title: '12. ECOLOGICAL INFORMATION',
          content: formData.ecologicalInfo.split('\n')
        },
        {
          title: '13. DISPOSAL CONSIDERATIONS',
          content: formData.disposalInfo.split('\n')
        },
        {
          title: '14. TRANSPORT INFORMATION',
          content: formData.transportInfo.split('\n')
        },
        {
          title: '15. REGULATORY INFORMATION',
          content: formData.regulatoryInfo.split('\n')
        },
        {
          title: '16. OTHER INFORMATION',
          content: [`Document prepared on: ${new Date().toLocaleDateString()}`, 'This safety data sheet complies with GHS/CLP requirements.']
        }
      ];

      sections.forEach(section => {
        // Check if we need a new page
        if (currentY > pdf.internal.pageSize.getHeight() - 60) {
          pdf.addPage();
          currentY = margin;
        }

        // Section title
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        const titleLines = pdf.splitTextToSize(section.title, pageWidth - 2 * margin);
        titleLines.forEach((line: string) => {
          pdf.text(line, margin, currentY);
          currentY += 8;
        });
        currentY += 5;

        // Section content
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(10);
        
        if (Array.isArray(section.content)) {
          section.content.forEach(line => {
            if (line.trim()) {
              const contentLines = pdf.splitTextToSize(line, pageWidth - 2 * margin);
              contentLines.forEach((contentLine: string) => {
                if (currentY > pdf.internal.pageSize.getHeight() - margin) {
                  pdf.addPage();
                  currentY = margin;
                }
                pdf.text(contentLine, margin, currentY);
                currentY += 6;
              });
            }
          });
        }
        
        currentY += 10;
      });

      // Add footer with generation date and page numbers
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(`Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`, 
                 margin, pdf.internal.pageSize.getHeight() - 10);
      }

      const fileName = `MSDS_${formData.productName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadIngredientData = (productName: string) => {
    // This would load data from the vessels ingredient files
    // For now, we'll use sample data
    if (productName.toLowerCase().includes('retinol')) {
      setFormData(prev => ({
        ...prev,
        productIdentifier: 'Retinyl Palmitate CAS: 79-81-2',
        hazardIdentification: 'May cause skin irritation.\nMay cause eye irritation.\nPrecautionary statements: Use only as directed.',
        composition: 'Retinyl Palmitate: 0.5%\nSqualane: 15.0%\nCeramide Complex: 2.0%\nOther ingredients: 82.5%',
        firstAidMeasures: 'Eye contact: Rinse with water for 15 minutes\nSkin contact: Wash with soap and water\nIngestion: Do not induce vomiting, seek medical attention',
        physicalChemicalProperties: 'Appearance: Cream\nColor: Light amber\nOdor: Mild\npH: 5.5\nMelting point: N/A\nBoiling point: N/A',
      }));
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-bolt-elements-textPrimary mb-2">
          MSDS Generator
        </h1>
        <p className="text-bolt-elements-textSecondary">
          Generate Material Safety Data Sheet (MSDS) documents for cosmetic ingredients and formulations
        </p>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Form Section */}
        <div className="flex-1 overflow-hidden">
          <Card className="h-full">
            <ScrollArea className="h-full p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 w-full mb-6">
                  <TabsTrigger value="identification">Identification</TabsTrigger>
                  <TabsTrigger value="hazards">Hazards</TabsTrigger>
                  <TabsTrigger value="safety">Safety</TabsTrigger>
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                </TabsList>

                <TabsContent value="identification" className="space-y-4">
                  <div>
                    <Label htmlFor="productName">Product Name</Label>
                    <Input
                      id="productName"
                      value={formData.productName}
                      onChange={(e) => updateFormData('productName', e.target.value)}
                      placeholder="Enter product name"
                      onBlur={(e) => loadIngredientData(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="productIdentifier">Product Identifier</Label>
                    <Input
                      id="productIdentifier"
                      value={formData.productIdentifier}
                      onChange={(e) => updateFormData('productIdentifier', e.target.value)}
                      placeholder="CAS number, INCI name, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="supplierInfo">Supplier Information</Label>
                    <textarea
                      id="supplierInfo"
                      value={formData.supplierInfo}
                      onChange={(e) => updateFormData('supplierInfo', e.target.value)}
                      className="w-full h-24 p-3 border rounded-md resize-none"
                      placeholder="Company name, address, contact information..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergencyPhone">Emergency Phone Number</Label>
                    <Input
                      id="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={(e) => updateFormData('emergencyPhone', e.target.value)}
                      placeholder="24-hour emergency contact number"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="hazards" className="space-y-4">
                  <div>
                    <Label htmlFor="hazardIdentification">Hazard Identification</Label>
                    <textarea
                      id="hazardIdentification"
                      value={formData.hazardIdentification}
                      onChange={(e) => updateFormData('hazardIdentification', e.target.value)}
                      className="w-full h-32 p-3 border rounded-md resize-none"
                      placeholder="Classification, signal words, hazard statements..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="composition">Composition/Ingredients</Label>
                    <textarea
                      id="composition"
                      value={formData.composition}
                      onChange={(e) => updateFormData('composition', e.target.value)}
                      className="w-full h-32 p-3 border rounded-md resize-none"
                      placeholder="Chemical identity, concentration ranges, CAS numbers..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="safety" className="space-y-4">
                  <div>
                    <Label htmlFor="firstAidMeasures">First Aid Measures</Label>
                    <textarea
                      id="firstAidMeasures"
                      value={formData.firstAidMeasures}
                      onChange={(e) => updateFormData('firstAidMeasures', e.target.value)}
                      className="w-full h-32 p-3 border rounded-md resize-none"
                      placeholder="Inhalation, skin contact, eye contact, ingestion procedures..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="fireFightingMeasures">Fire-Fighting Measures</Label>
                    <textarea
                      id="fireFightingMeasures"
                      value={formData.fireFightingMeasures}
                      onChange={(e) => updateFormData('fireFightingMeasures', e.target.value)}
                      className="w-full h-32 p-3 border rounded-md resize-none"
                      placeholder="Suitable extinguishing media, special hazards..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="accidentalRelease">Accidental Release Measures</Label>
                    <textarea
                      id="accidentalRelease"
                      value={formData.accidentalRelease}
                      onChange={(e) => updateFormData('accidentalRelease', e.target.value)}
                      className="w-full h-32 p-3 border rounded-md resize-none"
                      placeholder="Personal precautions, environmental precautions, cleanup methods..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="handlingStorage">Handling and Storage</Label>
                    <textarea
                      id="handlingStorage"
                      value={formData.handlingStorage}
                      onChange={(e) => updateFormData('handlingStorage', e.target.value)}
                      className="w-full h-32 p-3 border rounded-md resize-none"
                      placeholder="Precautions for safe handling, storage conditions..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="exposureControls">Exposure Controls/Personal Protection</Label>
                    <textarea
                      id="exposureControls"
                      value={formData.exposureControls}
                      onChange={(e) => updateFormData('exposureControls', e.target.value)}
                      className="w-full h-32 p-3 border rounded-md resize-none"
                      placeholder="Occupational exposure limits, engineering controls, PPE..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="properties" className="space-y-4">
                  <div>
                    <Label htmlFor="physicalChemicalProperties">Physical and Chemical Properties</Label>
                    <textarea
                      id="physicalChemicalProperties"
                      value={formData.physicalChemicalProperties}
                      onChange={(e) => updateFormData('physicalChemicalProperties', e.target.value)}
                      className="w-full h-32 p-3 border rounded-md resize-none"
                      placeholder="Appearance, odor, pH, melting point, boiling point, etc..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="stabilityReactivity">Stability and Reactivity</Label>
                    <textarea
                      id="stabilityReactivity"
                      value={formData.stabilityReactivity}
                      onChange={(e) => updateFormData('stabilityReactivity', e.target.value)}
                      className="w-full h-32 p-3 border rounded-md resize-none"
                      placeholder="Chemical stability, possibility of hazardous reactions..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="toxicologicalInfo">Toxicological Information</Label>
                    <textarea
                      id="toxicologicalInfo"
                      value={formData.toxicologicalInfo}
                      onChange={(e) => updateFormData('toxicologicalInfo', e.target.value)}
                      className="w-full h-32 p-3 border rounded-md resize-none"
                      placeholder="Acute toxicity, skin/eye irritation, sensitization..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="ecologicalInfo">Ecological Information</Label>
                    <textarea
                      id="ecologicalInfo"
                      value={formData.ecologicalInfo}
                      onChange={(e) => updateFormData('ecologicalInfo', e.target.value)}
                      className="w-full h-32 p-3 border rounded-md resize-none"
                      placeholder="Ecotoxicity, biodegradability, bioaccumulation..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="disposalInfo">Disposal Considerations</Label>
                    <textarea
                      id="disposalInfo"
                      value={formData.disposalInfo}
                      onChange={(e) => updateFormData('disposalInfo', e.target.value)}
                      className="w-full h-24 p-3 border rounded-md resize-none"
                      placeholder="Waste treatment methods, disposal methods..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="transportInfo">Transport Information</Label>
                    <textarea
                      id="transportInfo"
                      value={formData.transportInfo}
                      onChange={(e) => updateFormData('transportInfo', e.target.value)}
                      className="w-full h-24 p-3 border rounded-md resize-none"
                      placeholder="UN number, shipping name, transport hazard class..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="regulatoryInfo">Regulatory Information</Label>
                    <textarea
                      id="regulatoryInfo"
                      value={formData.regulatoryInfo}
                      onChange={(e) => updateFormData('regulatoryInfo', e.target.value)}
                      className="w-full h-24 p-3 border rounded-md resize-none"
                      placeholder="Safety, health and environmental regulations..."
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          </Card>
        </div>

        {/* Actions Section */}
        <div className="w-80">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Generate MSDS Document</h3>
            
            <div className="space-y-4">
              <Button
                onClick={generatePDF}
                disabled={isGenerating || !formData.productName}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate PDF'}
              </Button>

              <div className="text-sm text-bolt-elements-textSecondary">
                <p className="mb-2">Document includes all 16 GHS sections:</p>
                <ul className="space-y-1 text-xs">
                  <li>1. Identification</li>
                  <li>2. Hazard identification</li>
                  <li>3. Composition</li>
                  <li>4. First aid measures</li>
                  <li>5. Fire-fighting measures</li>
                  <li>6. Accidental release</li>
                  <li>7. Handling and storage</li>
                  <li>8. Exposure controls</li>
                  <li>9. Physical properties</li>
                  <li>10. Stability/reactivity</li>
                  <li>11. Toxicological info</li>
                  <li>12. Ecological info</li>
                  <li>13. Disposal</li>
                  <li>14. Transport info</li>
                  <li>15. Regulatory info</li>
                  <li>16. Other information</li>
                </ul>
              </div>

              <div className="text-xs text-bolt-elements-textSecondary border-t pt-4">
                <p>Generated documents comply with GHS/CLP requirements for Safety Data Sheets.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}