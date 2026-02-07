
export interface ExtraField {
  id: string;
  key: string;
  value: string;
}

export interface ExperienceItem {
  position: string;
  company: string;
  location: string;
  period: string;
  responsibilities: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  location: string;
  period: string;
}

export interface CVContent {
  personalData: {
    fullName: string;
    targetJobTitle: string;
    email: string;
    phone: string;
    birthDate: string;
    address: string;
  };
  professionalProfile: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  additional: string[];
  gdprClause: string;
}

export interface CVData {
  cvUserText: string;
  pdfBase64?: string;
  photoBase64?: string;
  jobOfferText: string;
  jobOfferUrl?: string;
  extraFields: ExtraField[];
  userChanges: string;
  originalCvGenerated?: string;
}

export interface GeneratedResponse {
  validationMessages: string[];
  cvContent: CVContent;
  suggestions: string[];
}
