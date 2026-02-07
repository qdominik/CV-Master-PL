
import { GoogleGenAI, Type } from "@google/genai";
import { CVData, GeneratedResponse } from "../types";

const SYSTEM_INSTRUCTION = `
Jesteś modułem generatora CV o nazwie „CV Master – Optymalizator Kariery”.
Twoim celem jest przygotowanie profesjonalnej, ustrukturyzowanej treści CV w formacie JSON, która zostanie wyrenderowana przez aplikację React i wydrukowana do PDF (format A4).
Działasz w języku polskim. Dbaj o perfekcyjną poprawność językową.
`;

const DEVELOPER_INSTRUCTIONS = `
ARCHITEKTURA WYJŚCIA (JSON -> React -> DOM):
1. Model NIE generuje dokumentu HTML ani opisu swojego rozumowania. Zwraca wyłącznie ustrukturyzowany JSON.
2. KAŻDE POLE w JSON musi zawierać WYŁĄCZNIE finalną treść dokumentu.

RYGORYSTYCZNE ZAKAZY:
1. ZAKAZ ROZUMOWANIA W POLACH: Żadnych tekstów typu "poprawiono", "uproszczono", "wybrano główny dyplom". Podajesz tylko czysty wynik.
2. CZYSTOŚĆ WYNIKU: Jeśli w źródle są sprzeczności, rozstrzygnij je i podaj finalną wersję.

LOGIKA PODZIAŁU SEKCJI:
- EDUKACJA: Tylko edukacja formalna (Szkoły średnie, Studia wyższe).
- DOŚWIADCZENIE: Tylko historia zatrudnienia na stanowiskach.
- UMIEJĘTNOŚCI: Twarde i miękkie kompetencje (np. Python, Prawo Jazdy B, Negocjacje).
- DODATKOWE: Tutaj umieść Kursy, Szkolenia, Certyfikaty, Wolontariat, Projekty poboczne i Nagrody. Każdy element jako osobny, zwięzły ciąg znaków (np. "Kurs Pedagogiczny (2008)", "Certyfikat AWS Cloud Practitioner").
- GADR CLAUSE: Zawsze generuj standardową klauzulę o przetwarzaniu danych po polsku na końcu.
`;

export const generateCV = async (data: CVData): Promise<GeneratedResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    DANE WEJŚCIOWE:
    cv_user_text: ${data.cvUserText || 'Analizuj PDF'}
    job_offer_text: ${data.jobOfferText || 'Sprawdź opis'}
    user_changes: ${data.userChanges || 'brak'}
    original_cv_generated: ${data.originalCvGenerated || 'brak'}
    
    ZADANIE: Wygeneruj CV w formacie JSON.
    Skup się na sekcji 'additional' dla wszystkich kursów i certyfikatów, które nie są studiami wyższymi.
    Nie umieszczaj komentarzy ani procesów myślowych wewnątrz pól JSON.
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
        temperature: 0.1,
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
                    birthDate: { type: Type.STRING },
                    address: { type: Type.STRING }
                  },
                  required: ["fullName", "email", "phone", "birthDate", "address"]
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

    const text = response.text;
    if (!text) throw new Error("Pusta odpowiedź modelu.");
    return JSON.parse(text) as GeneratedResponse;
  } catch (error) {
    console.error(error);
    throw new Error("Błąd podczas generowania CV.");
  }
};
