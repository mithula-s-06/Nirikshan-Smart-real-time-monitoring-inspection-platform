import { create } from 'zustand';
import { IInspection, InspectionStatus, InspectionType, ChecklistItemType } from '@nirikshan/shared-types';

export interface MobileInspectionState {
  inspections: IInspection[];
  activeInspection: IInspection | null;
  currentStage: 'DETAILS' | 'GPS_CHECK' | 'CHECKLIST' | 'EVIDENCE' | 'OBSERVATIONS' | 'REVIEW' | 'SUBMITTED';
  isGpsVerified: boolean;
  gpsDistanceMeters: number | null;
  checklistAnswers: Record<string, { value: any; comment?: string; isCompliant?: boolean }>;
  capturedEvidence: Array<{ uri: string; type: string; timestamp: string; hash?: string }>;
  isOfflineMode: boolean;
  syncQueueCount: number;

  // Actions
  setInspections: (inspections: IInspection[]) => void;
  setActiveInspection: (inspection: IInspection | null) => void;
  setCurrentStage: (stage: MobileInspectionState['currentStage']) => void;
  setGpsVerification: (verified: boolean, distanceMeters: number) => void;
  updateChecklistAnswer: (questionId: string, answer: { value: any; comment?: string; isCompliant?: boolean }) => void;
  addCapturedEvidence: (evidence: { uri: string; type: string; timestamp: string; hash?: string }) => void;
  resetWorkflow: () => void;
}

export const useInspectionStore = create<MobileInspectionState>((set) => ({
  inspections: [],
  activeInspection: null,
  currentStage: 'DETAILS',
  isGpsVerified: false,
  gpsDistanceMeters: null,
  checklistAnswers: {},
  capturedEvidence: [],
  isOfflineMode: false,
  syncQueueCount: 0,

  setInspections: (inspections) => set({ inspections }),
  setActiveInspection: (activeInspection) => set({ activeInspection }),
  setCurrentStage: (currentStage) => set({ currentStage }),
  setGpsVerification: (isGpsVerified, gpsDistanceMeters) => set({ isGpsVerified, gpsDistanceMeters }),
  updateChecklistAnswer: (questionId, answer) =>
    set((state) => ({
      checklistAnswers: {
        ...state.checklistAnswers,
        [questionId]: answer,
      },
    })),
  addCapturedEvidence: (evidence) =>
    set((state) => ({
      capturedEvidence: [...state.capturedEvidence, evidence],
    })),
  resetWorkflow: () =>
    set({
      activeInspection: null,
      currentStage: 'DETAILS',
      isGpsVerified: false,
      gpsDistanceMeters: null,
      checklistAnswers: {},
      capturedEvidence: [],
    }),
}));
