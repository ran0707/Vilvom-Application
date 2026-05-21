// PPC-based pest control data — Tea Board India, Plant Protection Code Ver. 17.0 (July 2025)

export interface ControlItem {
  method: string;
  dose?: string;
  mrl?: string;    // mg/kg
  notes?: string;
}

export interface PestPPCEntry {
  pestKey: string[];   // substrings to match against pest name (lowercase)
  displayName: string;
  chemical: ControlItem[];
  biological: ControlItem[];
  mechanical: ControlItem[];
  ipmNote?: string;
}

const PPC_DATA: PestPPCEntry[] = [
  {
    pestKey: ['looper', 'buzura', 'geometrid'],
    displayName: 'Tea Looper (Buzura suppressaria)',
    chemical: [
      { method: 'Emamectin Benzoate 5 SG', dose: '0.4 g/L', mrl: '0.06 mg/kg **' },
      { method: 'Flubendiamide 20 WG', dose: '0.5 g/L', mrl: '50.0 mg/kg' },
      { method: 'Quinalphos 25 EC', dose: '2 ml/L', mrl: '0.7 mg/kg **' },
      { method: 'Deltamethrin 2.8 EC', dose: '1 ml/L', mrl: '5.0 mg/kg' },
    ],
    biological: [
      { method: 'Bacillus thuringiensis var. kurstaki (Bt HD-1)', dose: 'As per label', notes: 'Apply at early larval stage' },
      { method: 'Beauveria bassiana 5% AS (strain BKN 1/14)', dose: '2 ml/L', notes: 'Spray during cool morning hours' },
      { method: 'Release of parasitic wasps (Apanteles sp.)', notes: 'Encourage natural field populations' },
    ],
    mechanical: [
      { method: 'Hand picking of egg masses and caterpillars', notes: 'Effective during early infestation' },
      { method: 'Light traps for adult moth monitoring' },
      { method: 'Prune and burn infested branches' },
      { method: 'Remove alternate host plants nearby' },
    ],
    ipmNote: 'Apply chemical controls only when ETL (5-6 caterpillars/bush) is crossed. Avoid blanket sprays.',
  },
  {
    pestKey: ['red slug', 'eterusia', 'slug caterpillar'],
    displayName: 'Red Slug Caterpillar (Eterusia magnifica)',
    chemical: [
      { method: 'Quinalphos 25 EC', dose: '2 ml/L', mrl: '0.7 mg/kg **' },
      { method: 'Emamectin Benzoate 5 SG', dose: '0.4 g/L', mrl: '0.06 mg/kg **' },
      { method: 'Flubendiamide 20 WG', dose: '0.5 g/L', mrl: '50.0 mg/kg' },
      { method: 'Thiacloprid 21.7 SC', dose: '1 ml/L', mrl: '5.0 mg/kg' },
    ],
    biological: [
      { method: 'Bacillus thuringiensis var. kurstaki', dose: 'As per label' },
      { method: 'Metarhizium anisopliae 5% AS (strain MET 5-1)', dose: '2 ml/L' },
      { method: 'Encourage egg parasitoids (Trichogramma sp.)' },
    ],
    mechanical: [
      { method: 'Mass collection and destruction of caterpillars', notes: 'Early morning collection' },
      { method: 'Pheromone traps for adult moth monitoring' },
      { method: 'Light traps for mass trapping' },
      { method: 'Maintain field hygiene — remove leaf litter' },
    ],
    ipmNote: 'High severity pest. Scout weekly. Begin treatment at first instar larval stage.',
  },
  {
    pestKey: ['mosquito bug', 'helopeltis', 'jassid', 'leafhopper'],
    displayName: 'Tea Mosquito Bug / Leafhopper',
    chemical: [
      { method: 'Thiacloprid 21.7 SC', dose: '1 ml/L', mrl: '5.0 mg/kg' },
      { method: 'Clothianidin 50 WDG', dose: '0.5 g/L', mrl: '0.7 mg/kg' },
      { method: 'Thiamethoxam 25 WG', dose: '0.5 g/L', mrl: '20.0 mg/kg' },
      { method: 'Fenpropathrin 30 EC', dose: '1 ml/L', mrl: '2.0 mg/kg' },
      { method: 'Flupyradifurone 17.09% SL', dose: 'As per label', mrl: 'MRL pending' },
    ],
    biological: [
      { method: 'Beauveria bassiana 5% AS', dose: '2 ml/L', notes: 'Morning application preferred' },
      { method: 'Encourage natural enemies — spiders, predatory beetles' },
      { method: 'Azadirachtin 1 EC (Neem-based)', dose: '2 ml/L', notes: 'As repellent/IGR' },
    ],
    mechanical: [
      { method: 'Yellow sticky traps for monitoring (10/acre)' },
      { method: 'Spot pruning of infested tender shoots' },
      { method: 'Regulate shade to reduce humidity' },
      { method: 'Avoid over-fertilization with nitrogen' },
    ],
    ipmNote: 'Major economic pest. Monitor banjhi flush. Systemic insecticides effective for sucking pests.',
  },
  {
    pestKey: ['spider mite', 'oligonychus', 'red mite', 'mite'],
    displayName: 'Tea Spider Mite (Oligonychus coffeae)',
    chemical: [
      { method: 'Fenazaquin 10 EC', dose: '2 ml/L', mrl: '3.0 mg/kg' },
      { method: 'Etoxazole 10 SC', dose: '1 ml/L', mrl: '15.0 mg/kg' },
      { method: 'Fenpyroximate 5 EC/SC', dose: '1.5 ml/L', mrl: '6.0 mg/kg **' },
      { method: 'Hexythiazox 5.45 EC', dose: '1 ml/L', mrl: '15.0 mg/kg' },
      { method: 'Propargite 57 EC', dose: '2 ml/L', mrl: '10.0 mg/kg' },
      { method: 'Spiromesifen 22.9 SC', dose: '1 ml/L', mrl: '70.0 mg/kg' },
    ],
    biological: [
      { method: 'Release of predatory mites (Phytoseiidae — Neoseiulus californicus)' },
      { method: 'Beauveria bassiana 5% AS', dose: '2 ml/L' },
      { method: 'Sulphur 80 WP (biopesticide-compatible)', dose: '3 g/L', notes: 'Not required MRL' },
    ],
    mechanical: [
      { method: 'High-pressure water sprays to dislodge mites', notes: 'Underside of leaves' },
      { method: 'Increase shade to reduce leaf surface temperature' },
      { method: 'Prune heavily infested branches' },
      { method: 'Avoid dusty conditions — use cover crops/mulch' },
    ],
    ipmNote: 'Rotate acaricide groups (IRAC codes) to prevent resistance. Never use same acaricide consecutively.',
  },
  {
    pestKey: ['thrips', 'scirtothrips'],
    displayName: 'Tea Thrips (Scirtothrips bispinosus)',
    chemical: [
      { method: 'Emamectin Benzoate 5 SG', dose: '0.4 g/L', mrl: '0.06 mg/kg **' },
      { method: 'Thiamethoxam 25 WG', dose: '0.5 g/L', mrl: '20.0 mg/kg' },
      { method: 'Spirotetramat 15.31% OD', dose: '1 ml/L', mrl: 'MRL pending' },
      { method: 'Fenpropathrin 30 EC', dose: '1 ml/L', mrl: '2.0 mg/kg' },
    ],
    biological: [
      { method: 'Orius sp. (predatory bug) — conserve field populations' },
      { method: 'Amblyseius cucumeris (predatory mite)' },
      { method: 'Azadirachtin 5 EC', dose: '1 ml/L', notes: 'Repellent and IGR effect' },
    ],
    mechanical: [
      { method: 'Blue/yellow sticky traps for monitoring and mass trapping' },
      { method: 'Reflective mulch to repel thrips' },
      { method: 'Avoid over-irrigation causing humidity build-up' },
    ],
    ipmNote: 'Thrips spread tospoviruses. Early monitoring via traps is critical. Begin control at 5 thrips/leaf.',
  },
  {
    pestKey: ['nematode', 'root knot', 'meloidogyne'],
    displayName: 'Root Knot Nematode',
    chemical: [
      { method: 'Consult KVK/PPO for soil nematicides' },
    ],
    biological: [
      { method: 'Trichoderma asperellum 2% AS (strain KBN29)', dose: '5 g/L soil drench' },
      { method: 'Neem cake incorporation in soil', dose: '250 kg/ha' },
      { method: 'Paecilomyces lilacinus (biocontrol)' },
    ],
    mechanical: [
      { method: 'Deep ploughing during off-season to expose nematodes' },
      { method: 'Maintain soil organic matter' },
      { method: 'Use nematode-resistant rootstocks' },
    ],
    ipmNote: 'Soil health is key. Regular nematode count in soil samples. Combine biocontrol + cultural practices.',
  },
];

export function getPPCDataForPest(pestName: string): PestPPCEntry | null {
  if (!pestName) return null;
  const lower = pestName.toLowerCase();
  return PPC_DATA.find(entry => entry.pestKey.some(k => lower.includes(k))) || null;
}

export const PPC_VERSION = 'PPC Ver. 17.0 — Tea Board India (July 2025)';
