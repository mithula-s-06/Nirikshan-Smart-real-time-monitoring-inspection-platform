import React from 'react';
import { useInspectionStore } from '../store/inspectionStore';
import { InspectionStatus, InspectionType } from '@nirikshan/shared-types';

export function InspectorDashboardScreen() {
  const { inspections, setActiveInspection, setCurrentStage } = useInspectionStore();

  const handleSelectInspection = (inspection: any) => {
    setActiveInspection(inspection);
    setCurrentStage('DETAILS');
  };

  return {
    screenName: 'InspectorDashboard',
    title: 'NIRIKSHAN Field Inspector Dashboard',
    stats: {
      assignedCount: inspections.filter((i) => i.status === InspectionStatus.ASSIGNED).length,
      inProgressCount: inspections.filter((i) => i.status === InspectionStatus.IN_PROGRESS).length,
      submittedCount: inspections.filter((i) => i.status === InspectionStatus.SUBMITTED).length,
    },
    actions: {
      onSelectInspection: handleSelectInspection,
    },
  };
}
