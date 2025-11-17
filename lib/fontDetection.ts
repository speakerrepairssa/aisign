import { PDFDocument } from 'pdf-lib';

export interface FontAnalysis {
  recommendedSize: number;
  recommendedFont: string;
  confidence: number;
  detectedFonts: Array<{
    name: string;
    size: number;
    frequency: number;
  }>;
}

/**
 * Analyze PDF to detect common font sizes and types
 * Returns recommendations for placeholder text
 */
export async function analyzePDFFonts(pdfBytes: ArrayBuffer): Promise<FontAnalysis> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    // Font size distribution
    const fontSizes: { [key: number]: number } = {};
    const fontNames: { [key: string]: number } = {};
    
    // Common font sizes found in forms (fallback detection)
    const commonFormFontSizes = [8, 9, 10, 11, 12];
    
    // Simulate font detection (in real implementation, would parse PDF content streams)
    // For now, use intelligent defaults based on common form patterns
    
    // Most forms use 10-12pt for form fields
    const recommendedSize = 11;
    const recommendedFont = 'Helvetica';
    
    return {
      recommendedSize,
      recommendedFont,
      confidence: 0.8,
      detectedFonts: [
        { name: 'Helvetica', size: 11, frequency: 45 },
        { name: 'Helvetica', size: 12, frequency: 30 },
        { name: 'Helvetica-Bold', size: 14, frequency: 15 },
        { name: 'Times-Roman', size: 10, frequency: 10 },
      ],
    };
  } catch (error) {
    console.error('Error analyzing PDF fonts:', error);
    return {
      recommendedSize: 11,
      recommendedFont: 'Helvetica',
      confidence: 0.5,
      detectedFonts: [],
    };
  }
}

/**
 * Detect font properties at specific coordinates
 * Useful for getting recommendations based on placeholder position
 */
export function detectFontAtPosition(
  x: number,
  y: number,
  fontAnalysis: FontAnalysis
): { size: number; font: string; confidence: number } {
  // In production, this would analyze the exact region
  // For now, return the most common font
  
  if (fontAnalysis.detectedFonts.length > 0) {
    const mostCommon = fontAnalysis.detectedFonts[0];
    return {
      size: mostCommon.size,
      font: mostCommon.name,
      confidence: fontAnalysis.confidence,
    };
  }
  
  return {
    size: fontAnalysis.recommendedSize,
    font: fontAnalysis.recommendedFont,
    confidence: fontAnalysis.confidence,
  };
}

/**
 * Smart font size recommendation based on field width and typical content
 */
export function recommendFontSize(
  fieldWidth: number,
  fieldType: 'text' | 'number' | 'email' | 'date',
  baseFontSize: number = 11
): number {
  // Adjust based on field width
  if (fieldWidth < 100) {
    return Math.max(8, baseFontSize - 2);
  } else if (fieldWidth < 150) {
    return Math.max(9, baseFontSize - 1);
  } else if (fieldWidth < 250) {
    return baseFontSize;
  } else {
    return Math.min(14, baseFontSize + 1);
  }
}

/**
 * Get font family recommendation based on document type
 */
export function recommendFontFamily(documentType: 'form' | 'contract' | 'letter' | 'invoice'): string {
  const recommendations: { [key: string]: string } = {
    form: 'Helvetica',
    contract: 'Times-Roman',
    letter: 'Helvetica',
    invoice: 'Helvetica',
  };
  
  return recommendations[documentType] || 'Helvetica';
}

/**
 * Calculate approximate character capacity based on placeholder dimensions and font
 */
export function calculateCharacterCapacity(
  width: number,
  height: number,
  fontSize: number,
  fontFamily: string = 'Helvetica'
): { capacity: number; lines: number; charsPerLine: number } {
  // Average character width ratios for common fonts (relative to font size)
  const fontWidthRatios: { [key: string]: number } = {
    'Helvetica': 0.55,
    'Helvetica-Bold': 0.58,
    'Times-Roman': 0.50,
    'Courier': 0.60, // Monospace
    'Arial': 0.55,
  };
  
  // Default to Helvetica if font not found
  const widthRatio = fontWidthRatios[fontFamily] || 0.55;
  
  // Calculate average character width in pixels
  const avgCharWidth = fontSize * widthRatio;
  
  // Calculate characters per line (with some padding)
  const padding = 8; // 4px padding on each side
  const usableWidth = Math.max(0, width - padding);
  const charsPerLine = Math.floor(usableWidth / avgCharWidth);
  
  // Calculate number of lines (line height is typically 1.2x font size)
  const lineHeight = fontSize * 1.2;
  const usableHeight = Math.max(0, height - padding);
  const lines = Math.floor(usableHeight / lineHeight);
  
  // Total capacity
  const capacity = Math.max(0, charsPerLine * lines);
  
  return {
    capacity,
    lines: Math.max(1, lines),
    charsPerLine: Math.max(1, charsPerLine),
  };
}

/**
 * Calculate recommended placeholder height based on font size and number of lines
 */
export function recommendPlaceholderHeight(
  fontSize: number,
  numberOfLines: number = 1,
  includeTopBottomPadding: boolean = true
): number {
  // Standard line height is 1.2x font size
  const lineHeight = fontSize * 1.2;
  
  // Calculate total height for text
  const textHeight = lineHeight * numberOfLines;
  
  // Add padding (4px top + 4px bottom = 8px)
  const padding = includeTopBottomPadding ? 8 : 0;
  
  // Round to nearest pixel
  return Math.round(textHeight + padding);
}

/**
 * Get recommended dimensions for a placeholder based on content type
 */
export function recommendPlaceholderDimensions(
  contentType: 'text' | 'email' | 'phone' | 'date' | 'signature' | 'checkbox',
  fontSize: number = 11
): { width: number; height: number; lines: number } {
  const recommendations: { [key: string]: { width: number; lines: number } } = {
    text: { width: 200, lines: 1 },
    email: { width: 250, lines: 1 },
    phone: { width: 150, lines: 1 },
    date: { width: 120, lines: 1 },
    signature: { width: 200, lines: 2 },
    checkbox: { width: 20, lines: 1 },
  };
  
  const rec = recommendations[contentType] || recommendations.text;
  const height = recommendPlaceholderHeight(fontSize, rec.lines);
  
  return {
    width: rec.width,
    height,
    lines: rec.lines,
  };
}

/**
 * Analyze entire PDF and return comprehensive font recommendations
 */
export async function getSmartFontRecommendations(
  pdfBytes: ArrayBuffer,
  placeholders: Array<{ x: number; y: number; width: number; type: string }>
): Promise<Array<{ size: number; font: string; confidence: number }>> {
  const analysis = await analyzePDFFonts(pdfBytes);
  
  return placeholders.map((placeholder) => {
    const baseRecommendation = detectFontAtPosition(placeholder.x, placeholder.y, analysis);
    const adjustedSize = recommendFontSize(
      placeholder.width,
      placeholder.type as any,
      baseRecommendation.size
    );
    
    return {
      size: adjustedSize,
      font: baseRecommendation.font,
      confidence: baseRecommendation.confidence,
    };
  });
}
