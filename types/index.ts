export interface MovementAssessment {
  movementName: string;
  impact: string;
  tightnessAreas: string[];
  sensations: string[];
}

export interface FormData {
  name: string;
  email: string;
  phoneNumber: string;
  age: string;
  sexAtBirth: string;
  height: string;
  weight: string;
  primaryDiscomfortArea: string;
  primaryIntensity: number;
  primaryDuration: string;
  primaryBehavior: string;
  hasOtherDiscomfort: string;
  secondaryDiscomfortArea: string;
  secondaryIntensity: number;
  secondaryDuration: string;
  secondaryBehavior: string;
  selectedMovement: string;
  movementImpact: string;
  movementTightnessAreas: string[];
  sensationDescription: string[];
  sensationTravels: string;
  sensationTravelArea: string;
  frontHipTightness: string;
  recordedAssessments: MovementAssessment[];
  activityRanks: Record<string, number>;
  endOfDayFatigueArea: string;
  sleepPosition: string;
  sleepImpact: string;
  morningStiffnessArea: string;
  worseningSituations: string[];
  harderPosition: string;
  improvingSituations: string[];
}

export interface Section {
  id: number;
  title: string;
  fields: string[];
}

