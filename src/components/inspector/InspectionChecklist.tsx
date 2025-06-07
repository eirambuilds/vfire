import React, { useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Inspection } from "@/types/inspection";
import { useChecklistImages } from '@/components/inspector/useChecklistImages';
import { ChecklistStep } from '@/components/inspector/ChecklistStep';

interface InspectionChecklistProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: Inspection;
}

export function InspectionChecklist({ isOpen, onClose, inspection }: InspectionChecklistProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Common Fields
    businessScale: '' as 'large' | 'small' | '',
    inspectionType: '',
    verificationType: '',
    otherInspectionType: '',
    fsccrProvided: 'N/A',
    fsmrProvided: 'N/A',
    inspectorName: 'Sandarah Dizon',
    images: [] as File[],

    // Large Business Fields
    exitAccessDoors: 'N/A',
    exitAccessCorridors: 'N/A',
    exitAccessHallways: 'N/A',
    exitAccessPassageways: 'N/A',
    exitAccessRamps: 'N/A',
    exitAccessDoorWidth: 'N/A',
    exitAccessDoorProjection: 'N/A',
    exitAccessTwoMeans: 'N/A',
    exitAccessGuestDoorFireResistance: 'N/A',
    exitAccessSelfClosingDoors: 'N/A',
    exitAccessNoOtherOpenings: 'N/A',
    exitAccessNoObstructions: 'N/A',
    exitAccessNoFlammableStorage: 'N/A',
    exitAccessRemarks: '',
    exitNormalStairs: 'N/A',
    exitCurvedStairs: 'N/A',
    exitSpiralStairs: 'N/A',
    exitWindingStairs: 'N/A',
    exitHorizontalExits: 'N/A',
    exitOutsideStairs: 'N/A',
    exitPassageways: 'N/A',
    exitFireEscapeStairs: 'N/A',
    exitFireEscapeLadder: 'N/A',
    exitSlideEscape: 'N/A',
    exitTwoMeansPerFloor: 'N/A',
    exitDoors60MinFireResistance: 'N/A',
    exitDoors90MinFireResistance: 'N/A',
    exitDoorsReEntry: 'N/A',
    exitStairThreadDepth: 'N/A',
    exitStairRiserHeight: 'N/A',
    exitStairHeadroom: 'N/A',
    exitDoorsOperation: 'N/A',
    exitDoorsSwing: 'N/A',
    exitDoorsPanicHardware: 'N/A',
    exitNoSpaceUnderStairs: 'N/A',
    exitInteriorFinishClassB: 'N/A',
    exitRemarks: '',
    exitDischargeRemotenessHalf: 'N/A',
    exitDischargeRemotenessThird: 'N/A',
    exitDischargeClearGrounds: 'N/A',
    exitDischargePublicWay: 'N/A',
    exitDischargeRemarks: '',
    exitSignageLetterHeight: 'N/A',
    exitSignageIllumination: 'N/A',
    evacuationPlanPosted: 'N/A',
    evacuationPlanPhotoluminescent: 'N/A',
    evacuationPlanDetails: 'N/A',
    evacuationPlanSizeSmall: 'N/A',
    evacuationPlanSizeMedium: 'N/A',
    evacuationPlanSizeLarge: 'N/A',
    illuminationFloors: 'N/A',
    illuminationAssembly: 'N/A',
    illuminationStairs: 'N/A',
    emergencyLightingIllumination: 'N/A',
    emergencyLightingAuto: 'N/A',
    emergencyLightingTestRecord: 'N/A',
    signageRemarks: '',
    flammableLiquidsStorage: 'N/A',
    flammableLiquidsDispensing: 'N/A',
    noSmokingSigns: 'N/A',
    miscNoSmokingSigns: 'N/A',
    gasolineStorage: 'N/A',
    housekeepingCleaningSupplies: 'N/A',
    housekeepingFlammables: 'N/A',
    housekeepingCombustibles: 'N/A',
    hazardRemarks: '',
    hazardContents: '',
    hazardQuantity: '',
    hazardPlacard: '',
    hazardWithinMAQ: 'N/A',
    hazardIdNo: '',
    hazardClassification: '',
    hazardClass: '',
    hazardFlashPoint: '',
    sprinklerPumps: 'N/A',
    sprinklerValves: 'N/A',
    sprinklerWaterFlowAlarm: 'N/A',
    fireHoseCabinetDoor: 'N/A',
    fireHoseCondition: 'N/A',
    fireHoseNozzle: 'N/A',
    fireHoseHung: 'N/A',
    fireHoseValves: 'N/A',
    firePumpSystem: 'N/A',
    firePumpPiping: 'N/A',
    firePumpMotor: 'N/A',
    firePumpElectrical: 'N/A',
    fireDetectionSystem: 'N/A',
    fireAlarmSigns: 'N/A',
    fireAlarmPanels: 'N/A',
    liftHoming: 'N/A',
    liftFans: 'N/A',
    liftFireman: 'N/A',
    fireExtinguisherSize: 'N/A',
    fireExtinguisherNumber: 'N/A',
    fireExtinguisherLocation: 'N/A',
    fireExtinguisherSeals: 'N/A',
    fireExtinguisherMarkings: 'N/A',
    fireExtinguisherCondition: 'N/A',
    fireExtinguisherPressure: 'N/A',
    emergencyLightingBattery: 'N/A',
    kitchenHoodsVents: 'N/A',
    kitchenHoodFilters: 'N/A',
    cookingEquipmentProtection: 'N/A',
    hvacDesign: 'N/A',
    smokeControlSystems: 'N/A',
    chutesEnclosed: 'N/A',
    fireProtectionRemarks: '',
    defectsMeansOfEgress: '',
    defectsSignage: '',
    defectsHazards: '',
    defectsFireProtection: '',
    generalRemarks: '',

    // Small Business Fields
    buildingName: '',
    businessName: inspection.establishment_name || '',
    natureOfBusiness: '',
    addressUnitNo: '',
    addressBlockNo: '',
    addressBuildingName: '',
    addressStreetName: inspection.address || '',
    region: '',
    province: '',
    city: '',
    barangay: '',
    ownerName: '',
    ownerContactNumber: '',
    fsecNo: '',
    fsecDate: '',
    fsicNo: '',
    fsicDate: '',
    buildingPermitNo: '',
    buildingPermitDate: '',
    businessPermitNo: '',
    businessPermitDate: '',
    fireInsurancePolicyNo: '',
    fireInsurancePolicyDate: '',
    typeOfOccupancy: '',
    otherOccupancyType: '',
    totalFloorArea: '',
    occupantLoad: '',
    constructionType: '',
    buildingHeight: '',
    hasMezzanine: 'No',
    numberOfStories: '',
    portionOccupied: '',
    hasHandrails: 'No',
    exitAccessType: '',
    exitAccessDimensions: '',
    exitType: '',
    exitDimensions: '',
    exitSignagePosted: 'N/A',
    hazardLocation: '',
    hazardStorageClearanceRequired: 'No',
    hazardStorageClearanceDate: '',
    hazardStorageClearanceControlNumber: '',
    hazardTotalVolume: '',
    hazardFireSafetyClearance: 'No',
    flammableLiquidsClearance: 'N/A',
    lpgSystemApprovedPlans: 'No',
    lpgSystemDate: '',
    lpgSystemControlNumber: '',
    flammableLiquidsInstallationClearance: 'No',
    flammableLiquidsStoredInSealedContainers: 'No',
    flammableLiquidsNoSmokingSign: 'No',

    // Common Recommendation Fields
    complyDefects: false,
    fireSafetyClearances: [] as string[],
    payFireCodeFees: false,
    issuanceType: '',
  });

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImagesToSupabase } = useChecklistImages();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...Array.from(files)],
      }));
    }
  };

  const totalSteps = formData.businessScale === 'small' ? 4 : 8;

  const handleSubmit = async () => {
    if (!formData.inspectorName.trim()) {
      toast({
        title: "Error",
        description: "Please provide your digital signature",
        variant: "destructive",
      });
      return;
    }

    if (!formData.businessScale) {
      toast({
        title: "Error",
        description: "Please select the business scale (Large or Small)",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload images to Supabase Storage
      const imagePaths = await uploadImagesToSupabase(inspection.id, formData.images);
      console.log('Uploaded image paths:', imagePaths);

      // Get current user ID
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error:', authError);
        throw new Error('Not authenticated');
      }
      console.log('Authenticated user ID:', user.id);

      // Create checklist data object with snake_case keys to match table schema
      const checklistData = {
        inspection_id: inspection.id,
        establishment_name: inspection.establishment_name,
        establishment_id: inspection.establishment_id,
        inspector_id: user.id,
        business_scale: formData.businessScale,
        inspection_type: formData.inspectionType,
        verification_type: formData.verificationType,
        other_inspection_type: formData.otherInspectionType,
        fsccr_provided: formData.fsccrProvided,
        fsmr_provided: formData.fsmrProvided,
        inspector_name: formData.inspectorName,
        images: imagePaths,
        comply_defects: formData.complyDefects,
        fire_safety_clearances: formData.fireSafetyClearances,
        pay_fire_code_fees: formData.payFireCodeFees,
        issuance_type: formData.issuanceType,

        // Large Business Fields (set to null if businessScale is 'small')
        ...(formData.businessScale === 'large' ? {
          exit_access_doors: formData.exitAccessDoors,
          exit_access_corridors: formData.exitAccessCorridors,
          exit_access_hallways: formData.exitAccessHallways,
          exit_access_passageways: formData.exitAccessPassageways,
          exit_access_ramps: formData.exitAccessRamps,
          exit_access_door_width: formData.exitAccessDoorWidth,
          exit_access_door_projection: formData.exitAccessDoorProjection,
          exit_access_two_means: formData.exitAccessTwoMeans,
          exit_access_guest_door_fire_resistance: formData.exitAccessGuestDoorFireResistance,
          exit_access_self_closing_doors: formData.exitAccessSelfClosingDoors,
          exit_access_no_other_openings: formData.exitAccessNoOtherOpenings,
          exit_access_no_obstructions: formData.exitAccessNoObstructions,
          exit_access_no_flammable_storage: formData.exitAccessNoFlammableStorage,
          exit_access_remarks: formData.exitAccessRemarks,
          exit_normal_stairs: formData.exitNormalStairs,
          exit_curved_stairs: formData.exitCurvedStairs,
          exit_spiral_stairs: formData.exitSpiralStairs,
          exit_winding_stairs: formData.exitWindingStairs,
          exit_horizontal_exits: formData.exitHorizontalExits,
          exit_outside_stairs: formData.exitOutsideStairs,
          exit_passageways: formData.exitPassageways,
          exit_fire_escape_stairs: formData.exitFireEscapeStairs,
          exit_fire_escape_ladder: formData.exitFireEscapeLadder,
          exit_slide_escape: formData.exitSlideEscape,
          exit_two_means_per_floor: formData.exitTwoMeansPerFloor,
          exit_doors_60min_fire_resistance: formData.exitDoors60MinFireResistance,
          exit_doors_90min_fire_resistance: formData.exitDoors90MinFireResistance,
          exit_doors_re_entry: formData.exitDoorsReEntry,
          exit_stair_thread_depth: formData.exitStairThreadDepth,
          exit_stair_riser_height: formData.exitStairRiserHeight,
          exit_stair_headroom: formData.exitStairHeadroom,
          exit_doors_operation: formData.exitDoorsOperation,
          exit_doors_swing: formData.exitDoorsSwing,
          exit_doors_panic_hardware: formData.exitDoorsPanicHardware,
          exit_no_space_under_stairs: formData.exitNoSpaceUnderStairs,
          exit_interior_finish_class_b: formData.exitInteriorFinishClassB,
          exit_remarks: formData.exitRemarks,
          exit_discharge_remoteness_half: formData.exitDischargeRemotenessHalf,
          exit_discharge_remoteness_third: formData.exitDischargeRemotenessThird,
          exit_discharge_clear_grounds: formData.exitDischargeClearGrounds,
          exit_discharge_public_way: formData.exitDischargePublicWay,
          exit_discharge_remarks: formData.exitDischargeRemarks,
          exit_signage_letter_height: formData.exitSignageLetterHeight,
          exit_signage_illumination: formData.exitSignageIllumination,
          evacuation_plan_posted: formData.evacuationPlanPosted,
          evacuation_plan_photoluminescent: formData.evacuationPlanPhotoluminescent,
          evacuation_plan_details: formData.evacuationPlanDetails,
          evacuation_plan_size_small: formData.evacuationPlanSizeSmall,
          evacuation_plan_size_medium: formData.evacuationPlanSizeMedium,
          evacuation_plan_size_large: formData.evacuationPlanSizeLarge,
          illumination_floors: formData.illuminationFloors,
          illumination_assembly: formData.illuminationAssembly,
          illumination_stairs: formData.illuminationStairs,
          emergency_lighting_illumination: formData.emergencyLightingIllumination,
          emergency_lighting_auto: formData.emergencyLightingAuto,
          emergency_lighting_test_record: formData.emergencyLightingTestRecord,
          signage_remarks: formData.signageRemarks,
          flammable_liquids_storage: formData.flammableLiquidsStorage,
          flammable_liquids_dispensing: formData.flammableLiquidsDispensing,
          no_smoking_signs: formData.noSmokingSigns,
          misc_no_smoking_signs: formData.miscNoSmokingSigns,
          gasoline_storage: formData.gasolineStorage,
          housekeeping_cleaning_supplies: formData.housekeepingCleaningSupplies,
          housekeeping_flammables: formData.housekeepingFlammables,
          housekeeping_combustibles: formData.housekeepingCombustibles,
          hazard_remarks: formData.hazardRemarks,
          hazard_contents: formData.hazardContents,
          hazard_quantity: formData.hazardQuantity,
          hazard_placard: formData.hazardPlacard,
          hazard_within_maq: formData.hazardWithinMAQ,
          hazard_id_no: formData.hazardIdNo,
          hazard_classification: formData.hazardClassification,
          hazard_class: formData.hazardClass,
          hazard_flash_point: formData.hazardFlashPoint,
          sprinkler_pumps: formData.sprinklerPumps,
          sprinkler_valves: formData.sprinklerValves,
          sprinkler_water_flow_alarm: formData.sprinklerWaterFlowAlarm,
          fire_hose_cabinet_door: formData.fireHoseCabinetDoor,
          fire_hose_condition: formData.fireHoseCondition,
          fire_hose_nozzle: formData.fireHoseNozzle,
          fire_hose_hung: formData.fireHoseHung,
          fire_hose_valves: formData.fireHoseValves,
          fire_pump_system: formData.firePumpSystem,
          fire_pump_piping: formData.firePumpPiping,
          fire_pump_motor: formData.firePumpMotor,
          fire_pump_electrical: formData.firePumpElectrical,
          fire_detection_system: formData.fireDetectionSystem,
          fire_alarm_signs: formData.fireAlarmSigns,
          fire_alarm_panels: formData.fireAlarmPanels,
          lift_homing: formData.liftHoming,
          lift_fans: formData.liftFans,
          lift_fireman: formData.liftFireman,
          fire_extinguisher_size: formData.fireExtinguisherSize,
          fire_extinguisher_number: formData.fireExtinguisherNumber,
          fire_extinguisher_location: formData.fireExtinguisherLocation,
          fire_extinguisher_seals: formData.fireExtinguisherSeals,
          fire_extinguisher_markings: formData.fireExtinguisherMarkings,
          fire_extinguisher_condition: formData.fireExtinguisherCondition,
          fire_extinguisher_pressure: formData.fireExtinguisherPressure,
          emergency_lighting_battery: formData.emergencyLightingBattery,
          kitchen_hoods_vents: formData.kitchenHoodsVents,
          kitchen_hood_filters: formData.kitchenHoodFilters,
          cooking_equipment_protection: formData.cookingEquipmentProtection,
          hvac_design: formData.hvacDesign,
          smoke_control_systems: formData.smokeControlSystems,
          chutes_enclosed: formData.chutesEnclosed,
          fire_protection_remarks: formData.fireProtectionRemarks,
          defects_means_of_egress: formData.defectsMeansOfEgress,
          defects_signage: formData.defectsSignage,
          defects_hazards: formData.defectsHazards,
          defects_fire_protection: formData.defectsFireProtection,
          general_remarks: formData.generalRemarks,
        } : {
          exit_access_doors: null,
          exit_access_corridors: null,
          exit_access_hallways: null,
          exit_access_passageways: null,
          exit_access_ramps: null,
          exit_access_door_width: null,
          exit_access_door_projection: null,
          exit_access_two_means: null,
          exit_access_guest_door_fire_resistance: null,
          exit_access_self_closing_doors: null,
          exit_access_no_other_openings: null,
          exit_access_no_obstructions: null,
          exit_access_no_flammable_storage: null,
          exit_access_remarks: null,
          exit_normal_stairs: null,
          exit_curved_stairs: null,
          exit_spiral_stairs: null,
          exit_winding_stairs: null,
          exit_horizontal_exits: null,
          exit_outside_stairs: null,
          exit_passageways: null,
          exit_fire_escape_stairs: null,
          exit_fire_escape_ladder: null,
          exit_slide_escape: null,
          exit_two_means_per_floor: null,
          exit_doors_60min_fire_resistance: null,
          exit_doors_90min_fire_resistance: null,
          exit_doors_re_entry: null,
          exit_stair_thread_depth: null,
          exit_stair_riser_height: null,
          exit_stair_headroom: null,
          exit_doors_operation: null,
          exit_doors_swing: null,
          exit_doors_panic_hardware: null,
          exit_no_space_under_stairs: null,
          exit_interior_finish_class_b: null,
          exit_remarks: null,
          exit_discharge_remoteness_half: null,
          exit_discharge_remoteness_third: null,
          exit_discharge_clear_grounds: null,
          exit_discharge_public_way: null,
          exit_discharge_remarks: null,
          exit_signage_letter_height: null,
          exit_signage_illumination: null,
          evacuation_plan_posted: null,
          evacuation_plan_photoluminescent: null,
          evacuation_plan_details: null,
          evacuation_plan_size_small: null,
          evacuation_plan_size_medium: null,
          evacuation_plan_size_large: null,
          illumination_floors: null,
          illumination_assembly: null,
          illumination_stairs: null,
          emergency_lighting_illumination: null,
          emergency_lighting_auto: null,
          emergency_lighting_test_record: null,
          signage_remarks: null,
          flammable_liquids_storage: null,
          flammable_liquids_dispensing: null,
          no_smoking_signs: null,
          misc_no_smoking_signs: null,
          gasoline_storage: null,
          housekeeping_cleaning_supplies: null,
          housekeeping_flammables: null,
          housekeeping_combustibles: null,
          hazard_remarks: null,
          hazard_contents: null,
          hazard_quantity: null,
          hazard_placard: null,
          hazard_within_maq: null,
          hazard_id_no: null,
          hazard_classification: null,
          hazard_class: null,
          hazard_flash_point: null,
          sprinkler_pumps: null,
          sprinkler_valves: null,
          sprinkler_water_flow_alarm: null,
          fire_hose_cabinet_door: null,
          fire_hose_condition: null,
          fire_hose_nozzle: null,
          fire_hose_hung: null,
          fire_hose_valves: null,
          fire_pump_system: null,
          fire_pump_piping: null,
          fire_pump_motor: null,
          fire_pump_electrical: null,
          fire_detection_system: null,
          fire_alarm_signs: null,
          fire_alarm_panels: null,
          lift_homing: null,
          lift_fans: null,
          lift_fireman: null,
          fire_extinguisher_size: null,
          fire_extinguisher_number: null,
          fire_extinguisher_location: null,
          fire_extinguisher_seals: null,
          fire_extinguisher_markings: null,
          fire_extinguisher_condition: null,
          fire_extinguisher_pressure: null,
          emergency_lighting_battery: null,
          kitchen_hoods_vents: null,
          kitchen_hood_filters: null,
          cooking_equipment_protection: null,
          hvac_design: null,
          smoke_control_systems: null,
          chutes_enclosed: null,
          fire_protection_remarks: null,
          defects_means_of_egress: null,
          defects_signage: null,
          defects_hazards: null,
          defects_fire_protection: null,
          general_remarks: null,
        }),

        // Small Business Fields (set to null if businessScale is 'large')
        ...(formData.businessScale === 'small' ? {
          building_name: formData.buildingName,
          business_name: formData.businessName,
          nature_of_business: formData.natureOfBusiness,
          address_unit_no: formData.addressUnitNo,
          address_block_no: formData.addressBlockNo,
          address_building_name: formData.addressBuildingName,
          address_street_name: formData.addressStreetName,
          region: formData.region,
          province: formData.province,
          city: formData.city,
          barangay: formData.barangay,
          owner_name: formData.ownerName,
          owner_contact_number: formData.ownerContactNumber,
          fsec_no: formData.fsecNo,
          fsec_date: formData.fsecDate,
          fsic_no: formData.fsicNo,
          fsic_date: formData.fsicDate,
          building_permit_no: formData.buildingPermitNo,
          building_permit_date: formData.buildingPermitDate,
          business_permit_no: formData.businessPermitNo,
          business_permit_date: formData.businessPermitDate,
          fire_insurance_policy_no: formData.fireInsurancePolicyNo,
          fire_insurance_policy_date: formData.fireInsurancePolicyDate,
          type_of_occupancy: formData.typeOfOccupancy,
          other_occupancy_type: formData.otherOccupancyType,
          total_floor_area: formData.totalFloorArea,
          occupant_load: formData.occupantLoad,
          construction_type: formData.constructionType,
          building_height: formData.buildingHeight,
          has_mezzanine: formData.hasMezzanine,
          number_of_stories: formData.numberOfStories,
          portion_occupied: formData.portionOccupied,
          has_handrails: formData.hasHandrails,
          exit_access_type: formData.exitAccessType,
          exit_access_dimensions: formData.exitAccessDimensions,
          exit_access_remarks: formData.exitAccessRemarks,
          exit_type: formData.exitType,
          exit_dimensions: formData.exitDimensions,
          exit_remarks: formData.exitRemarks,
          exit_signage_letter_height: formData.exitSignageLetterHeight,
          exit_signage_illumination: formData.exitSignageIllumination,
          exit_signage_posted: formData.exitSignagePosted,
          signage_remarks: formData.signageRemarks,
          hazard_contents: formData.hazardContents,
          hazard_location: formData.hazardLocation,
          hazard_storage_clearance_required: formData.hazardStorageClearanceRequired,
          hazard_storage_clearance_date: formData.hazardStorageClearanceDate,
          hazard_storage_clearance_control_number: formData.hazardStorageClearanceControlNumber,
          hazard_total_volume: formData.hazardTotalVolume,
          hazard_classification: formData.hazardClassification,
          hazard_fire_safety_clearance: formData.hazardFireSafetyClearance,
          flammable_liquids_clearance: formData.flammableLiquidsClearance,
          lpg_system_approved_plans: formData.lpgSystemApprovedPlans,
          lpg_system_date: formData.lpgSystemDate,
          lpg_system_control_number: formData.lpgSystemControlNumber,
          flammable_liquids_installation_clearance: formData.flammableLiquidsInstallationClearance,
          flammable_liquids_stored_in_sealed_containers: formData.flammableLiquidsStoredInSealedContainers,
          flammable_liquids_no_smoking_sign: formData.flammableLiquidsNoSmokingSign,
          hazard_remarks: formData.hazardRemarks,
        } : {
          building_name: null,
          business_name: null,
          nature_of_business: null,
          address_unit_no: null,
          address_block_no: null,
          address_building_name: null,
          address_street_name: null,
          region: null,
          province: null,
          city: null,
          barangay: null,
          owner_name: null,
          owner_contact_number: null,
          fsec_no: null,
          fsec_date: null,
          fsic_no: null,
          fsic_date: null,
          building_permit_no: null,
          building_permit_date: null,
          business_permit_no: null,
          business_permit_date: null,
          fire_insurance_policy_no: null,
          fire_insurance_policy_date: null,
          type_of_occupancy: null,
          other_occupancy_type: null,
          total_floor_area: null,
          occupant_load: null,
          construction_type: null,
          building_height: null,
          has_mezzanine: null,
          number_of_stories: null,
          portion_occupied: null,
          has_handrails: null,
          exit_access_type: null,
          exit_access_dimensions: null,
          exit_access_remarks: null,
          exit_type: null,
          exit_dimensions: null,
          exit_remarks: null,
          exit_signage_letter_height: null,
          exit_signage_illumination: null,
          exit_signage_posted: null,
          signage_remarks: null,
          hazard_contents: null,
          hazard_location: null,
          hazard_storage_clearance_required: null,
          hazard_storage_clearance_date: null,
          hazard_storage_clearance_control_number: null,
          hazard_total_volume: null,
          hazard_classification: null,
          hazard_fire_safety_clearance: null,
          flammable_liquids_clearance: null,
          lpg_system_approved_plans: null,
          lpg_system_date: null,
          lpg_system_control_number: null,
          flammable_liquids_installation_clearance: null,
          flammable_liquids_stored_in_sealed_containers: null,
          flammable_liquids_no_smoking_sign: null,
          hazard_remarks: null,
        }),
      };
      console.log('Checklist data to be sent:', checklistData);

      // Insert checklist data into Supabase
      const { error: insertError } = await supabase
        .from('inspection_checklists')
        .insert([checklistData]);

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        throw new Error(`Failed to save checklist data: ${insertError.message}`);
      }

      // Update inspection status to 'inspected'
      const { error: updateError } = await supabase
        .from('inspections')
        .update({ status: 'inspected' })
        .eq('id', inspection.id);

      if (updateError) {
        console.error('Error updating inspection status:', updateError);
        throw new Error(`Failed to update inspection status: ${updateError.message}`);
      }

      toast({
        title: "Inspection Completed",
        description: `The ${formData.businessScale} business inspection has been marked as completed`,
      });
      onClose();
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl w-full max-h-[95vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-lg sm:text-xl">
            INSPECTION FORM :  NEW FIRE SAFETY INSPECTION CHECKLIST (FSIC)
            <DialogTitle className="text-lg sm:text-xl">
            Step {step} of {totalSteps}
            </DialogTitle>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 px-4 py-4 sm:px-6 grid grid-cols-1 sm:grid-cols-1 gap-4 overflow-y-auto">
          <ChecklistStep 
            step={step}
            formData={formData}
            setFormData={setFormData}
            fileInputRef={fileInputRef}
            handleImageUpload={handleImageUpload}
          />
        </div>

        <DialogFooter className="shrink-0 px-4 sm:px-6 pb-4">
          <div className="flex justify-between w-full gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step > 1 ? step - 1 : step)}
              disabled={step === 1}
              className="w-full sm:w-auto"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (step === totalSteps) {
                  handleSubmit();
                } else {
                  if (step === 1 && !formData.businessScale) {
                    toast({
                      title: "Error",
                      description: "Please select the business scale before proceeding",
                      variant: "destructive",
                    });
                    return;
                  }
                  setStep(step + 1);
                }
              }}
              className="w-full sm:w-auto"
            >
              {step === totalSteps ? 'Submit' : 'Next'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}