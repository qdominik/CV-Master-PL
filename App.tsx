
import React, { useState } from 'react';
import { 
  Document as PDFDocument, 
  Page, 
  Text as PDFText, 
  View, 
  StyleSheet, 
  Font, 
  Image as PDFImage,
  Link,
  pdf
} from '@react-pdf/renderer';
import { 
  Document as DocxDocument, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle, 
  ImageRun, 
  AlignmentType,
  Footer,
} from 'docx';
import { GeneratedResponse, CVContent } from './types';
import { generateCV } from './services/geminiService';

// REJESTRACJA CZCIONEK PDF (z polskimi znakami)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ],
});

const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Roboto', color: '#334155', backgroundColor: '#ffffff' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#1e293b', 
    borderBottomStyle: 'solid',
    paddingBottom: 20,
    alignItems: 'flex-start'
  },
  headerLeft: { flex: 1, paddingRight: 20 },
  firstName: { fontSize: 24, fontWeight: 300, color: '#1e293b', textTransform: 'uppercase' },
  lastName: { fontSize: 24, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', marginTop: -5 },
  contactRow: { flexDirection: 'row', marginTop: 6, fontSize: 9, color: '#475569', alignItems: 'center' },
  contactLabel: { fontWeight: 700, color: '#1e293b' },
  link: { color: '#2563eb', textDecoration: 'underline' },
  photoContainer: {
    width: 85,
    height: 85,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'solid',
    overflow: 'hidden',
    backgroundColor: '#f8fafc'
  },
  photo: { width: '100%', height: '100%', objectFit: 'cover' },
  container: { flexDirection: 'row', gap: 30 },
  leftCol: { width: '65%' },
  rightCol: { width: '35%' },
  sectionTitle: { 
    fontSize: 10, 
    fontWeight: 700, 
    color: '#2563eb', 
    textTransform: 'uppercase', 
    marginBottom: 10, 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#cbd5e1', 
    borderBottomStyle: 'solid',
    paddingBottom: 2, 
    marginTop: 15 
  },
  profileText: { fontSize: 9, lineHeight: 1.5, color: '#334155', textAlign: 'justify', marginBottom: 15 },
  experienceItem: { marginBottom: 15 },
  experienceHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 2,
    gap: 10
  },
  positionTitle: { fontSize: 11, fontWeight: 700, color: '#1e293b', flex: 1 },
  companyName: { fontSize: 9, fontWeight: 700, color: '#2563eb', marginBottom: 4 },
  period: { fontSize: 8, color: '#64748b', textAlign: 'right', minWidth: 80 },
  bulletRow: { flexDirection: 'row', marginBottom: 2, paddingLeft: 5 },
  bulletDot: { width: 10, color: '#2563eb', fontSize: 10 },
  bulletContent: { flex: 1, fontSize: 9, color: '#475569', lineHeight: 1.3 },
  skillBadge: { 
    fontSize: 8, 
    borderWidth: 0.5, 
    borderColor: '#e2e8f0', 
    borderStyle: 'solid',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 3, 
    marginBottom: 4,
    marginRight: 4,
    backgroundColor: '#f8fafc' 
  },
  additionalItem: { fontSize: 8, color: '#475569', marginBottom: 3 },
  eduItem: { marginBottom: 10 },
  eduTitle: { fontSize: 9, fontWeight: 700, color: '#1e293b' },
  eduInfo: { fontSize: 8, color: '#64748b' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 0.5, borderTopColor: '#e2e8f0', borderTopStyle: 'solid', paddingTop: 10 },
  gdpr: { fontSize: 7, color: '#94a3b8', textAlign: 'justify' }
});

const CVDocumentPDF = ({ content, photo }: { content: CVContent, photo: string | null }) => {
  const nameParts = (content.personalData?.fullName || "Imię Nazwisko").split(' ');
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(' ') || "";

  return (
    <PDFDocument title={`CV - ${content.personalData.fullName}`}>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <View style={pdfStyles.headerLeft}>
            <PDFText style={pdfStyles.firstName}>{firstName}</PDFText>
            <PDFText style={pdfStyles.lastName}>{lastName}</PDFText>
            <View style={pdfStyles.contactRow}>
              <PDFText style={pdfStyles.contactLabel}>E-mail: </PDFText>
              <Link src={`mailto:${content.personalData?.email}`} style={pdfStyles.link}>{content.personalData?.email}</Link>
              <PDFText> | </PDFText>
              <PDFText style={pdfStyles.contactLabel}>Tel: </PDFText>
              <PDFText>{content.personalData?.phone}</PDFText>
            </View>
            <View style={pdfStyles.contactRow}>
              <PDFText style={pdfStyles.contactLabel}>Data ur.: </PDFText>
              <PDFText>{content.personalData?.birthDate}</PDFText>
              <PDFText> | </PDFText>
              <PDFText style={pdfStyles.contactLabel}>Adres: </PDFText>
              <PDFText>{content.personalData?.address}</PDFText>
            </View>
          </View>
          {photo && <View style={pdfStyles.photoContainer}><PDFImage src={photo} style={pdfStyles.photo} /></View>}
        </View>
        <View style={pdfStyles.container}>
          <View style={pdfStyles.leftCol}>
            <PDFText style={pdfStyles.sectionTitle}>Profil Zawodowy</PDFText>
            <PDFText style={pdfStyles.profileText}>{content.professionalProfile}</PDFText>
            <PDFText style={pdfStyles.sectionTitle}>Doświadczenie</PDFText>
            {content.experience?.map((exp, idx) => (
              <View key={idx} style={pdfStyles.experienceItem}>
                <View style={pdfStyles.experienceHeader}>
                  <PDFText style={pdfStyles.positionTitle}>{exp.position}</PDFText>
                  <PDFText style={pdfStyles.period}>{exp.period}</PDFText>
                </View>
                <PDFText style={pdfStyles.companyName}>{exp.company}</PDFText>
                {exp.responsibilities?.map((res, i) => (
                  <View key={i} style={pdfStyles.bulletRow}>
                    <PDFText style={pdfStyles.bulletDot}>•</PDFText>
                    <PDFText style={pdfStyles.bulletContent}>{res}</PDFText>
                  </View>
                ))}
              </View>
            ))}
          </View>
          <View style={pdfStyles.rightCol}>
            <PDFText style={pdfStyles.sectionTitle}>Umiejętności</PDFText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {content.skills?.map((skill, idx) => <PDFText key={idx} style={pdfStyles.skillBadge}>{skill}</PDFText>)}
            </View>
            <PDFText style={pdfStyles.sectionTitle}>Edukacja</PDFText>
            {content.education?.map((edu, idx) => (
              <View key={idx} style={pdfStyles.eduItem}>
                <PDFText style={pdfStyles.eduTitle}>{edu.degree}</PDFText>
                <PDFText style={pdfStyles.eduInfo}>{edu.institution}</PDFText>
                <PDFText style={pdfStyles.eduInfo}>{edu.period}</PDFText>
              </View>
            ))}
            {content.additional && content.additional.length > 0 && (
              <>
                <PDFText style={pdfStyles.sectionTitle}>DODATKOWE</PDFText>
                {content.additional.map((item, idx) => (
                  <PDFText key={idx} style={pdfStyles.additionalItem}>• {item}</PDFText>
                ))}
              </>
            )}
          </View>
        </View>
        <View style={pdfStyles.footer}><PDFText style={pdfStyles.gdpr}>{content.gdprClause}</PDFText></View>
      </Page>
    </PDFDocument>
  );
};

const App: React.FC = () => {
  const [cvUserText, setCvUserText] = useState('');
  const [pdfFile, setPdfFile] = useState<string | undefined>(undefined);
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [jobOffer, setJobOffer] = useState('');
  const [refinementText, setRefinementText] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<GeneratedResponse | null>(null);

  const handleGenerate = async (isRefinement: boolean = false) => {
    if (!cvUserText && !pdfFile && !isRefinement) return alert("Wgraj CV lub tekst.");
    setLoading(true);
    try {
      const res = await generateCV({
        cvUserText: isRefinement ? '' : cvUserText,
        pdfBase64: isRefinement ? undefined : pdfFile,
        photoBase64: photoBase64?.split(',')[1],
        jobOfferText: jobOffer,
        extraFields: [],
        userChanges: isRefinement ? refinementText : '',
        originalCvGenerated: isRefinement && result ? JSON.stringify(result.cvContent) : undefined
      });
      setResult(res);
      if (isRefinement) setRefinementText('');
    } catch (err: any) {
      alert("Błąd: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const blob = await pdf(<CVDocumentPDF content={result.cvContent} photo={photoBase64 || null} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CV_${result.cvContent.personalData.fullName.replace(/\s+/g, '_')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Błąd generowania PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const content = result.cvContent;
      const nameParts = content.personalData.fullName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      let imageRun: ImageRun | null = null;
      if (photoBase64) {
        try {
          const base64Data = photoBase64.split(',')[1];
          const binaryString = window.atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
          imageRun = new ImageRun({
            data: bytes,
            transformation: { width: 90, height: 90 },
          });
        } catch (e) { console.error("Błąd zdjęcia DOCX", e); }
      }

      const doc = new DocxDocument({
        sections: [{
          properties: {},
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  border: { top: { style: BorderStyle.SINGLE, size: 4, color: "e2e8f0" } },
                  spacing: { before: 200 },
                  children: [new TextRun({ text: content.gdprClause, size: 14, italic: true, color: "94a3b8" })],
                  alignment: AlignmentType.JUSTIFY
                })
              ]
            })
          },
          children: [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { top: BorderStyle.NONE, bottom: { style: BorderStyle.SINGLE, size: 6, color: "1e293b" }, left: BorderStyle.NONE, right: BorderStyle.NONE, insideHorizontal: BorderStyle.NONE, insideVertical: BorderStyle.NONE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 75, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({ children: [new TextRun({ text: firstName, size: 48, color: "1e293b" })] }),
                        new Paragraph({ children: [new TextRun({ text: lastName, size: 48, bold: true, color: "2563eb" })] }),
                        new Paragraph({
                          spacing: { before: 200 },
                          children: [
                            new TextRun({ text: "E-mail: ", bold: true, size: 18 }),
                            new TextRun({ text: content.personalData.email, size: 18, color: "2563eb", underline: {} }),
                            new TextRun({ text: " | Tel: ", size: 18, bold: true }),
                            new TextRun({ text: content.personalData.phone, size: 18 }),
                          ]
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      children: imageRun ? [new Paragraph({ children: [imageRun], alignment: AlignmentType.RIGHT })] : [],
                    }),
                  ],
                }),
              ],
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE, insideHorizontal: BorderStyle.NONE, insideVertical: BorderStyle.NONE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 65, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "Profil Zawodowy", bold: true, color: "2563eb", size: 20 })], spacing: { before: 400, after: 100 } }),
                        new Paragraph({ children: [new TextRun({ text: content.professionalProfile, size: 18 })], alignment: AlignmentType.JUSTIFY }),
                        new Paragraph({ children: [new TextRun({ text: "Doświadczenie", bold: true, color: "2563eb", size: 20 })], spacing: { before: 400, after: 100 } }),
                        ...content.experience.flatMap(exp => [
                          new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: BorderStyle.NONE,
                            rows: [new TableRow({ children: [
                              new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: exp.position, bold: true, size: 22 })] })] }),
                              new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: exp.period, italic: true, size: 16, color: "64748b" })], alignment: AlignmentType.RIGHT })] })
                            ]})]
                          }),
                          new Paragraph({ children: [new TextRun({ text: exp.company, bold: true, color: "2563eb", size: 18 })] }),
                          ...exp.responsibilities.map(res => new Paragraph({ children: [new TextRun({ text: `• ${res}`, size: 18 })], indent: { left: 240 }, spacing: { after: 50 } }))
                        ])
                      ],
                    }),
                    new TableCell({
                      width: { size: 35, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "Umiejętności", bold: true, color: "2563eb", size: 20 })], spacing: { before: 400, after: 100 } }),
                        new Paragraph({ children: [new TextRun({ text: content.skills.join(", "), size: 16 })] }),
                        new Paragraph({ children: [new TextRun({ text: "Edukacja", bold: true, color: "2563eb", size: 20 })], spacing: { before: 400, after: 100 } }),
                        ...content.education.flatMap(edu => [
                          new Paragraph({ children: [new TextRun({ text: edu.degree, bold: true, size: 18 })], spacing: { before: 100 } }),
                          new Paragraph({ children: [new TextRun({ text: edu.institution, size: 16, color: "64748b" })] }),
                          new Paragraph({ children: [new TextRun({ text: edu.period, size: 16, color: "2563eb", bold: true })] })
                        ]),
                        ...(content.additional && content.additional.length > 0 ? [
                          new Paragraph({ children: [new TextRun({ text: "Dodatkowe", bold: true, color: "2563eb", size: 20 })], spacing: { before: 400, after: 100 } }),
                          ...content.additional.map(item => new Paragraph({ children: [new TextRun({ text: `• ${item}`, size: 16 })], spacing: { after: 50 } }))
                        ] : [])
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CV_${content.personalData.fullName.replace(/\s+/g, '_')}.docx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Błąd DOCX.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm space-y-4 h-fit border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white font-bold">CM</div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">CV Master AI</h1>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Twoje zdjęcie</label>
              <input type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setPhotoPreview(URL.createObjectURL(f));
                  const r = new FileReader();
                  r.onload = () => setPhotoBase64(r.result as string);
                  r.readAsDataURL(f);
                }
              }} className="block w-full text-xs border border-slate-200 p-2 rounded-lg file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Treść CV</label>
              <textarea className="w-full h-40 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" placeholder="Wklej treść swojego CV..." value={cvUserText} onChange={(e) => setCvUserText(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Oferta Pracy</label>
              <textarea className="w-full h-40 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" placeholder="Wklej ofertę..." value={jobOffer} onChange={(e) => setJobOffer(e.target.value)} />
            </div>
            <button onClick={() => handleGenerate(false)} disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg disabled:bg-slate-300 transition-all">
              {loading ? 'Generowanie...' : 'Optymalizuj CV'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          {loading && !result ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-20 flex flex-col items-center justify-center text-center space-y-6 h-full min-h-[600px] shadow-sm animate-pulse">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium">Sztuczna inteligencja buduje Twoje CV...</p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col border border-slate-200 animate-in fade-in duration-500">
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                  <div>
                    <h2 className="font-bold text-sm md:text-base">Podgląd dokumentu</h2>
                    <p className="text-[10px] text-slate-400">Wygenerowano przez AI Master</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleDownloadPDF} disabled={downloading} className="bg-blue-600 hover:bg-blue-500 px-3 md:px-6 py-2 rounded-lg font-bold text-xs transition-all disabled:bg-slate-700">PDF</button>
                    <button onClick={handleDownloadDocx} disabled={downloading} className="bg-slate-700 hover:bg-slate-600 px-3 md:px-6 py-2 rounded-lg font-bold text-xs transition-all disabled:bg-slate-800">DOCX</button>
                  </div>
                </div>

                {/* PODGLĄD Z POPRAWNĄ LOGIKĄ WIELOSTRONICOWĄ */}
                <div className="p-4 md:p-8 bg-slate-200 overflow-y-auto max-h-[800px] flex flex-col items-center gap-8 scroll-smooth">
                  <div className="bg-white w-full max-w-[600px] shadow-2xl font-sans text-slate-800 flex flex-col relative min-h-[848px] overflow-visible">
                    
                    {/* LINIE POMOCNICZE I PRZERWY MIĘDZY STRONAMI */}
                    {[848, 1696, 2544, 3392].map((top, index) => (
                      <div 
                        key={index} 
                        style={{ top: `${top}px` }} 
                        className="absolute left-[-40px] right-[-40px] z-50 pointer-events-none"
                      >
                        <div className="border-t-4 border-dashed border-slate-400/30 w-full mb-1"></div>
                        <div className="flex justify-between items-center px-10">
                          <span className="bg-slate-800 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                            STRONA {index + 1} / {index + 2}
                          </span>
                          <span className="bg-red-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                            MIEJSCE CIĘCIA PDF
                          </span>
                        </div>
                        <div className="border-b-4 border-dashed border-slate-400/30 w-full mt-1"></div>
                      </div>
                    ))}

                    <div className="p-6 md:p-10 flex-1 flex flex-col bg-white">
                      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                        <div className="flex-1 pr-6">
                          <h3 className="text-2xl md:text-3xl font-light text-slate-900 uppercase tracking-wider">{result.cvContent.personalData?.fullName?.split(' ')[0]}</h3>
                          <h3 className="text-2xl md:text-3xl font-bold text-blue-600 uppercase tracking-wider -mt-1">{result.cvContent.personalData?.fullName?.split(' ').slice(1).join(' ')}</h3>
                          <div className="mt-4 space-y-1">
                            <div className="text-[10px] flex items-center gap-1 text-slate-500 font-medium flex-wrap">
                              <span className="font-bold text-slate-700 uppercase">E-mail:</span>
                              <span className="text-blue-600 underline">{result.cvContent.personalData?.email}</span>
                              <span className="mx-1">|</span>
                              <span className="font-bold text-slate-700 uppercase">Tel:</span>
                              <span>{result.cvContent.personalData?.phone}</span>
                            </div>
                            <div className="text-[10px] flex items-center gap-1 text-slate-500 font-medium flex-wrap">
                              <span className="font-bold text-slate-700 uppercase">Adres:</span>
                              <span>{result.cvContent.personalData?.address}</span>
                            </div>
                          </div>
                        </div>
                        {photoPreview && <div className="w-20 md:w-24 h-20 md:h-24 flex-shrink-0 bg-slate-50 rounded shadow-md border overflow-hidden"><img src={photoPreview} alt="Profil" className="w-full h-full object-cover" /></div>}
                      </div>
                      
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="w-full md:w-2/3 space-y-6">
                          <section>
                            <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest border-b border-slate-200 pb-1 mb-3">Profil Zawodowy</h4>
                            <p className="text-[11px] leading-relaxed text-slate-600 text-justify">{result.cvContent.professionalProfile}</p>
                          </section>
                          <section>
                            <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest border-b border-slate-200 pb-1 mb-3">Doświadczenie</h4>
                            <div className="space-y-6">
                              {result.cvContent.experience?.map((exp, i) => (
                                <div key={i} className="space-y-1">
                                  <div className="flex justify-between items-start gap-4">
                                    <p className="text-xs font-bold text-slate-900 flex-1 leading-snug">{exp.position}</p>
                                    <span className="text-[10px] text-slate-400 font-bold italic whitespace-nowrap pt-0.5">{exp.period}</span>
                                  </div>
                                  <p className="text-[10px] font-bold text-blue-600">{exp.company}</p>
                                  <ul className="list-disc list-inside text-[10px] text-slate-500 space-y-1 mt-1 pl-1">
                                    {exp.responsibilities?.map((res, j) => <li key={j} className="leading-tight text-justify">{res}</li>)}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </section>
                        </div>
                        
                        <div className="w-full md:w-1/3 space-y-6">
                          <section>
                            <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest border-b border-slate-200 pb-1 mb-3">Umiejętności</h4>
                            <div className="flex flex-wrap gap-1.5">{result.cvContent.skills?.map((s, i) => <span key={i} className="text-[9px] bg-slate-50 border border-slate-100 px-2 py-1 rounded font-medium text-slate-600">{s}</span>)}</div>
                          </section>
                          <section>
                            <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest border-b border-slate-200 pb-1 mb-3">Edukacja</h4>
                            <div className="space-y-3">
                              {result.cvContent.education?.map((edu, i) => (
                                <div key={i}>
                                  <p className="text-[10px] font-bold text-slate-900 leading-tight">{edu.degree}</p>
                                  <p className="text-[9px] text-slate-500">{edu.institution}</p>
                                  <p className="text-[9px] text-blue-600 font-bold tracking-tight">{edu.period}</p>
                                </div>
                              ))}
                            </div>
                          </section>
                          {result.cvContent.additional && result.cvContent.additional.length > 0 && (
                            <section>
                              <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest border-b border-slate-200 pb-1 mb-3">DODATKOWE</h4>
                              <ul className="space-y-1.5">
                                {result.cvContent.additional.map((item, i) => (
                                  <li key={i} className="text-[10px] text-slate-500 leading-tight border-l-2 border-blue-100 pl-2">{item}</li>
                                ))}
                              </ul>
                            </section>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-12 pt-8 border-t border-slate-100">
                        <p className="text-[7px] text-slate-400 leading-tight italic text-justify">{result.cvContent.gdprClause}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-blue-50 border-t border-blue-100">
                  <h4 className="text-xs font-bold text-blue-800 uppercase mb-3 flex items-center gap-2">Sugestie AI:</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">{result.suggestions?.map((s, i) => <li key={i} className="text-[11px] text-blue-700">• {s}</li>)}</ul>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Popraw dokument z AI</h3>
                <textarea className="w-full h-20 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all outline-none resize-none" placeholder="Np. 'Zmień ton profilu na bardziej kreatywny'..." value={refinementText} onChange={(e) => setRefinementText(e.target.value)} />
                <button onClick={() => handleGenerate(true)} disabled={loading || !refinementText.trim()} className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold shadow-lg disabled:bg-slate-200 transition-all">
                  {loading ? 'Poprawianie...' : 'Zastosuj poprawki AI'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 flex flex-col items-center justify-center text-center space-y-4 h-full min-h-[600px]">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl">📄</div>
              <h3 className="text-lg font-bold text-slate-700">Wgraj dane, aby zobaczyć podgląd</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
