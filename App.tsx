
import React, { useState, useRef } from 'react';
import { CVData, ExtraField, GeneratedResponse, CVContent } from './types';
import { generateCV } from './services/geminiService';

const App: React.FC = () => {
  const [cvUserText, setCvUserText] = useState('');
  const [pdfBase64, setPdfBase64] = useState<string | undefined>(undefined);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [jobOfferText, setJobOfferText] = useState('');
  const [jobOfferUrl, setJobOfferUrl] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'link'>('text');
  const [extraFields, setExtraFields] = useState<ExtraField[]>([
    { id: '1', key: 'Data urodzenia', value: '' },
    { id: '2', key: 'Adres', value: '' }
  ]);
  const [userChanges, setUserChanges] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedResponse | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const addExtraField = () => {
    setExtraFields(prev => [...prev, { id: Date.now().toString(), key: '', value: '' }]);
  };

  const updateExtraField = (id: string, key: string, value: string) => {
    setExtraFields(prev => prev.map(f => f.id === id ? { ...f, key, value } : f));
  };

  const removeExtraField = (id: string) => {
    setExtraFields(prev => prev.filter(f => f.id !== id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Proszę wybrać plik PDF.');
        return;
      }
      setPdfFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setPdfBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Proszę wybrać plik graficzny.');
        return;
      }
      setPhotoPreview(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setPhotoBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePdf = () => {
    setPdfBase64(undefined);
    setPdfFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = () => {
    setPhotoBase64(undefined);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleGenerate = async (isRefining: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const data: CVData = {
        cvUserText,
        pdfBase64,
        photoBase64,
        jobOfferText: inputMode === 'text' ? jobOfferText : '',
        jobOfferUrl: inputMode === 'link' ? jobOfferUrl : '',
        extraFields,
        userChanges: isRefining ? userChanges : '',
        originalCvGenerated: isRefining ? JSON.stringify(result?.cvContent) : undefined
      };
      
      const response = await generateCV(data);
      setResult(response);
      if (isRefining) setUserChanges('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    console.debug("[DRUK] Rozpoczynam procedurę drukowania PDF");
    const el = document.getElementById('printable-cv-area');
    console.debug(`[DRUK] Element #printable-cv-area znaleziony: ${!!el}`);
    
    if (el) {
      let current: HTMLElement | null = el;
      while (current && current.tagName !== 'BODY') {
        const style = window.getComputedStyle(current);
        if (style.display === 'none') console.warn(`[DRUK] ⚠️ Rodzic (${current.tagName}) ma display:none`);
        if (style.visibility === 'hidden') console.warn(`[DRUK] ⚠️ Rodzic (${current.tagName}) ma visibility:hidden`);
        if (style.overflow === 'hidden' && current.tagName !== 'HTML') console.warn(`[DRUK] ⚠️ Rodzic (${current.tagName}) ma overflow:hidden`);
        current = current.parentElement;
      }
    }
    
    console.debug("[DRUK] Wywołuję window.print()...");
    window.print();
    console.debug("[DRUK] Procedura drukowania została uruchomiona");
  };

  const CVRenderer = ({ content }: { content: CVContent | null }) => {
    const names = content?.personalData.fullName.trim().split(' ') || [];
    const surname = names.length > 1 ? names.pop() : '';
    const firstName = names.join(' ');

    return (
      <div 
        id="printable-cv-area"
        className={`cv-page bg-white p-[20mm] w-[210mm] min-h-[297mm] mx-auto text-slate-800 relative flex flex-col shadow-2xl print:shadow-none print:m-0 print:border-none ${!content ? 'hidden' : ''}`}
        style={{ boxSizing: 'border-box' }}
      >
        {content && (
          <>
            <header className="flex justify-between items-start mb-10 border-b-2 border-slate-800 pb-8 shrink-0">
              <div className="flex-1 pr-6">
                <div className="text-4xl font-light tracking-[0.3em] uppercase leading-tight mb-4">
                  <div className="text-slate-800">{firstName.split('').join(' ')}</div>
                  <div className="text-blue-700 font-medium">{surname?.split('').join(' ')}</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[10px] print:!bg-[#eff6ff] print:!text-[#2563eb]">@</span>
                    <span className="font-medium">{content.personalData.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">T:</span>
                    <span>{content.personalData.phone}</span>
                  </div>
                  {content.personalData.address && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">A:</span>
                      <span>{content.personalData.address}</span>
                    </div>
                  )}
                  {content.personalData.dateOfBirth && (
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">
                      Data urodzenia: {content.personalData.dateOfBirth}
                    </div>
                  )}
                </div>
              </div>
              {photoPreview && (
                <div className="flex-shrink-0 ml-8">
                  <img src={photoPreview} alt="Candidate" className="w-[35mm] h-[45mm] object-cover rounded-lg shadow-sm border-2 border-white print:border-slate-100" />
                </div>
              )}
            </header>

            <div className="grid grid-cols-12 gap-10 flex-1 mb-10">
              <main className="col-span-8 space-y-8">
                <section>
                  <h2 className="text-sm font-bold tracking-[0.15em] text-blue-700 uppercase mb-4 flex items-center gap-4">
                    PROFIL ZAWODOWY
                    <span className="flex-1 h-[1px] bg-slate-100"></span>
                  </h2>
                  <p className="text-sm leading-relaxed text-slate-700 font-light italic">{content.professionalProfile}</p>
                </section>
                <section>
                  <h2 className="text-sm font-bold tracking-[0.15em] text-blue-700 uppercase mb-6 flex items-center gap-4">
                    DOŚWIADCZENIE
                    <span className="flex-1 h-[1px] bg-slate-100"></span>
                  </h2>
                  <div className="space-y-8 relative before:absolute before:left-[-1.5rem] before:top-2 before:bottom-0 before:w-[2px] before:bg-blue-50">
                    {content.experience.map((item, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute left-[-1.75rem] top-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-4 ring-blue-50/50 print:!bg-[#2563eb]"></div>
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex-1 pr-4">
                            <h3 className="text-base font-bold text-slate-800 leading-tight">{item.position}</h3>
                            <p className="text-sm font-medium text-blue-600">{item.company}</p>
                          </div>
                          <span className="text-[10px] px-2 py-1 bg-slate-800 text-white font-bold rounded uppercase tracking-wider whitespace-nowrap print:!bg-[#1e293b] print:!text-white">
                            {item.period}
                          </span>
                        </div>
                        <ul className="space-y-1.5 mt-3 list-none">
                          {item.responsibilities.map((resp, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start leading-relaxed">
                              <span className="text-blue-600 mr-2 flex-shrink-0 mt-0.5">•</span>{resp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              </main>
              <aside className="col-span-4 space-y-10 border-l border-slate-50 pl-10">
                <section>
                  <h2 className="text-sm font-bold tracking-[0.15em] text-blue-700 uppercase mb-6">UMIEJĘTNOŚCI</h2>
                  <div className="flex flex-wrap gap-2">
                    {content.skills.map((skill, idx) => (
                      <span key={idx} className="text-[10px] px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-md shadow-sm">{skill}</span>
                    ))}
                  </div>
                </section>
                <section>
                  <h2 className="text-sm font-bold tracking-[0.15em] text-blue-700 uppercase mb-6">EDUKACJA</h2>
                  <div className="space-y-6">
                    {content.education.map((item, idx) => (
                      <div key={idx}>
                        <h3 className="text-sm font-bold text-slate-800">{item.degree}</h3>
                        <p className="text-xs text-slate-500">{item.institution}</p>
                        <p className="text-[10px] font-bold text-blue-600 mt-1">{item.period}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                  <h2 className="text-sm font-bold tracking-[0.15em] text-blue-700 uppercase mb-6">DODATKOWE</h2>
                  <ul className="space-y-3">
                    {content.additional.map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-600 leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </section>
              </aside>
            </div>
            <footer className="mt-auto pt-6 text-[9px] text-slate-400 border-t border-slate-100 italic leading-snug shrink-0">
              {content.gdprClause}
            </footer>
          </>
        )}
        <style dangerouslySetInnerHTML={{ __html: `
          @page { size: A4; margin: 0; }
          @media print {
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            html, body { width: 210mm !important; height: 297mm !important; margin: 0 !important; padding: 0 !important; background: white !important; overflow: visible !important; }
            #root { overflow: visible !important; height: auto !important; }
            .no-print { display: none !important; }
            .cv-page { position: relative !important; width: 210mm !important; height: 297mm !important; min-height: 297mm !important; padding: 20mm 15mm !important; margin: 0 !important; border: none !important; box-shadow: none !important; transform: none !important; transform-origin: top left !important; background: white !important; display: flex !important; flex-direction: column !important; overflow: visible !important; }
            .preview-scale-wrapper { transform: none !important; width: auto !important; height: auto !important; display: block !important; }
          }
        `}} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 no-print">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800">CV Master <span className="text-blue-600 font-normal">| Kreator Premium</span></h1>
          </div>
          <div className="flex items-center gap-4">
            {result && (
              <button onClick={handlePrint} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-900 shadow-lg transition-all transform active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                POBIERZ PDF / DRUKUJ
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 no-print">
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800"><span className="w-6 h-6 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">1</span>Źródło danych</h2>
            <div className="flex gap-2 mb-4">
              <input type="file" ref={photoInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
              <button onClick={() => photoInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 py-3 rounded-xl border border-slate-200 transition-colors">Zdjęcie</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 py-3 rounded-xl border border-blue-200 transition-colors">Wgraj PDF</button>
            </div>
            <textarea className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all" placeholder="Wklej swoje aktualne CV lub opis doświadczenia..." value={cvUserText} onChange={(e) => setCvUserText(e.target.value)} />
          </section>
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold flex items-center gap-2 text-slate-800"><span className="w-6 h-6 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">2</span>Oferta pracy</h2>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setInputMode('text')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${inputMode === 'text' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>TEKST</button>
                <button onClick={() => setInputMode('link')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${inputMode === 'link' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>LINK</button>
              </div>
            </div>
            {inputMode === 'text' ? <textarea className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all" placeholder="Wklej treść ogłoszenia o pracę..." value={jobOfferText} onChange={(e) => setJobOfferText(e.target.value)} /> : <input type="url" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="https://www.pracuj.pl/oferta/..." value={jobOfferUrl} onChange={(e) => setJobOfferUrl(e.target.value)} />}
          </section>
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold flex items-center gap-2 text-slate-800"><span className="w-6 h-6 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">3</span>Dodatkowe dane</h2><button onClick={addExtraField} className="text-xs font-bold text-blue-600 hover:underline">+ DODAJ POLE</button></div>
            <div className="space-y-3">
              {extraFields.map((f) => (
                <div key={f.id} className="flex gap-2 items-center group">
                  <input type="text" placeholder="Nazwa pola" className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" value={f.key} onChange={(e) => updateExtraField(f.id, e.target.value, f.value)} />
                  <input type="text" placeholder="Wartość" className="flex-[2] p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" value={f.value} onChange={(e) => updateExtraField(f.id, f.key, e.target.value)} />
                  <button onClick={() => removeExtraField(f.id)} className="text-slate-300 hover:text-red-500 font-bold px-2">&times;</button>
                </div>
              ))}
            </div>
          </section>
          <button onClick={() => handleGenerate(false)} disabled={loading} className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-xl transform active:scale-95 ${loading ? 'bg-slate-300' : 'bg-blue-600 hover:bg-blue-700'}`}>{loading ? 'ANALIZUJĘ DANE...' : 'GENERUJ DOPASOWANE CV'}</button>
        </div>

        <div className="lg:col-span-7 flex flex-col space-y-6">
          <div className={`flex-1 bg-slate-200/50 rounded-3xl p-8 overflow-auto flex justify-center min-h-[600px] ${loading ? 'opacity-40 grayscale animate-pulse' : ''}`}>
            <div className={`preview-scale-wrapper origin-top scale-[0.6] sm:scale-[0.7] md:scale-[0.8] lg:scale-[0.9] xl:scale-100 ${!result ? 'hidden' : ''}`}>
              <CVRenderer content={result?.cvContent || null} />
            </div>
            {!result && (
              <div className="w-full flex flex-col items-center justify-center text-slate-400 text-center p-12 space-y-4">
                <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 max-w-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto mb-6 opacity-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <p className="text-xl font-bold text-slate-500 mb-2">Gotowy do optymalizacji?</p>
                  <p className="text-sm opacity-60">Wypełnij dane po lewej. Gemini Pro przygotuje treść idealnie pod ofertę pracy, zachowując strukturę gotową do druku A4.</p>
                </div>
              </div>
            )}
          </div>
          {result && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 no-print">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /></svg>Dostosuj przez AI (Edycja)</h3>
              <div className="flex gap-2">
                <input type="text" placeholder="Np. 'usuń datę urodzenia'..." className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={userChanges} onChange={(e) => setUserChanges(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenerate(true)} />
                <button onClick={() => handleGenerate(true)} disabled={loading || !userChanges} className="bg-slate-800 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-slate-900 transition-colors">WYKONAJ</button>
              </div>
            </div>
          )}
          {result?.suggestions && result.suggestions.length > 0 && (
            <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-xl no-print animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-bold text-xs uppercase tracking-widest mb-3 opacity-80">Rekomendacje CV Master:</h3>
              <ul className="space-y-2">{result.suggestions.map((s, i) => (<li key={i} className="text-sm flex gap-3 items-start"><span className="opacity-60 text-lg leading-none mt-1">★</span><span>{s}</span></li>))}</ul>
            </div>
          )}
        </div>
      </main>
      <footer className="bg-white border-t border-slate-200 p-6 text-center text-slate-400 text-[10px] no-print">
        <p>CV Master – Optymalizacja Kariery AI. Zgodne ze standardem wydruku PDF (A4).</p>
      </footer>
    </div>
  );
};

export default App;
