import React, { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ChecklistStepProps {
  step: number;
  formData: any;
  setFormData: (data: any) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

interface ExitAccess {
  type: string;
  dimensions: string;
  status: string;
  remarks: string;
}

interface Exit {
  type: string;
  dimensions: string;
  status: string;
  remarks: string;
}

interface Defect {
  item: string;
  image: File | null;
  remarks: string;
}

export function SmallBusinessChecklistStep({ step, formData, setFormData, fileInputRef, handleImageUpload }: ChecklistStepProps) {
  const [exitAccesses, setExitAccesses] = useState<ExitAccess[]>(formData.exitAccesses || [{ type: '', dimensions: '', status: '', remarks: '' }]);
  const [exits, setExits] = useState<Exit[]>(formData.exits || [{ type: '', dimensions: '', status: '', remarks: '' }]);
  const [defects, setDefects] = useState<Defect[]>(formData.defects || [{ item: '', image: null, remarks: '' }]);

  const handleExitAccessChange = (index: number, field: keyof ExitAccess, value: string) => {
    const updatedExitAccesses = [...exitAccesses];
    updatedExitAccesses[index][field] = value;
    setExitAccesses(updatedExitAccesses);
    setFormData({ ...formData, exitAccesses: updatedExitAccesses });
  };

  const addExitAccess = () => {
    const newExitAccesses = [...exitAccesses, { type: '', dimensions: '', status: '', remarks: '' }];
    setExitAccesses(newExitAccesses);
    setFormData({ ...formData, exitAccesses: newExitAccesses });
  };

  const handleExitChange = (index: number, field: keyof Exit, value: string) => {
    const updatedExits = [...exits];
    updatedExits[index][field] = value;
    setExits(updatedExits);
    setFormData({ ...formData, exits: updatedExits });
  };

  const addExit = () => {
    const newExits = [...exits, { type: '', dimensions: '', status: '', remarks: '' }];
    setExits(newExits);
    setFormData({ ...formData, exits: newExits });
  };

  const handleDefectChange = (index: number, field: keyof Defect, value: string | File | null) => {
    const updatedDefects = [...defects];
    if (field === "image") {
      updatedDefects[index][field] = value as File | null;
    } else {
      updatedDefects[index][field] = value as string;
    }
    setDefects(updatedDefects);
    setFormData({ ...formData, defects: updatedDefects });
  };

  const addDefect = () => {
    const newDefects = [...defects, { item: '', image: null, remarks: '' }];
    setDefects(newDefects);
    setFormData({ ...formData, defects: newDefects });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 col-span-1 sm:col-span-2">
            <h3 className="text-lg font-semibold">I. REFERENCE</h3>
            <div className="grid grid-cols-4 gap-4">
                <Label htmlFor="inspectionOrderNo" className="text-sm sm:text-base">Inspection Order No.</Label>
                <Input
                  id="inspectionOrderNo"
                  value={formData.inspectionOrderNo || ''}
                  onChange={(e) => setFormData({ ...formData, inspectionOrderNo: e.target.value })}
                  placeholder="Enter"
                  className="text-sm w-full"
                />
                <Label htmlFor="dateInspected" className="text-sm sm:text-base">Date Inspected</Label>
                <Input
                  id="dateInspected"
                  type="date"
                  value={formData.dateInspected || ''}
                  onChange={(e) => setFormData({ ...formData, dateInspected: e.target.value })}
                  placeholder="YYYY-MM-DD"
                  className="text-sm w-full"
                />
                <Label htmlFor="dateIssued" className="text-sm sm:text-base">Date Issued</Label>
                <Input
                  id="dateIssued"
                  type="date"
                  value={formData.dateIssued || ''}
                  onChange={(e) => setFormData({ ...formData, dateIssued: e.target.value })}
                  placeholder="YYYY-MM-DD"
                  className="text-sm w-full"
                />
                <Label htmlFor="attendingInspector" className="text-sm sm:text-base">Attending Inspector</Label>
                <Input
                  id="attendingInspector"
                  value={formData.attendingInspector || ''}
                  onChange={(e) => setFormData({ ...formData, attendingInspector: e.target.value })}
                  placeholder="Enter"
                  className="text-sm w-full"
                />
            </div>
            <h3 className="text-lg font-semibold mt-6">II. Nature of Inspection</h3>
            <div className="space-y-2">
              {[
                { id: 'fsicOccupancy', label: 'FSIC for Certificate for Occupancy' },
                { id: 'fsicBusinessNew', label: 'FSIC for Business Permit (New)' },
                { id: 'fsicBusinessRenewal', label: 'FSIC for Business Permit (Renewal)' },
                { id: 'fsicAnnualInspection', label: 'FSIC for Certificate of Annual Inspection' },
              ].map(item => (
                <div key={item.id} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={item.id}
                    name="inspectionType"
                    checked={formData.inspectionType === item.id}
                    onChange={() => setFormData({ ...formData, inspectionType: item.id, othersSpecify: '' })}
                    className="text-sm"
                    disabled={formData.othersSpecify !== ''}
                  />
                  <Label htmlFor={item.id} className="text-sm sm:text-base">{item.label}</Label>
                </div>
              ))}
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Verification Inspection for Compliance</Label>
                {[
                  { id: 'noticeToCorrect', label: 'Notice to Correct' },
                  { id: 'noticeToCorrectViolation', label: 'Notice to Correct Violation' },
                  { id: 'abatement', label: 'Abatement' },
                  { id: 'closure', label: 'Closure' },
                ].map(item => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={item.id}
                      name="inspectionType"
                      checked={formData.inspectionType === item.id}
                      onChange={() => setFormData({ ...formData, inspectionType: item.id, othersSpecify: '' })}
                      className="text-sm"
                      disabled={formData.othersSpecify !== ''}
                    />
                    <Label htmlFor={item.id} className="text-sm sm:text-base">{item.label}</Label>
                  </div>
                ))}
              </div>
              <div>
                <Label htmlFor="othersSpecify" className="text-sm sm:text-base">Others (Specify)</Label>
                <Input
                  id="othersSpecify"
                  value={formData.othersSpecify || ''}
                  onChange={(e) => setFormData({ ...formData, othersSpecify: e.target.value, inspectionType: '' })}
                  placeholder="Specify other inspection type"
                  className="text-sm w-full"
                />
              </div>
            </div>
            <h3 className="text-lg font-semibold">III. General Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                {[
                  { id: 'buildingName', label: 'Building Name', placeholder: 'Enter building name' },
                  { id: 'businessName', label: 'Business Name', placeholder: 'Enter business name' },
                  { id: 'natureOfBusiness', label: 'Nature of Business', placeholder: 'Enter nature of business' },
                  { id: 'unitNo', label: 'Unit No.', placeholder: 'Enter unit number' },
                  { id: 'blockNo', label: 'Block No.', placeholder: 'Enter block number' },
                  { id: 'buildingNameAddress', label: 'Building Name (Address)', placeholder: 'Enter building name' },
                  { id: 'streetName', label: 'Street Name', placeholder: 'Enter street name' },
                  { id: 'region', label: 'Region', placeholder: 'Enter region' },
                ].map(item => (
                  <div key={item.id}>
                    <Label htmlFor={item.id} className="text-sm sm:text-base">{item.label}</Label>
                    <Input
                      id={item.id}
                      value={formData[item.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [item.id]: e.target.value })}
                      placeholder={item.placeholder}
                      className="text-sm w-full"
                    />
                  </div>
                ))}
                {[
                  { id: 'province', label: 'Province', placeholder: 'Enter province' },
                  { id: 'city', label: 'City', placeholder: 'Enter city' },
                  { id: 'barangay', label: 'Barangay', placeholder: 'Enter barangay' },
                  { id: 'ownerName', label: 'Owner/Representative Name', placeholder: 'Enter name' },
                  { id: 'contactNumber', label: 'Contact Number', placeholder: 'Enter contact number' },
                  { id: 'fsecNo', label: 'FSEC No.', placeholder: 'Enter FSEC number' },
                  { id: 'fsecDate', label: 'FSEC Date Issued', placeholder: 'YYYY-MM-DD', type: 'date' },
                  { id: 'fsicNo', label: 'FSIC No. (Latest)', placeholder: 'Enter FSIC number' },
                  { id: 'fsicDate', label: 'FSIC Date Issued', placeholder: 'YYYY-MM-DD', type: 'date' },
                  { id: 'buildingPermitNo', label: 'Building/Renovation Permit No.', placeholder: 'Enter permit number' },
                  { id: 'buildingPermitDate', label: 'Building Permit Date Issued', placeholder: 'YYYY-MM-DD', type: 'date' },
                  { id: 'businessPermitNo', label: 'Business Permit No.', placeholder: 'Enter permit number' },
                  { id: 'businessPermitDate', label: 'Business Permit Date Issued', placeholder: 'YYYY-MM-DD', type: 'date' },
                  { id: 'fireInsurancePolicyNo', label: 'Fire Insurance Policy No.', placeholder: 'Enter policy number (if any)' },
                  { id: 'fireInsurancePolicyDate', label: 'Fire Insurance Policy Date Issued', placeholder: 'YYYY-MM-DD', type: 'date' },
                ].map(item => (
                  <div key={item.id}>
                    <Label htmlFor={item.id} className="text-sm sm:text-base">{item.label}</Label>
                    <Input
                      id={item.id}
                      type={item.type || 'text'}
                      value={formData[item.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [item.id]: e.target.value })}
                      placeholder={item.placeholder}
                      className="text-sm w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
            <h3 className="text-lg font-semibold">IV. Other Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <div>
                  <Label className="text-sm sm:text-base">Type of Occupancy</Label>
                  <Select
                    value={formData.occupancyType || ''}
                    onValueChange={(value) => setFormData({ ...formData, occupancyType: value })}
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select occupancy type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mercantile">Mercantile</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.occupancyType === 'Others' && (
                    <div className="mt-2">
                      <Label htmlFor="occupancyOthers" className="text-sm sm:text-base">Specify Other Occupancy</Label>
                      <Input
                        id="occupancyOthers"
                        value={formData.occupancyOthers || ''}
                        onChange={(e) => setFormData({ ...formData, occupancyOthers: e.target.value })}
                        placeholder="Specify other occupancy"
                        className="text-sm w-full"
                      />
                    </div>
                  )}
                </div>
                {[
                  { id: 'totalFloorArea', label: 'Total Floor Area (m²)', placeholder: 'Enter total floor area' },
                  { id: 'occupantLoad', label: 'Occupant Load (Persons)', placeholder: 'Enter occupant load' },
                ].map(item => (
                  <div key={item.id}>
                    <Label htmlFor={item.id} className="text-sm sm:text-base">{item.label}</Label>
                    <Input
                      id={item.id}
                      value={formData[item.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [item.id]: e.target.value })}
                      placeholder={item.placeholder}
                      className="text-sm w-full"
                    />
                  </div>
                ))}
                <div>
                  <Label className="text-sm sm:text-base">Construction Type</Label>
                  <Select
                    value={formData.constructionType || ''}
                    onValueChange={(value) => setFormData({ ...formData, constructionType: value })}
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select construction type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Timber Framed and Walls">Timber Framed and Walls</SelectItem>
                      <SelectItem value="Steel Framed and Walls">Steel Framed and Walls</SelectItem>
                      <SelectItem value="Reinforced Concrete Framed with Masonry Walls">Reinforced Concrete Framed with Masonry Walls</SelectItem>
                      <SelectItem value="Mixed Construction">Mixed Construction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {[
                  { id: 'buildingHeight', label: 'Building Height (m)', placeholder: 'Enter building height' },
                  { id: 'noOfStories', label: 'No. of Stories', placeholder: 'Enter number of stories' },
                  { id: 'portionOccupied', label: 'Portion Occupied', placeholder: 'Enter portion occupied' },
                ].map(item => (
                  <div key={item.id}>
                    <Label htmlFor={item.id} className="text-sm sm:text-base">{item.label}</Label>
                    <Input
                      id={item.id}
                      value={formData[item.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [item.id]: e.target.value })}
                      placeholder={item.placeholder}
                      className="text-sm w-full"
                    />
                  </div>
                ))}
                {[
                  { id: 'hasMezzanine', label: 'With Mezzanine' },
                  { id: 'hasHandrails', label: 'Handrails/Railings Provided' },
                ].map(item => (
                  <div key={item.id}>
                    <Label htmlFor={item.id} className="text-sm sm:text-base">{item.label}</Label>
                    <Select
                      value={formData[item.id] || ''}
                      onValueChange={(value) => setFormData({ ...formData, [item.id]: value })}
                    >
                      <SelectTrigger className="text-sm w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 col-span-1 sm:col-span-2">
            <h3 className="text-lg font-semibold">V. Means of Egress</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-semibold">A. Exit Access</h4>
                {exitAccesses.map((exitAccess, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label htmlFor={`exitAccessType-${index}`} className="text-sm sm:text-base">Type of Exit</Label>
                      <Select
                        value={exitAccess.type}
                        onValueChange={(value) => handleExitAccessChange(index, 'type', value)}
                      >
                        <SelectTrigger className="text-sm w-full">
                          <SelectValue placeholder="Select exit type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Doors">Doors</SelectItem>
                          <SelectItem value="Corridors">Corridors</SelectItem>
                          <SelectItem value="Hallways">Hallways</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`exitAccessDimensions-${index}`} className="text-sm sm:text-base">Actual Dimensions (m)</Label>
                      <Input
                        id={`exitAccessDimensions-${index}`}
                        value={exitAccess.dimensions}
                        onChange={(e) => handleExitAccessChange(index, 'dimensions', e.target.value)}
                        placeholder="Enter dimensions"
                        className="text-sm w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm sm:text-base">Status</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`exitAccessPassed-${index}`}
                          name={`exitAccessStatus-${index}`}
                          checked={exitAccess.status === 'Passed'}
                          onChange={() => handleExitAccessChange(index, 'status', 'Passed')}
                        />
                        <Label htmlFor={`exitAccessPassed-${index}`} className="text-sm sm:text-base">Passed</Label>
                        <input
                          type="radio"
                          id={`exitAccessFailed-${index}`}
                          name={`exitAccessStatus-${index}`}
                          checked={exitAccess.status === 'Failed'}
                          onChange={() => handleExitAccessChange(index, 'status', 'Failed')}
                        />
                        <Label htmlFor={`exitAccessFailed-${index}`} className="text-sm sm:text-base">Failed</Label>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <Label htmlFor={`exitAccessRemarks-${index}`} className="text-sm sm:text-base mt-2">Remarks / Corrective Action</Label>
                      <Textarea
                        id={`exitAccessRemarks-${index}`}
                        value={exitAccess.remarks}
                        onChange={(e) => handleExitAccessChange(index, 'remarks', e.target.value)}
                        placeholder="Enter remarks or corrective actions"
                        className="text-sm w-full"
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-center">
                  <Button onClick={addExitAccess} className="mt-2">Add Another Exit Access</Button>
                </div>
              </div>
              <div>
                <h4 className="text-base font-semibold">Exits</h4>
                {exits.map((exit, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label htmlFor={`exitType-${index}`} className="text-sm sm:text-base">Type of Exit</Label>
                      <Select
                        value={exit.type}
                        onValueChange={(value) => handleExitChange(index, 'type', value)}
                      >
                        <SelectTrigger className="text-sm w-full">
                          <SelectValue placeholder="Select exit type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Exit Doors">Exit Doors</SelectItem>
                          <SelectItem value="Horizontal Exits">Horizontal Exits</SelectItem>
                          <SelectItem value="Stairs">Stairs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`exitDimensions-${index}`} className="text-sm sm:text-base">Actual Dimensions (m)</Label>
                      <Input
                        id={`exitDimensions-${index}`}
                        value={exit.dimensions}
                        onChange={(e) => handleExitChange(index, 'dimensions', e.target.value)}
                        placeholder="Enter dimensions"
                        className="text-sm w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm sm:text-base">Status</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`exitPassed-${index}`}
                          name={`exitStatus-${index}`}
                          checked={exit.status === 'Passed'}
                          onChange={() => handleExitChange(index, 'status', 'Passed')}
                        />
                        <Label htmlFor={`exitPassed-${index}`} className="text-sm sm:text-base">Passed</Label>
                        <input
                          type="radio"
                          id={`exitFailed-${index}`}
                          name={`exitStatus-${index}`}
                          checked={exit.status === 'Failed'}
                          onChange={() => handleExitChange(index, 'status', 'Failed')}
                        />
                        <Label htmlFor={`exitFailed-${index}`} className="text-sm sm:text-base">Failed</Label>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <Label htmlFor={`exitRemarks-${index}`} className="text-sm sm:text-base mt-2">Remarks / Corrective Action</Label>
                      <Textarea
                        id={`exitRemarks-${index}`}
                        value={exit.remarks}
                        onChange={(e) => handleExitChange(index, 'remarks', e.target.value)}
                        placeholder="Enter remarks or corrective actions"
                        className="text-sm w-full"
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-center">
                  <Button onClick={addExit} className="mt-2">Add Another Exit</Button>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold">VI. Signs, Lighting, and Exit Signage</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                {[
                  { id: 'letterHeightStroke', label: 'Minimum Letter Height: 150 mm; Width of Stroke: 19 mm' },
                  { id: 'exitSignsIlluminated', label: 'EXIT signs are properly illuminated' },
                  { id: 'exitSignsPosted', label: 'EXIT signs are posted along Exit access, Exits, and Exit discharge' },
                ].map(item => (
                  <div key={item.id}>
                    <Label htmlFor={item.id} className="text-sm sm:text-base">{item.label}</Label>
                    <Select
                      value={formData[item.id] || ''}
                      onValueChange={(value) => setFormData({ ...formData, [item.id]: value })}
                    >
                      <SelectTrigger className="text-sm w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pass">Pass</SelectItem>
                        <SelectItem value="Fail">Fail</SelectItem>
                        <SelectItem value="N/A">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
            <h3 className="text-lg font-semibold">VII. Hazards</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                {[
                  { id: 'hazardContents', label: 'Hazard Contents', placeholder: 'Enter hazard contents' },
                  { id: 'hazardLocation', label: 'Location', placeholder: 'Enter hazard location' },
                  { id: 'hazardTotalVolume', label: 'Total Volume', placeholder: 'Enter total volume' },
                  { id: 'hazardControlNumber', label: 'Control Number', placeholder: 'Enter control number' },
                  { id: 'hazardDateIssued', label: 'Date Issued', placeholder: 'YYYY-MM-DD', type: 'date' },
                ].map(item => (
                  <div key={item.id}>
                    <Label htmlFor={item.id} className="text-sm sm:text-base">{item.label}</Label>
                    <Input
                      id={item.id}
                      type={item.type || 'text'}
                      value={formData[item.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [item.id]: e.target.value })}
                      placeholder={item.placeholder}
                      className="text-sm w-full"
                    />
                  </div>
                ))}
                <div>
                  <Label htmlFor="hazardClassification" className="text-sm sm:text-base">Hazard Classification</Label>
                  <Select
                    value={formData.hazardClassification || ''}
                    onValueChange={(value) => setFormData({ ...formData, hazardClassification: value })}
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select classification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Ordinary">Ordinary</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="hazardStorageClearance" className="text-sm sm:text-base">Storage Clearance Required</Label>
                  <Select
                    value={formData.hazardStorageClearance || ''}
                    onValueChange={(value) => setFormData({ ...formData, hazardStorageClearance: value })}
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fireSafetyClearance" className="text-sm sm:text-base">Fire Safety Clearance for Storage</Label>
                  <Select
                    value={formData.fireSafetyClearance || ''}
                    onValueChange={(value) => setFormData({ ...formData, fireSafetyClearance: value })}
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-semibold">A. Other Flammable Liquids</h4>
                {[
                  { id: 'flammableLiquidsClearance', label: 'Clearance of Stocks from the Ceiling' },
                  { id: 'gasDetectorShutOff', label: 'Gas Detector and Shut Off Device for LPG' },
                ].map(item => (
                  <div key={item.id}>
                    <Label htmlFor={item.id} className="text-sm sm:text-base">{item.label}</Label>
                    <Select
                      value={formData[item.id] || ''}
                      onValueChange={(value) => setFormData({ ...formData, [item.id]: value })}
                    >
                      <SelectTrigger className="text-sm w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pass">Pass</SelectItem>
                        <SelectItem value="Fail">Fail</SelectItem>
                        <SelectItem value="N/A">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                {[
                  { id: 'lpgSystemApprovedPlans', label: 'LPG System Provided with Approved Plans (if ≥ 300 kgs./300 GWC)' },
                  { id: 'storedInSealedContainers', label: 'Stored in Sealed Metal Containers' },
                  { id: 'noSmokingSign', label: 'Provided with “NO SMOKING” Sign' },
                  { id: 'installationClearance', label: 'Installation Clearance' },
                ].map(item => (
                  <div key={item.id}>
                    <Label htmlFor={item.id} className="text-sm sm:text-base">{item.label}</Label>
                    <Select
                      value={formData[item.id] || ''}
                      onValueChange={(value) => setFormData({ ...formData, [item.id]: value })}
                    >
                      <SelectTrigger className="text-sm w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                {[
                  { id: 'lpgSystemDate', label: 'Date Issued', placeholder: 'YYYY-MM-DD', type: 'date' },
                  { id: 'lpgSystemControlNumber', label: 'Control Number', placeholder: 'Enter control number' },
                ].map(item => (
                  <div key={item.id}>
                    <Label htmlFor={item.id} className="text-sm sm:text-base">{item.label}</Label>
                    <Input
                      id={item.id}
                      type={item.type || 'text'}
                      value={formData[item.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [item.id]: e.target.value })}
                      placeholder={item.placeholder}
                      className="text-sm w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 col-span-2 sm:col-span-2">
            <h3 className="text-lg font-semibold">VIII. Fire Protection</h3>
            <div className="space-y-2">
              <h4 className="text-base font-semibold">A. First Aid Fire Protection (Fire Extinguishers)</h4>
              {[
                { id: 'fireExtinguisherSize', label: 'Fire Extinguisher Size Compliant (per Table 7 & 8 of RIRR of RA 9514)' },
                { id: 'fireExtinguisherNumber', label: 'Minimum Number of Extinguishers Sufficient' },
                { id: 'fireExtinguisherLocation', label: 'Extinguishers in Proper Location' },
                { id: 'fireExtinguisherSealsTags', label: 'Seals & Tags Intact, Serviced in Last 12 Months' },
                { id: 'fireExtinguisherMarkings', label: 'Proper Markings for Fire Type' },
                { id: 'fireExtinguisherCondition', label: 'No Leaks, Corrosion, or Defects' },
                { id: 'fireExtinguisherPressure', label: 'Pressure Gauge in Green Area' },
              ].map(item => (
                <div key={item.id}>
                  <Label htmlFor={item.id} className="text-sm sm:text-base">{item.label}</Label>
                  <Select
                    value={formData[item.id] || ''}
                    onValueChange={(value) => setFormData({ ...formData, [item.id]: value })}
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pass">Pass</SelectItem>
                      <SelectItem value="Fail">Fail</SelectItem>
                      <SelectItem value="N/A">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-semibold">B. Emergency Lighting Systems</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="emergencyLightingProvided" className="text-sm sm:text-base">Provided</Label>
                  <Select
                    value={formData.emergencyLightingProvided || ''}
                    onValueChange={(value) => setFormData({ ...formData, emergencyLightingProvided: value })}
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="emergencyLightingLocation" className="text-sm sm:text-base">Location</Label>
                  <Select
                    value={formData.emergencyLightingLocation || ''}
                    onValueChange={(value) => setFormData({ ...formData, emergencyLightingLocation: value })}
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hallways">Hallways</SelectItem>
                      <SelectItem value="Exit Doors">Exit Doors</SelectItem>
                      <SelectItem value="Stairway Landings">Stairway Landings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="emergencyLightingFunctional" className="text-sm sm:text-base">Functional</Label>
                  <Select
                    value={formData.emergencyLightingFunctional || ''}
                    onValueChange={(value) => setFormData({ ...formData, emergencyLightingFunctional: value })}
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-semibold">C. Fire Detection and Alarm</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'fireAlarmProvided', label: 'Provided' },
                  { id: 'fireAlarmFunctional', label: 'Functional' },
                  { id: 'fireAlarmIntegrated', label: 'Integrated' },
                  { id: 'fireAlarmAdequate', label: 'Adequate' },
                ].map(item => (
                  <div key={item.id}>
                    <Label htmlFor={item.id} className="text-sm sm:text-base">{item.label}</Label>
                    <Select
                      value={formData[item.id] || ''}
                      onValueChange={(value) => setFormData({ ...formData, [item.id]: value })}
                    >
                      <SelectTrigger className="text-sm w-full">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <div>
                  <Label htmlFor="fireAlarmType" className="text-sm sm:text-base">Type of Alarm</Label>
                  <Select
                    value={formData.fireAlarmType || ''}
                    onValueChange={(value) => setFormData({ ...formData, fireAlarmType: value })}
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Smoke">Smoke</SelectItem>
                      <SelectItem value="Heat">Heat</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.fireAlarmType === 'Others' && (
                    <Input
                      className="mt-2"
                      placeholder="Specify other alarm type"
                      value={formData.fireAlarmTypeOther || ''}
                      onChange={(e) => setFormData({ ...formData, fireAlarmTypeOther: e.target.value })}
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="fireAlarmUnitsPerFloor" className="text-sm sm:text-base">Units per Floor</Label>
                  <Input
                    type="number"
                    value={formData.fireAlarmUnitsPerFloor || ''}
                    onChange={(e) => setFormData({ ...formData, fireAlarmUnitsPerFloor: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="fireAlarmControlPanel" className="text-sm sm:text-base">Location of Control Panel (if applicable)</Label>
                  <Input
                    value={formData.fireAlarmControlPanel || ''}
                    onChange={(e) => setFormData({ ...formData, fireAlarmControlPanel: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">IX. Defects/Deficiencies</h3>
              {defects.map((defect, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 items-end">
                  <div>
                    <Label htmlFor={`defectItem-${index}`} className="text-sm sm:text-base">Item</Label>
                    <Input
                      id={`defectItem-${index}`}
                      value={defect.item}
                      onChange={(e) => handleDefectChange(index, 'item', e.target.value)}
                      placeholder="Enter defect item"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`defectImage-${index}`} className="text-sm sm:text-base">Upload Image</Label>
                    <Input
                      id={`defectImage-${index}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleDefectChange(index, 'image', file);
                      }}
                    />
                  </div>
                  <div>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        const newDefects = defects.filter((_, i) => i !== index);
                        setDefects(newDefects);
                        setFormData({ ...formData, defects: newDefects });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button onClick={addDefect}>Add Item</Button>
              <div>
                <Label htmlFor="defectsRemarks" className="text-sm sm:text-base">Remarks</Label>
                <Textarea
                  id="defectsRemarks"
                  value={formData.defectsRemarks || ''}
                  onChange={(e) => setFormData({ ...formData, defectsRemarks: e.target.value })}
                  placeholder="Enter remarks"
                />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 col-span-1 sm:col-span-2">
            <div className="space-y-6">
              <h4 className="text-base font-semibold">X. Recommendations</h4>
              {[
                { id: 'complyDefects', label: 'Comply the following DEFFECTS/DEFICIENCIES stated above.' },
                { id: 'payFireCodeFees', label: 'Pay the corresponding Fire Code Fees including the fees for Fire Safety Clearances' },
              ].map(item => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={item.id}
                    checked={formData[item.id] || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, [item.id]: checked })}
                  />
                  <Label htmlFor={item.id} className="text-sm sm:text-base">{item.label}</Label>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="secureFireSafetyClearances"
                  checked={formData.secureFireSafetyClearances || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, secureFireSafetyClearances: checked })}
                />
                <div className="flex-1">
                  <Label htmlFor="fireSafetyClearances" className="text-sm sm:text-base">Secure the following Fire Safety Clearances</Label>
                  {formData.secureFireSafetyClearances && (
                    <Input
                      id="fireSafetyClearances"
                      value={formData.fireSafetyClearances || ''}
                      onChange={(e) => setFormData({ ...formData, fireSafetyClearances: e.target.value })}
                      placeholder="Enter clearances needed"
                      className="text-sm w-full mt-1"
                    />
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="issuanceType" className="text-sm sm:text-base">For Issuance of</Label>
                <Select
                  value={formData.issuanceType || ''}
                  onValueChange={(value) => setFormData({ ...formData, issuanceType: value })}
                >
                  <SelectTrigger className="text-sm w-full">
                    <SelectValue placeholder="Choose one" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FSIC">Fire Safety Inspection Certificate (FSIC)</SelectItem>
                    <SelectItem value="Notice to Comply">Comply</SelectItem>
                    <SelectItem value="Notice to Correct Violation">Correct Violation</SelectItem>
                    <SelectItem value="Abatement Order">Abatement Order with Administrative Fine</SelectItem>
                    <SelectItem value="Closure Order">Closure Order</SelectItem>
                    <SelectItem value="Closure Order for Non-payment">Closure Order for Non-payment of Administrative Fine</SelectItem>
                    <SelectItem value="Notice of Disapproval">Notice of Disapproval (NOD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="acknowledgedBy" className="text-sm sm:text-base">Acknowledged By</Label>
                  <Input
                    id="acknowledgedBy"
                    value={formData.acknowledgedBy || ''}
                    onChange={(e) => setFormData({ ...formData, acknowledgedBy: e.target.value })}
                    placeholder="Enter name"
                    className="text-sm w-full"
                  />
                  <Label htmlFor="acknowledgedDateTime" className="text-sm sm:text-base mt-2">Date and Time</Label>
                  <Input
                    id="acknowledgedDateTime"
                    type="datetime-local"
                    value={formData.acknowledgedDateTime || ''}
                    onChange={(e) => setFormData({ ...formData, acknowledgedDateTime: e.target.value })}
                    className="text-sm w-full"
                  />
                  <Label htmlFor="fireSafetyInspector" className="text-sm sm:text-base mt-2">Fire Safety Inspector/s</Label>
                  <Input
                    id="fireSafetyInspector"
                    value={formData.fireSafetyInspector || ''}
                    onChange={(e) => setFormData({ ...formData, fireSafetyInspector: e.target.value })}
                    placeholder="Enter inspector name"
                    className="text-sm w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="fireMarshall" className="text-sm sm:text-base">Approval: Fire Marshall</Label>
                  <Input
                    id="fireMarshall"
                    value={formData.fireMarshall || ''}
                    onChange={(e) => setFormData({ ...formData, fireMarshall: e.target.value })}
                    placeholder="Enter fire marshall name"
                    className="text-sm w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <div className="text-sm sm:text-base">Invalid Step</div>;
    }
  };

  return <div className="w-full">{renderStep()}</div>;
}