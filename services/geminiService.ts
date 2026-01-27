
import { GoogleGenAI, Type } from "@google/genai";
import { CVData, GeneratedResponse } from "../types";

const SYSTEM_INSTRUCTION = `
Jesteś modułem generatora CV o nazwie „CV Master – Optymalizator Kariery”.
Twoim celem jest przygotowanie profesjonalnej, ustrukturyzowanej treści CV w formacie JSON, która zostanie wyrenderowana przez aplikację React i wydrukowana do PDF (format A4).
Działasz w języku polskim. Dbaj o perfekcyjną poprawność językową.
`;

const DEVELOPER_INSTRUCTIONS = `
ARCHITEKTURA WYJŚCIA (JSON -> React -> DOM):
1. Model NIE generuje dokumentu HTML. Zwraca wyłącznie ustrukturyzowany JSON.
2. Zadbaj, aby każda sekcja (personalData, professionalProfile, experience, education, skills, additional, gdprClause) była wypełniona.

WYTYCZNE DLA TREŚCI POD PDF:
1. RESPONSIBILITIES (Doświadczenie): Zwracaj listę zadań jako proste zdania.
   - WAŻNE: NIGDY nie dodawaj znaków wypunktowania (•, -, *, 1.) na początku tych stringów. Front-end sam dodaje stylizowane bullety.
2. PROFIL ZAWODOWY: 3-5 zdań podkreślających dopasowanie do oferty.
3. KLAUZULA RODO: Zawsze dołączaj standardową klauzulę (lub specyficzną, jeśli jest w ogłoszeniu).
4. SUGGESTIONS: Podaj 3-5 konkretnych rad dla użytkownika (np. "Warto dodać certyfikat X").

LOGIKA EDYCJI:
Jeśli podano 'user_changes', wprowadź TYLKO te zmiany do 'original_cv_generated'. Jeśli poproszono o usunięcie pola (np. "usuń adres"), usuń go z JSONa.
`;

export const generateCV = async (data: CVData): Promise<GeneratedResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const extraFieldsString = data.extraFields
    .map(f => `${f.key}: ${f.value}`)
    .join('\n');

  const prompt = `
    DANE WEJŚCIOWE:
    cv_user_text: ${data.cvUserText || 'Analizuj PDF'}
    job_offer_text: ${data.jobOfferText || 'Sprawdź link/opis'}
    extra_fields: ${extraFieldsString}
    user_changes: ${data.userChanges || 'brak'}
    original_cv_generated: ${data.originalCvGenerated || 'brak'}
    
    ZADANIE: Wygeneruj CV w formacie JSON zoptymalizowane pod wydruk A4.
  `;

  const parts: any[] = [];
  if (data.pdfBase64) parts.push({ inlineData: { mimeType: 'application/pdf', data: data.pdfBase64 } });
  if (data.photoBase64) parts.push({ inlineData: { mimeType: 'image/jpeg', data: data.photoBase64 } });
  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + "\n" + DEVELOPER_INSTRUCTIONS,
        temperature: 0.6,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            validationMessages: { type: Type.ARRAY, items: { type: Type.STRING } },
            cvContent: {
              type: Type.OBJECT,
              properties: {
                personalData: {
                  type: Type.OBJECT,
                  properties: {
                    fullName: { type: Type.STRING },
                    targetJobTitle: { type: Type.STRING },
                    email: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    address: { type: Type.STRING },
                    dateOfBirth: { type: Type.STRING }
                  },
                  required: ["fullName", "email", "phone"]
                },
                professionalProfile: { type: Type.STRING },
                experience: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      position: { type: Type.STRING },
                      company: { type: Type.STRING },
                      period: { type: Type.STRING },
                      responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                  }
                },
                education: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      degree: { type: Type.STRING },
                      institution: { type: Type.STRING },
                      period: { type: Type.STRING }
                    }
                  }
                },
                skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                additional: { type: Type.ARRAY, items: { type: Type.STRING } },
                gdprClause: { type: Type.STRING }
              },
              required: ["personalData", "professionalProfile", "experience", "education", "skills", "additional", "gdprClause"]
            },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["validationMessages", "cvContent", "suggestions"]
        }
      }
    });

    return JSON.parse(response.text || "{}") as GeneratedResponse;
  } catch (error) {
    console.error(error);
    throw new Error("Błąd podczas generowania CV.");
  }
};
