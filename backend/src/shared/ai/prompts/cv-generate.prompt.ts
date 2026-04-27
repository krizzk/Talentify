export function buildCVGeneratePrompt(profileData: any): string {
  return `Kamu adalah seorang profesional CV writer dengan keahlian membuat CV yang ATS-friendly.

Buat CV profesional dalam format JSON berdasarkan data profil berikut:
${JSON.stringify(profileData, null, 2)}

Instruksi:
1. Gunakan bahasa Indonesia yang profesional.
2. Buat professional_summary 2-3 kalimat sesuai target role.
3. Jadikan pengalaman dalam bentuk bullet points dengan action verbs.
4. Pastikan output valid JSON tanpa teks tambahan.

Format yang diharapkan:
{
  "header": {
    "full_name": "...",
    "email": "...",
    "phone": "...",
    "location": "...",
    "linkedin_url": "..."
  },
  "professional_summary": "...",
  "experiences": [{ "company": "...", "position": "...", "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD atau null", "description": "..." }],
  "education": [{ "institution": "...", "degree": "...", "field_of_study": "...", "start_date": "YYYY", "end_date": "YYYY" }],
  "skills": [{ "name": "..." }]
}`;
}
