import { deriveStationStatus, pipelineStages } from "@/lib/station-status";
import type { Charger, Province, Station, StationType } from "@/models/stations";
const cities: [string, string, Province, number, number, string][] = [
  ["Kathmandu", "Kathmandu", "Bagmati", 27.7172, 85.324, "KTM"],
  ["Lalitpur", "Lalitpur", "Bagmati", 27.6644, 85.3188, "LTP"],
  ["Bhaktapur", "Bhaktapur", "Bagmati", 27.671, 85.4298, "BKT"],
  ["Pokhara", "Kaski", "Gandaki", 28.2096, 83.9856, "PKR"],
  ["Biratnagar", "Morang", "Koshi", 26.4525, 87.2718, "BRT"],
  ["Birgunj", "Parsa", "Madhesh", 27.0104, 84.8821, "BRG"],
  ["Bharatpur", "Chitwan", "Bagmati", 27.6833, 84.4333, "BHP"],
  ["Butwal", "Rupandehi", "Lumbini", 27.7006, 83.4483, "BTW"],
  ["Dharan", "Sunsari", "Koshi", 26.8065, 87.2846, "DHR"],
  ["Nepalgunj", "Banke", "Lumbini", 28.05, 81.6167, "NPG"],
  ["Janakpur", "Dhanusha", "Madhesh", 26.7288, 85.9248, "JNK"],
  ["Dhangadhi", "Kailali", "Sudurpashchim", 28.6833, 80.6, "DHG"],
  ["Hetauda", "Makwanpur", "Bagmati", 27.4287, 85.0322, "HTD"],
  ["Itahari", "Sunsari", "Koshi", 26.663, 87.274, "ITH"],
  ["Sauraha", "Chitwan", "Bagmati", 27.58, 84.498, "SRH"],
  ["Jomsom", "Mustang", "Gandaki", 28.783, 83.728, "JOM"],
  ["Charikot", "Dolakha", "Bagmati", 27.668, 86.061, "CHK"],
  ["Surkhet", "Surkhet", "Karnali", 28.6, 81.633, "SKT"],
  ["Damak", "Jhapa", "Koshi", 26.67, 87.69, "DMK"],
  ["Dhankuta", "Dhankuta", "Koshi", 26.98, 87.34, "DNK"],
  ["Rajbiraj", "Saptari", "Madhesh", 26.54, 86.75, "RJB"],
  ["Bardibas", "Mahottari", "Madhesh", 26.99, 85.9, "BDB"],
  ["Gaur", "Rautahat", "Madhesh", 26.78, 85.28, "GAR"],
  ["Dumre", "Tanahun", "Gandaki", 27.96, 84.42, "DMR"],
  ["Baglung", "Baglung", "Gandaki", 28.27, 83.59, "BGL"],
  ["Waling", "Syangja", "Gandaki", 27.99, 83.76, "WLG"],
  ["Tansen", "Palpa", "Lumbini", 27.866, 83.546, "TAN"],
  ["Ghorahi", "Dang", "Lumbini", 28.04, 82.48, "GHR"],
  ["Gulariya", "Bardiya", "Lumbini", 28.2, 81.35, "GLR"],
  ["Dailekh", "Dailekh", "Karnali", 28.84, 81.72, "DLK"],
  ["Jumla", "Jumla", "Karnali", 29.274, 82.18, "JML"],
  ["Mahendranagar", "Kanchanpur", "Sudurpashchim", 28.96, 80.18, "MHN"],
  ["Dipayal", "Doti", "Sudurpashchim", 29.26, 80.94, "DPY"],
  ["Dadeldhura", "Dadeldhura", "Sudurpashchim", 29.3, 80.58, "DDL"],
];
const names = [
  "Thamel Fleet Charge Point",
  "Himalayan Mobility Hub, Lalitpur",
  "Himalayan Mobility Hub, Bhaktapur",
  "Lakeside Mall EV Hub",
  "Koshi Commercial EV Hub",
  "Birgunj Gateway Station",
  "Bharatpur Greenway Hub",
  "Butwal Transit Charge Point",
  "Dharan City EV Station",
  "Nepalgunj Mobility Hub",
  "Janakpur Heritage EV Hub",
  "Dhangadhi Highway Station",
  "Hetauda Industrial Charge Point",
  "Itahari Junction Station",
  "Sauraha Riverside EV Hub",
];
export function makeStations(): Station[] {
  return Array.from({ length: 48 }, (_, i) => {
    const city = cities[i % cities.length];
    if (!city) throw new Error("City fixture missing.");
    const id = `station-${i + 1}`;
    const partial = i >= 27 && i < 37;
    const inactive = i >= 37 && i < 44;
    const pipeline = i >= 44;
    const count = i < 20 ? 2 : i < 34 ? 3 : 4;
    const chargers: Charger[] = Array.from({ length: count }, (_, j) => ({
      id: `charger-${i + 1}-${j + 1}`,
      stationId: id,
      equipmentId: `EQ-${String(i * 4 + j + 1).padStart(4, "0")}`,
      serialNumber: `VN-2026-${String(i + 1).padStart(3, "0")}-${j + 1}`,
      productId: `inventory-products-and-equipment-${((i + j) % 30) + 1}`,
      productModel: j % 2 === 0 ? "Terra DC 60" : "Pulsar AC 22",
      brand: ["ABB", "Delta", "Autel", "Wallbox"][(i + j) % 4] ?? "ABB",
      type: j % 2 === 0 ? "DC" : "AC",
      ratedPowerKw: j % 2 === 0 ? ([30, 60, 120][i % 3] ?? 60) : ([7, 11, 22][i % 3] ?? 22),
      connectorStandard:
        j % 2 !== 0 ? "Type 2" : ((["CCS2", "CHAdeMO", "GB/T"] as const)[i % 3] ?? "CCS2"),
      connectorCount: 2,
      status: inactive || pipeline ? "Offline" : partial && j === 0 ? "Faulted" : "Operational",
      installationDate: "2026-03-15",
      warrantyExpiry: "2029-03-15",
    }));
    const lifecycle = pipeline ? (pipelineStages[i - 44] ?? "Planned") : "Commissioned";
    return {
      id,
      stationCode: `NP-${city[5]}-${String(i + 1).padStart(3, "0")}`,
      name: names[i] ?? `${city[0]} ${i % 2 === 0 ? "Horizon Hotel" : "Greenway"} EV Station`,
      address: `${city[0]} ${i % 3 === 0 ? "Ring Road" : "Main Road"}, Ward ${(i % 12) + 1}`,
      province: city[2],
      district: city[1],
      municipality: city[0],
      latitude: city[3] + (i >= 34 ? 0.032 : 0),
      longitude: city[4] + (i >= 34 ? 0.025 : 0),
      stationType:
        (["Public", "Commercial", "Fleet", "Private", "Captive"] as StationType[])[i % 5] ??
        "Public",
      customerId: `sales-customers-and-accounts-${(i % 25) + 1}`,
      owner:
        ["Himalayan Mobility Pvt. Ltd.", "Greenway Hospitality", "Koshi Fleet Services"][i % 3] ??
        "Himalayan Mobility Pvt. Ltd.",
      operator: "Volt OS Infrastructure Operations",
      lifecycle,
      status: deriveStationStatus(lifecycle, chargers),
      installationDate: "2026-03-15",
      commissioningDate: pipeline ? null : `2026-${String((i % 10) + 1).padStart(2, "0")}-18`,
      warrantyExpiry: "2029-03-15",
      lastStatusUpdate: "2026-11-15T08:30:00Z",
      lastMaintenanceDate: "2026-10-24",
      openServiceRequestCount: partial || inactive ? 1 : 0,
      chargers,
    };
  });
}
