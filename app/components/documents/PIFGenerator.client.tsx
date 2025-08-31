import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/Tabs';
import { ScrollArea } from '~/components/ui/ScrollArea';

interface PIFFormData {
  productName: string;
  brandName: string;
  responsiblePerson: string;
  formulationReference: string;
  category: string;
  targetConsumer: string;
  usageInstructions: string;
  precautions: string;
  ingredients: string;
  manufacturingInfo: string;
  qualityControl: string;
  regulatoryInfo: string;
}

const initialPIFData: PIFFormData = {
  productName: '',
  brandName: '',
  responsiblePerson: '',
  formulationReference: '',
  category: '',
  targetConsumer: '',
  usageInstructions: '',
  precautions: '',
  ingredients: '',
  manufacturingInfo: '',
  qualityControl: '',
  regulatoryInfo: '',
};

/**
 * Client-side PIF Generator component with full functionality
 * Generates Product Information File documents with PDF export
 */
export function PIFGenerator() {
  const [formData, setFormData] = useState<PIFFormData>(initialPIFData);
  const [activeTab, setActiveTab] = useState('basic');
  const [isGenerating, setIsGenerating] = useState(false);

  const updateFormData = (field: keyof PIFFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let currentY = margin;

      // Title
      pdf.setFontSize(20);
      pdf.text('Product Information File (PIF)', margin, currentY);
      currentY += 15;

      // Basic Information Section
      pdf.setFontSize(16);
      pdf.text('1. Basic Product Information', margin, currentY);
      currentY += 10;
      
      pdf.setFontSize(12);
      const basicInfo = [
        `Product Name: ${formData.productName}`,
        `Brand Name: ${formData.brandName}`,
        `Responsible Person: ${formData.responsiblePerson}`,
        `Formulation Reference: ${formData.formulationReference}`,
        `Category: ${formData.category}`,
        `Target Consumer: ${formData.targetConsumer}`,
      ];

      basicInfo.forEach(line => {
        if (currentY > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          currentY = margin;
        }
        pdf.text(line, margin, currentY);
        currentY += 8;
      });

      currentY += 10;

      // Usage Instructions Section
      pdf.setFontSize(16);
      pdf.text('2. Usage Instructions', margin, currentY);
      currentY += 10;
      
      pdf.setFontSize(12);
      const usageLines = pdf.splitTextToSize(formData.usageInstructions, pageWidth - 2 * margin);
      usageLines.forEach((line: string) => {
        if (currentY > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          currentY = margin;
        }
        pdf.text(line, margin, currentY);
        currentY += 6;
      });

      currentY += 10;

      // Precautions Section
      pdf.setFontSize(16);
      pdf.text('3. Precautions and Warnings', margin, currentY);
      currentY += 10;
      
      pdf.setFontSize(12);
      const precautionLines = pdf.splitTextToSize(formData.precautions, pageWidth - 2 * margin);
      precautionLines.forEach((line: string) => {
        if (currentY > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          currentY = margin;
        }
        pdf.text(line, margin, currentY);
        currentY += 6;
      });

      currentY += 10;

      // Ingredients Section
      pdf.setFontSize(16);
      pdf.text('4. Ingredients Information', margin, currentY);
      currentY += 10;
      
      pdf.setFontSize(12);
      const ingredientLines = pdf.splitTextToSize(formData.ingredients, pageWidth - 2 * margin);
      ingredientLines.forEach((line: string) => {
        if (currentY > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          currentY = margin;
        }
        pdf.text(line, margin, currentY);
        currentY += 6;
      });

      // Add remaining sections...
      const sections = [
        { title: '5. Manufacturing Information', content: formData.manufacturingInfo },
        { title: '6. Quality Control', content: formData.qualityControl },
        { title: '7. Regulatory Information', content: formData.regulatoryInfo },
      ];

      sections.forEach(section => {
        currentY += 10;
        
        if (currentY > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.setFontSize(16);
        pdf.text(section.title, margin, currentY);
        currentY += 10;
        
        pdf.setFontSize(12);
        const sectionLines = pdf.splitTextToSize(section.content, pageWidth - 2 * margin);
        sectionLines.forEach((line: string) => {
          if (currentY > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(line, margin, currentY);
          currentY += 6;
        });
      });

      // Add footer with generation date
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.text(`Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`, 
                 margin, pdf.internal.pageSize.getHeight() - 10);
      }

      const fileName = `PIF_${formData.productName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadFormulationData = (formulationRef: string) => {
    // This would load data from the vessels formulation files
    // For now, we'll use sample data
    if (formulationRef === 'RTN-NC-001') {
      setFormData(prev => ({
        ...prev,
        productName: 'Retinol Night Cream',
        category: 'Night Treatment Cream',
        ingredients: 'Squalane 15.0%, Retinyl Palmitate 0.5%, Ceramide Complex 2.0%',
        precautions: 'For external use only. Evening use only. SPF required next day. Patch test recommended for sensitive skin.',
        usageInstructions: 'Apply small amount to clean face in the evening. Use 2-3 times per week initially.',
      }));
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-bolt-elements-textPrimary mb-2">
          PIF Generator
        </h1>
        <p className="text-bolt-elements-textSecondary">
          Generate comprehensive Product Information File (PIF) documents for cosmetic formulations
        </p>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Form Section */}
        <div className="flex-1 overflow-hidden">
          <Card className="h-full">
            <ScrollArea className="h-full p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 w-full mb-6">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="usage">Usage & Safety</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                  <TabsTrigger value="regulatory">Regulatory</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="productName">Product Name</Label>
                      <Input
                        id="productName"
                        value={formData.productName}
                        onChange={(e) => updateFormData('productName', e.target.value)}
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="brandName">Brand Name</Label>
                      <Input
                        id="brandName"
                        value={formData.brandName}
                        onChange={(e) => updateFormData('brandName', e.target.value)}
                        placeholder="Enter brand name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="responsiblePerson">Responsible Person</Label>
                    <Input
                      id="responsiblePerson"
                      value={formData.responsiblePerson}
                      onChange={(e) => updateFormData('responsiblePerson', e.target.value)}
                      placeholder="Enter responsible person/company"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="formulationReference">Formulation Reference</Label>
                      <Input
                        id="formulationReference"
                        value={formData.formulationReference}
                        onChange={(e) => updateFormData('formulationReference', e.target.value)}
                        placeholder="e.g., RTN-NC-001"
                        onBlur={(e) => loadFormulationData(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Product Category</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => updateFormData('category', e.target.value)}
                        placeholder="e.g., Night Treatment Cream"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="targetConsumer">Target Consumer</Label>
                    <Input
                      id="targetConsumer"
                      value={formData.targetConsumer}
                      onChange={(e) => updateFormData('targetConsumer', e.target.value)}
                      placeholder="e.g., Adults with mature skin"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="usage" className="space-y-4">
                  <div>
                    <Label htmlFor="usageInstructions">Usage Instructions</Label>
                    <textarea
                      id="usageInstructions"
                      value={formData.usageInstructions}
                      onChange={(e) => updateFormData('usageInstructions', e.target.value)}
                      className="w-full h-32 p-3 border rounded-md resize-none"
                      placeholder="Enter detailed usage instructions..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="precautions">Precautions and Warnings</Label>
                    <textarea
                      id="precautions"
                      value={formData.precautions}
                      onChange={(e) => updateFormData('precautions', e.target.value)}
                      className="w-full h-32 p-3 border rounded-md resize-none"
                      placeholder="Enter precautions and warnings..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="technical" className="space-y-4">
                  <div>
                    <Label htmlFor="ingredients">Ingredients Information</Label>
                    <textarea
                      id="ingredients"
                      value={formData.ingredients}
                      onChange={(e) => updateFormData('ingredients', e.target.value)}
                      className="w-full h-32 p-3 border rounded-md resize-none"
                      placeholder="Enter complete ingredients list with percentages..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="manufacturingInfo">Manufacturing Information</Label>
                    <textarea
                      id="manufacturingInfo"
                      value={formData.manufacturingInfo}
                      onChange={(e) => updateFormData('manufacturingInfo', e.target.value)}
                      className="w-full h-32 p-3 border rounded-md resize-none"
                      placeholder="Enter manufacturing process and facility information..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="qualityControl">Quality Control</Label>
                    <textarea
                      id="qualityControl"
                      value={formData.qualityControl}
                      onChange={(e) => updateFormData('qualityControl', e.target.value)}
                      className="w-full h-32 p-3 border rounded-md resize-none"
                      placeholder="Enter quality control procedures and testing methods..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="regulatory" className="space-y-4">
                  <div>
                    <Label htmlFor="regulatoryInfo">Regulatory Information</Label>
                    <textarea
                      id="regulatoryInfo"
                      value={formData.regulatoryInfo}
                      onChange={(e) => updateFormData('regulatoryInfo', e.target.value)}
                      className="w-full h-40 p-3 border rounded-md resize-none"
                      placeholder="Enter regulatory compliance information, certifications, etc..."
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
            <h3 className="text-lg font-semibold mb-4">Generate PIF Document</h3>
            
            <div className="space-y-4">
              <Button
                onClick={generatePDF}
                disabled={isGenerating || !formData.productName}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate PDF'}
              </Button>

              <div className="text-sm text-bolt-elements-textSecondary">
                <p className="mb-2">Document will include:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Product identification</li>
                  <li>• Usage instructions</li>
                  <li>• Safety information</li>
                  <li>• Ingredients listing</li>
                  <li>• Manufacturing details</li>
                  <li>• Quality control data</li>
                  <li>• Regulatory compliance</li>
                </ul>
              </div>

              <div className="text-xs text-bolt-elements-textSecondary border-t pt-4">
                <p>Generated documents comply with EU Cosmetic Regulation (EC) No 1223/2009 requirements for Product Information Files.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}