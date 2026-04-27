export function buildATSAnalyzePrompt(
  cvText: string,
  jobDescription: string,
): string {
  return `Kamu adalah analis ATS. Bandingkan CV dengan job description berikut.

CV text:
${cvText}

Job description:
${jobDescription}

Instruksi:
1. Hitung score ATS dalam angka 0-100.
2. Tentukan keyword yang cocok dan yang hilang.
3. Berikan saran singkat untuk memperbaiki CV agar sesuai JD.
4. Kembalikan HANYA JSON valid dengan format:
{
  "score": 0,
  "matched_keywords": ["..."],
  "missing_keywords": ["..."],
  "suggestions": ["..."]
}`;
}
