import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';
import { CV } from '../cv/entities/cv.entity';

@Injectable()
export class ExportService {
  async generatePDF(cv: CV): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    this.writeContent(doc, cv);

    return new Promise((resolve, reject) => {
      doc.on('finish', () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', (error: Error) => {
        reject(error);
      });
      doc.end();
    });
  }

  private writeContent(doc: PDFDocument, cv: CV) {
    const content = cv.content ?? {};
    const summary = content.summary ?? '';
    const experiences = Array.isArray(content.experiences)
      ? content.experiences
      : [];
    const educations = Array.isArray(content.educations)
      ? content.educations
      : [];
    const skills = content.skills ?? {};
    const hardSkills = Array.isArray(skills.hard) ? skills.hard : [];
    const softSkills = Array.isArray(skills.soft) ? skills.soft : [];
    const tools = Array.isArray(skills.tools) ? skills.tools : [];

    doc.fontSize(18).text(cv.title, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(summary);
    doc.moveDown();

    if (experiences.length) {
      doc.fontSize(14).text('Pengalaman');
      doc.moveDown(0.5);
      experiences.forEach((exp: any) => {
        doc.fontSize(12).text(`${exp.position} — ${exp.company}`);
        doc.fontSize(10).text(`${exp.duration ?? ''}`);
        if (Array.isArray(exp.bullets)) {
          exp.bullets.forEach((bullet: string) => doc.list([bullet]));
        }
        doc.moveDown();
      });
    }

    if (educations.length) {
      doc.fontSize(14).text('Pendidikan');
      doc.moveDown(0.5);
      educations.forEach((edu: any) => {
        doc
          .fontSize(12)
          .text(`${edu.degree} ${edu.major} — ${edu.institution}`);
        doc
          .fontSize(10)
          .text(`${edu.year ?? ''}${edu.gpa ? ` • GPA ${edu.gpa}` : ''}`);
        doc.moveDown();
      });
    }

    const allSkills = [...hardSkills, ...softSkills, ...tools];
    if (allSkills.length) {
      doc.fontSize(14).text('Skill');
      doc.moveDown(0.5);
      doc.fontSize(10).text(allSkills.join(', '));
    }
  }
}
