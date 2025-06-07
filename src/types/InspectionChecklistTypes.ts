export interface FormData {
  inspectionOrderNo: string;
  dateIssued: string;
  dateInspected: string;
  inspectionType: {
    fsicOccupancy: boolean;
    fsicBusinessPermit: boolean;
    fsicAnnualInspection: boolean;
    verificationInspection: boolean;
    others: string;
  };
  requirements: {
    fsccr: string | null;
    fsmr: string | null;
  };
  generalInfo: {
    buildingName: string;
    address: string;
    businessName: string;
    natureOfBusiness: string;
    ownerName: string;
    contactNo: string;
    fsecNo: string;
    fsecDateIssued: string;
    buildingPermit: string;
    buildingPermitDateIssued: string;
    fsicNo: string;
    fsicDateIssued: string;
    fireDrillCertificate: string;
    fireDrillDateIssued: string;
    businessPermitNo: string;
    businessPermitDateIssued: string;
    fireInsurancePolicyNo: string;
    fireInsuranceDateIssued: string;
  };
  constructionType: string;
  wallsCeilingFinish: string;
  floorFinish: string;
  fireExtinguisher: boolean;
  safetyEquipment: boolean;
  emergencyLights: boolean;
  evacuationPlan: boolean;
  sprinklerSystem: boolean;
  smokeDetectors: boolean;
  fireAlarm: boolean;
  emergencyExits: boolean;
  inspectorName: string;
  images: File[];
  sectionalOccupancy?: {
    basement?: string;
    groundFloor?: string;
    secondFloor?: string;
    thirdFloor?: string;
    fourthFloor?: string;
    nthFloor?: string;
  };
  generalOccupancy?: {
    assembly?: boolean;
    educational?: boolean;
    dayCare?: boolean;
    healthCare?: boolean;
    detentionAndCorrectional?: boolean;
    residentialBoardAndCare?: boolean;
    mercantile?: boolean;
    business?: boolean;
    industrial?: boolean;
    storage?: boolean;
    residential?: boolean;
    residentialSub?: string;
    specialStructure?: boolean;
    specialStructureSub?: string;
  };
  otherInfo?: {
    maxOccupantLoad?: string;
    numberOfStories?: string;
    buildingHeight?: string;
    highRise?: string;
  };
  meansOfEgress?: {
    exitAccess?: {
      [key: string]: {
        dimension?: string;
        passed?: boolean;
        failed?: boolean;
        remarks?: string;
      };
    };
    [key: string]: any;
  };
  exits?: {
    components: {
      [key: string]: {
        dimension?: string;
        passed?: boolean;
        failed?: boolean;
        remarks?: string;
      };
    };
    compliance: {
      [key: string]: {
        dimension?: string;
        passed?: boolean;
        failed?: boolean;
        remarks?: string;
      };
    };
  };
  exitsDischarge?: {
    [key: string]: {
      dimension?: string;
      passed?: boolean;
      failed?: boolean;
    };
  };
  signsAndLighting?: {
    markingOfEgress?: {
      [key: string]: {
        dimension?: string;
        passed?: boolean;
        failed?: boolean;
        remarks?: string;
      };
    };
    evacuationPlan?: {
      [key: string]: {
        dimension?: string;
        passed?: boolean;
        failed?: boolean;
        remarks?: string;
      };
      basicInfo?: {
        [key: string]: {
          passed?: boolean;
          failed?: boolean;
        };
      };
    };
    illumination?: {
      [key: string]: {
        lux?: string;
        time?: string;
        passed?: boolean;
        failed?: boolean;
        remarks?: string;
      };
    };
  };
  hazards?: {
    contents?: string;
    quantity?: string;
    identification?: {
      placard?: string;
      withinMAQ?: string;
      number?: string;
      classification?: string;
      class?: string;
      flashPoint?: string;
    };
    flammableLiquids?: {
      [key: string]: {
        passed?: boolean;
        failed?: boolean;
        na?: boolean;
        remarks?: string;
      };
    };
    miscellaneous?: {
      [key: string]: {
        passed?: boolean;
        failed?: boolean;
        na?: boolean;
        remarks?: string;
      };
    };
    housekeeping?: {
      [key: string]: {
        passed?: boolean;
        failed?: boolean;
        na?: boolean;
        remarks?: string;
      };
    };
  };
  fireProtection?: {
    sprinklerSystem?: {
      [key: string]: {
        passed?: boolean;
        failed?: boolean;
        na?: boolean;
        remarks?: string;
      };
    };
    standpipe?: {
      [key: string]: {
        passed?: boolean;
        failed?: boolean;
        na?: boolean;
        remarks?: string;
      };
    };
    firePump?: {
      [key: string]: {
        passed?: boolean;
        failed?: boolean;
        na?: boolean;
        remarks?: string;
      };
    };
    fireDetection?: {
      [key: string]: {
        passed?: boolean;
        failed?: boolean;
        na?: boolean;
        remarks?: string;
      };
    };
    fireAlarm?: {
      [key: string]: {
        passed?: boolean;
        failed?: boolean;
        na?: boolean;
        remarks?: string;
      };
    };
    lifts?: {
      [key: string]: {
        passed?: boolean;
        failed?: boolean;
        na?: boolean;
        remarks?: string;
      };
    };
    fireExtinguishers?: {
      [key: string]: {
        passed?: boolean;
        failed?: boolean;
        na?: boolean;
        remarks?: string;
      };
    };
    emergencyLighting?: {
      [key: string]: {
        passed?: boolean;
        failed?: boolean;
        na?: boolean;
        remarks?: string;
      };
    };
    kitchen?: {
      [key: string]: {
        passed?: boolean;
        failed?: boolean;
        na?: boolean;
        remarks?: string;
      };
    };
    buildingService?: {
      [key: string]: {
        passed?: boolean;
        failed?: boolean;
        na?: boolean;
        remarks?: string;
      };
    };
    fireWall?: {
      provided?: string;
      extension?: string;
      wallType?: string;
    };
  };
  defects?: {
    [key: string]: {
      description?: string;
      image?: File | null;
    };
  };
  recommendations?: {
    complyDefects?: boolean;
    fireSafetyClearances?: string[];
    payFireCodeFees?: boolean;
    issuance?: string;
    remarks?: string;
    acknowledgedBy?: string;
    inspector?: string;
    teamLeader?: string;
    dateTime?: string;
    chiefFSES?: string;
    fireMarshal?: string;
  };
}