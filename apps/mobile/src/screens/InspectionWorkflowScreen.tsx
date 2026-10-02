import React from 'react';
import { useInspectionStore } from '../store/inspectionStore';
import { InspectionStatus, ChecklistItemType } from '@nirikshan/shared-types';

export function InspectionWorkflowScreen() {
  const {
    activeInspection,
    currentStage,
    isGpsVerified,
    gpsDistanceMeters,
    checklistAnswers,
    setCurrentStage,
    updateChecklistAnswer,
  } = useInspectionStore();

  return {
    screenName: 'InspectionWorkflow',
    stages: ['DETAILS', 'GPS_CHECK', 'CHECKLIST', 'EVIDENCE', 'OBSERVATIONS', 'REVIEW', 'SUBMITTED'],
    currentStage,
    activeInspection,
    isGpsVerified,
    gpsDistanceMeters,
    checklistAnswers,
    nextStage: () => {
      const stages = ['DETAILS', 'GPS_CHECK', 'CHECKLIST', 'EVIDENCE', 'OBSERVATIONS', 'REVIEW', 'SUBMITTED'] as const;
      const idx = stages.indexOf(currentStage);
      if (idx >= 0 && idx < stages.length - 1) {
        setCurrentStage(stages[idx + 1]);
      }
    },
  };
}
