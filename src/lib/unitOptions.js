export const UNIT_TYPE_OPTIONS = ["Flat", "Shop", "Office", "Garage", "Room", "Other"].map((type) => ({
  value: type,
  label: type,
}));

export const UNIT_STATUS_OPTIONS = [
  { value: "Vacant", label: "Vacant" },
  { value: "Occupied", label: "Occupied" },
];

export const LIVING_LAYOUT_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "Separate", label: "আলাদা ড্রয়িং ও ডাইনিং" },
  { value: "Combined", label: "ড্রয়িং-ডাইনিং একসাথে" },
  { value: "DiningOnly", label: "শুধু ডাইনিং" },
  { value: "None", label: "নেই" },
];

export const PREFERRED_TENANT_OPTIONS = ["Any", "Family", "Bachelor", "Office", "Shop"].map((value) => ({ value, label: value }));

export const floorName = (floor) => {
  if (floor === 0) return "Ground Floor";

  const lastTwo = floor % 100;
  const suffix = lastTwo >= 11 && lastTwo <= 13 ? "th" : { 1: "st", 2: "nd", 3: "rd" }[floor % 10] || "th";
  return `${floor}${suffix} Floor`;
};

export const floorOptions = (totalFloors) =>
  Array.from({ length: totalFloors + 1 }, (_, floor) => ({ value: String(floor), label: floorName(floor) }));
