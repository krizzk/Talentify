export function buildCVTailorPrompt(
  content: any,
  jobDescription: string,
): string {
  return `Kamu adalah seorang profesional CV writer yang ahli menyesuaikan CV dengan job description.

CV awal:
${JSON.stringify(content, null, 2)}

Job description:
${jobDescription}

Instruksi:
1. Sesuaikan keseluruhan CV agar relevan dengan job description.
2. Jangan ubah data faktual seperti nama perusahaan, posisi, atau durasi.
3. Perkuat bullet points dengan kata kunci dan pencapaian yang relevan.
4. Kembalikan HANYA JSON valid dengan format yang sama seperti input CV.

Format yang diharapkan:
{
  "summary": "...",
  "experiences": [{ "company": "...", "position": "...", "duration": "...", "bullets": ["..."] }],
  "educations": [{ "institution": "...", "degree": "...", "major": "...", "year": "...", "gpa": "..." }],
  "skills": { "hard": ["..."], "soft": ["..."], "tools": ["..."] }
}`;
}
