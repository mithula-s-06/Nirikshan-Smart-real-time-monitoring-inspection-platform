declare module '*sessionController.js' {
  export const createSession: any;
  export const uploadSessionPhoto: any;
  export const saveTicks: any;
  export const finalizeSession: any;
  export const getSessions: any;
  export const getSessionById: any;
}

declare module '*staffController.js' {
  export const staffCheckin: any;
  export const getStaffCheckins: any;
}

declare module '*dashboardController.js' {
  export const getUnits: any;
  export const getUnitById: any;
  export const getParticipants: any;
  export const updateParticipantReason: any;
  export const getAlerts: any;
  export const updateAlert: any;
  export const getDashboardSummary: any;
  export const triggerDailyJob: any;
}

declare module '*dataIntegrityController.js' {
  export const analyzeIntegrityEndpoint: any;
  export const getIntegrityBenchmark: any;
  export const runBenchmarkEvaluation: any;
  export const getIntegrityConfig: any;
}

declare module '*seed.js' {
  export const seedDatabase: any;
}
