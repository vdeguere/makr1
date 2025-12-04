import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import bodyFrontImage from '@/assets/body-front.png';
import bodyBackImage from '@/assets/body-back.png';
import { iconMap } from '@/components/ui/icon-picker';
import { logger } from './logger';

interface BodyMarker {
  id: string;
  x: number;
  y: number;
  type: string;
  type_id?: string;
  label: string;
  severity?: number;
}

interface VisitNote {
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  present_illness: string | null;
  general_appearance: string | null;
  tongue_examination: string | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  temperature: number | null;
  weight: number | null;
  height: number | null;
  respiratory_rate: number | null;
  oxygen_saturation: number | null;
  vital_notes: string | null;
  body_diagram_front: BodyMarker[] | null;
  body_diagram_back: BodyMarker[] | null;
  abdominal_palpation: string | null;
  other_findings: string | null;
  ttm_diagnosis: string | null;
  ttm_pattern_identification: string | null;
  western_diagnosis: string | null;
  treatment_plan: string | null;
  herbal_prescription: string | null;
  dietary_recommendations: string | null;
  lifestyle_recommendations: string | null;
  follow_up_plan: string | null;
}

interface Visit {
  id: string;
  visit_date: string;
  chief_complaint: string;
  visit_type: string;
  duration_minutes: number | null;
  visit_notes?: VisitNote[];
}

interface Patient {
  full_name: string;
  date_of_birth?: string | null;
  email?: string | null;
  phone?: string | null;
}

// Helper to create body diagram canvas
const createBodyDiagramCanvas = async (
  markers: BodyMarker[],
  side: 'front' | 'back',
  markerTypes: any[]
): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Set canvas size
  canvas.width = 400;
  canvas.height = 800;

  // Load body image
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = side === 'front' ? bodyFrontImage : bodyBackImage;
  });

  // Draw body image
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Draw markers
  markers.forEach((marker) => {
    const x = (marker.x / 100) * canvas.width;
    const y = (marker.y / 100) * canvas.height;

    // Find marker type for color
    const markerType = marker.type_id 
      ? markerTypes.find(t => t.id === marker.type_id)
      : markerTypes.find(t => t.name.toLowerCase() === marker.type.toLowerCase());

    // Draw marker circle
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, 2 * Math.PI);
    
    // Parse color (expecting text-red-500 format)
    const colorClass = markerType?.color || 'text-red-500';
    const colorMap: { [key: string]: string } = {
      'text-red-500': '#ef4444',
      'text-blue-500': '#3b82f6',
      'text-green-500': '#22c55e',
      'text-yellow-500': '#eab308',
      'text-purple-500': '#a855f7',
      'text-orange-500': '#f97316',
      'text-pink-500': '#ec4899',
    };
    
    ctx.fillStyle = colorMap[colorClass] || '#ef4444';
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  });

  // Add label
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(10, 10, 150, 30);
  ctx.fillStyle = '#000000';
  ctx.font = '16px Arial';
  ctx.fillText(side === 'front' ? 'Front View' : 'Back View', 20, 30);

  return canvas.toDataURL('image/png');
};

export const exportVisitSummaryToPDF = async (
  visit: Visit,
  patient: Patient,
  markerTypes: any[]
) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let yPosition = margin;

    const notes = visit.visit_notes?.[0];

    // Helper to add text with wrapping
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
      
      lines.forEach((line: string) => {
        if (yPosition > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += fontSize * 0.5;
      });
      yPosition += 2;
    };

    // Header
    addText('PATIENT VISIT SUMMARY', 16, true);
    pdf.setDrawColor(0, 0, 0);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Patient Info
    addText(`Patient: ${patient.full_name}`, 12, true);
    if (patient.date_of_birth) {
      const age = new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear();
      addText(`Age: ${age} years`);
    }
    if (patient.email) addText(`Email: ${patient.email}`);
    if (patient.phone) addText(`Phone: ${patient.phone}`);
    yPosition += 5;

    // Visit Info
    addText(`Visit Date: ${new Date(visit.visit_date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, 11, true);
    addText(`Visit Type: ${visit.visit_type.charAt(0).toUpperCase() + visit.visit_type.slice(1)}`);
    if (visit.duration_minutes) addText(`Duration: ${visit.duration_minutes} minutes`);
    yPosition += 3;

    // Chief Complaint
    addText('Chief Complaint', 12, true);
    addText(visit.chief_complaint);
    yPosition += 5;

    if (notes) {
      // Body Diagrams
      const hasFrontDiagram = notes.body_diagram_front && notes.body_diagram_front.length > 0;
      const hasBackDiagram = notes.body_diagram_back && notes.body_diagram_back.length > 0;

      if (hasFrontDiagram || hasBackDiagram) {
        addText('Body Symptom Markers', 12, true);
        yPosition += 5;

        const diagramWidth = 60;
        const diagramHeight = 120;

        if (hasFrontDiagram) {
          const frontCanvas = await createBodyDiagramCanvas(
            notes.body_diagram_front!,
            'front',
            markerTypes
          );
          
          if (yPosition + diagramHeight > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.addImage(frontCanvas, 'PNG', margin, yPosition, diagramWidth, diagramHeight);

          // List markers
          const markerX = margin + diagramWidth + 10;
          let markerY = yPosition;
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Front View Markers:', markerX, markerY);
          markerY += 5;
          
          pdf.setFont('helvetica', 'normal');
          notes.body_diagram_front!.forEach((marker: BodyMarker, idx: number) => {
            const markerText = `${idx + 1}. ${marker.type}: ${marker.label}`;
            const lines = pdf.splitTextToSize(markerText, pageWidth - markerX - margin);
            lines.forEach((line: string) => {
              if (markerY > pdf.internal.pageSize.getHeight() - margin) {
                pdf.addPage();
                markerY = margin;
              }
              pdf.text(line, markerX, markerY);
              markerY += 4;
            });
            if (marker.severity) {
              pdf.text(`   Severity: ${marker.severity}/10`, markerX, markerY);
              markerY += 4;
            }
            markerY += 1;
          });

          yPosition = Math.max(yPosition + diagramHeight, markerY) + 10;
        }

        if (hasBackDiagram) {
          const backCanvas = await createBodyDiagramCanvas(
            notes.body_diagram_back!,
            'back',
            markerTypes
          );

          if (yPosition + diagramHeight > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.addImage(backCanvas, 'PNG', margin, yPosition, diagramWidth, diagramHeight);

          // List markers
          const markerX = margin + diagramWidth + 10;
          let markerY = yPosition;
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Back View Markers:', markerX, markerY);
          markerY += 5;
          
          pdf.setFont('helvetica', 'normal');
          notes.body_diagram_back!.forEach((marker: BodyMarker, idx: number) => {
            const markerText = `${idx + 1}. ${marker.type}: ${marker.label}`;
            const lines = pdf.splitTextToSize(markerText, pageWidth - markerX - margin);
            lines.forEach((line: string) => {
              if (markerY > pdf.internal.pageSize.getHeight() - margin) {
                pdf.addPage();
                markerY = margin;
              }
              pdf.text(line, markerX, markerY);
              markerY += 4;
            });
            if (marker.severity) {
              pdf.text(`   Severity: ${marker.severity}/10`, markerX, markerY);
              markerY += 4;
            }
            markerY += 1;
          });

          yPosition = Math.max(yPosition + diagramHeight, markerY) + 10;
        }
      }

      // Vital Signs
      const hasVitals = notes.blood_pressure_systolic || notes.heart_rate || 
                       notes.temperature || notes.weight || notes.height;
      
      if (hasVitals) {
        if (yPosition > pdf.internal.pageSize.getHeight() - 50) {
          pdf.addPage();
          yPosition = margin;
        }

        addText('Vital Signs', 12, true);
        if (notes.blood_pressure_systolic && notes.blood_pressure_diastolic) {
          addText(`Blood Pressure: ${notes.blood_pressure_systolic}/${notes.blood_pressure_diastolic} mmHg`);
        }
        if (notes.heart_rate) addText(`Heart Rate: ${notes.heart_rate} bpm`);
        if (notes.temperature) addText(`Temperature: ${notes.temperature}°C`);
        if (notes.weight) addText(`Weight: ${notes.weight} kg`);
        if (notes.height) addText(`Height: ${notes.height} cm`);
        if (notes.respiratory_rate) addText(`Respiratory Rate: ${notes.respiratory_rate} /min`);
        if (notes.oxygen_saturation) addText(`O2 Saturation: ${notes.oxygen_saturation}%`);
        if (notes.vital_notes) addText(`Notes: ${notes.vital_notes}`);
        yPosition += 5;
      }

      // Examination Findings
      const hasExam = notes.general_appearance || notes.tongue_examination || 
                     notes.abdominal_palpation || notes.other_findings;
      
      if (hasExam) {
        if (yPosition > pdf.internal.pageSize.getHeight() - 50) {
          pdf.addPage();
          yPosition = margin;
        }

        addText('Examination Findings', 12, true);
        if (notes.general_appearance) {
          addText('General Appearance:', 10, true);
          addText(notes.general_appearance);
        }
        if (notes.tongue_examination) {
          addText('Tongue Examination:', 10, true);
          addText(notes.tongue_examination);
        }
        if (notes.abdominal_palpation) {
          addText('Abdominal Palpation:', 10, true);
          addText(notes.abdominal_palpation);
        }
        if (notes.other_findings) {
          addText('Other Findings:', 10, true);
          addText(notes.other_findings);
        }
        yPosition += 5;
      }

      // Assessment & Diagnosis
      const hasAssessment = notes.ttm_diagnosis || notes.western_diagnosis || 
                           notes.ttm_pattern_identification;
      
      if (hasAssessment) {
        if (yPosition > pdf.internal.pageSize.getHeight() - 50) {
          pdf.addPage();
          yPosition = margin;
        }

        addText('Assessment & Diagnosis', 12, true);
        if (notes.ttm_diagnosis) {
          addText('TTM Diagnosis:', 10, true);
          addText(notes.ttm_diagnosis);
        }
        if (notes.ttm_pattern_identification) {
          addText('Pattern Identification:', 10, true);
          addText(notes.ttm_pattern_identification);
        }
        if (notes.western_diagnosis) {
          addText('Western Diagnosis:', 10, true);
          addText(notes.western_diagnosis);
        }
        yPosition += 5;
      }

      // Treatment Plan
      const hasPlan = notes.treatment_plan || notes.herbal_prescription || 
                     notes.dietary_recommendations || notes.lifestyle_recommendations;
      
      if (hasPlan) {
        if (yPosition > pdf.internal.pageSize.getHeight() - 50) {
          pdf.addPage();
          yPosition = margin;
        }

        addText('Treatment Plan', 12, true);
        if (notes.treatment_plan) {
          addText('Treatment:', 10, true);
          addText(notes.treatment_plan);
        }
        if (notes.herbal_prescription) {
          addText('Herbal Prescription:', 10, true);
          addText(notes.herbal_prescription);
        }
        if (notes.dietary_recommendations) {
          addText('Dietary Recommendations:', 10, true);
          addText(notes.dietary_recommendations);
        }
        if (notes.lifestyle_recommendations) {
          addText('Lifestyle Recommendations:', 10, true);
          addText(notes.lifestyle_recommendations);
        }
        if (notes.follow_up_plan) {
          addText('Follow-up Plan:', 10, true);
          addText(notes.follow_up_plan);
        }
      }
    }

    // Footer
    const timestamp = new Date().toLocaleString();
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Generated: ${timestamp}`, margin, pdf.internal.pageSize.getHeight() - 5);

    // Save PDF
    const fileName = `${patient.full_name.replace(/\s+/g, '_')}_Visit_${new Date(visit.visit_date).toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    return true;
  } catch (error) {
    logger.error('Error exporting visit summary:', error);
    throw error;
  }
};
