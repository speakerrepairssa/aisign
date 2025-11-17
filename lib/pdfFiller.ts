import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface FillOptions {
  fontSize?: number;
  fontColor?: { r: number; g: number; b: number };
  autoSize?: boolean;
  maxFontSize?: number;
  minFontSize?: number;
}

export class PDFPlaceholderFiller {
  private pdfDoc: PDFDocument | null = null;

  async loadPDF(pdfBytes: ArrayBuffer): Promise<void> {
    this.pdfDoc = await PDFDocument.load(pdfBytes);
  }

  /**
   * Calculate optimal font size to fit text in given width
   */
  calculateFontSize(
    text: string,
    maxWidth: number,
    maxFontSize: number = 12,
    minFontSize: number = 6
  ): number {
    let fontSize = maxFontSize;
    const avgCharWidth = fontSize * 0.5; // Approximate character width
    const estimatedWidth = text.length * avgCharWidth;

    if (estimatedWidth <= maxWidth) {
      return fontSize;
    }

    // Calculate appropriate font size
    fontSize = (maxWidth / text.length) * 2;
    return Math.max(minFontSize, Math.min(maxFontSize, fontSize));
  }

  /**
   * Fill placeholder with intelligent text sizing
   */
  async fillPlaceholder(
    placeholder: {
      key: string;
      x: number;
      y: number;
      width: number;
      height: number;
      page: number;
      fontSize?: number;
      fontFamily?: string;
      align?: 'left' | 'center' | 'right';
    },
    value: string,
    options: FillOptions = {}
  ): Promise<void> {
    if (!this.pdfDoc) throw new Error('PDF not loaded');

    const pages = this.pdfDoc.getPages();
    const page = pages[placeholder.page - 1];
    if (!page) throw new Error(`Page ${placeholder.page} not found`);

    // Map font family name to StandardFonts
    const fontMap: { [key: string]: any } = {
      'Helvetica': StandardFonts.Helvetica,
      'Helvetica-Bold': StandardFonts.HelveticaBold,
      'Times-Roman': StandardFonts.TimesRoman,
      'Times-Bold': StandardFonts.TimesRomanBold,
      'Courier': StandardFonts.Courier,
      'Courier-Bold': StandardFonts.CourierBold,
    };

    const fontFamily = placeholder.fontFamily || 'Helvetica';
    const standardFont = fontMap[fontFamily] || StandardFonts.Helvetica;
    const font = await this.pdfDoc.embedFont(standardFont);
    
    // Auto-calculate font size if enabled
    let fontSize = placeholder.fontSize || options.fontSize || 12;
    if (options.autoSize !== false) {
      fontSize = this.calculateFontSize(
        value,
        placeholder.width,
        options.maxFontSize || fontSize,
        options.minFontSize || 6
      );
    }

    const textWidth = font.widthOfTextAtSize(value, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    // Calculate x position based on alignment
    let xPos = placeholder.x;
    const align = placeholder.align || 'left';
    if (align === 'center') {
      xPos = placeholder.x + (placeholder.width - textWidth) / 2;
    } else if (align === 'right') {
      xPos = placeholder.x + placeholder.width - textWidth;
    }

    // Calculate y position (PDF coordinates start from bottom)
    const pageHeight = page.getHeight();
    const yPos = pageHeight - placeholder.y - textHeight;

    // Draw text
    const color = options.fontColor || { r: 0, g: 0, b: 0 };
    page.drawText(value, {
      x: xPos,
      y: yPos,
      size: fontSize,
      font: font,
      color: rgb(color.r, color.g, color.b),
    });
  }

  /**
   * Fill all placeholders in the document
   */
  async fillAllPlaceholders(
    placeholders: Array<{
      key: string;
      x: number;
      y: number;
      width: number;
      height: number;
      page: number;
      fontSize?: number;
      fontFamily?: string;
      align?: 'left' | 'center' | 'right';
    }>,
    data: Record<string, string>,
    options: FillOptions = {}
  ): Promise<void> {
    for (const placeholder of placeholders) {
      const value = data[placeholder.key];
      if (value !== undefined && value !== null) {
        await this.fillPlaceholder(placeholder, String(value), options);
      }
    }
  }

  /**
   * Get the filled PDF as bytes
   */
  async save(): Promise<Uint8Array> {
    if (!this.pdfDoc) throw new Error('PDF not loaded');
    return await this.pdfDoc.save();
  }

  /**
   * Get the filled PDF as base64
   */
  async saveAsBase64(): Promise<string> {
    const pdfBytes = await this.save();
    return Buffer.from(pdfBytes).toString('base64');
  }
}

/**
 * Utility function to fill a PDF template
 */
export async function fillPDFTemplate(
  templatePdfBytes: ArrayBuffer,
  placeholders: Array<{
    key: string;
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
    fontSize?: number;
    align?: 'left' | 'center' | 'right';
  }>,
  data: Record<string, string>,
  options: FillOptions = {}
): Promise<Uint8Array> {
  const filler = new PDFPlaceholderFiller();
  await filler.loadPDF(templatePdfBytes);
  await filler.fillAllPlaceholders(placeholders, data, options);
  return await filler.save();
}
