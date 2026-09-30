export interface SampleLeaf {
  id: string;
  name: string;
  crop: string;
  condition: string;
  severity: 'Low' | 'Moderate' | 'Severe' | 'Critical';
  thumbnailUrl: string;
  description: string;
  commonIn: string;
}

// Crisp stylized high-quality vector images for instant testing without needing camera uploads
export const SAMPLE_LEAVES: SampleLeaf[] = [
  {
    id: 'sample-tomato-blight',
    name: 'Tomato Early Blight (Alternaria solani)',
    crop: 'Tomato',
    condition: 'Early Blight',
    severity: 'Moderate',
    commonIn: 'South Asia, East Africa, Central America',
    description: 'Concentric dark target-board lesions with chlorotic yellow haloes on lower foliage.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23377?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sample-corn-rust',
    name: 'Maize Common Rust (Puccinia sorghi)',
    crop: 'Maize / Corn',
    condition: 'Common Rust',
    severity: 'Severe',
    commonIn: 'Sub-Saharan Africa, Latin America, Midwest',
    description: 'Golden-brown to cinnamon powdery pustules erupting across both upper and lower leaf surfaces.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sample-potato-late-blight',
    name: 'Potato Late Blight (Phytophthora infestans)',
    crop: 'Potato',
    condition: 'Late Blight',
    severity: 'Critical',
    commonIn: 'Highland Kenya, Andes, Northern India',
    description: 'Water-soaked dark lesions with white fungal downy growth on leaf undersides under humid conditions.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sample-cassava-mosaic',
    name: 'Cassava Mosaic Disease (CMD - Begomovirus)',
    crop: 'Cassava',
    condition: 'Cassava Mosaic Disease',
    severity: 'Severe',
    commonIn: 'Uganda, Nigeria, DR Congo, Tanzania',
    description: 'Severe mosaic mottling, distorted leaves, stunted root tuber accumulation transmitted by whiteflies.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sample-rice-blast',
    name: 'Rice Blast (Magnaporthe oryzae)',
    crop: 'Rice / Paddy',
    condition: 'Blast Disease',
    severity: 'Critical',
    commonIn: 'Southeast Asia, India, Madagascar',
    description: 'Diamond/spindle-shaped lesions with grayish centers and brown borders on leaves and neck nodes.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sample-maize-healthy',
    name: 'Healthy Maize Plant (Zea mays)',
    crop: 'Maize / Corn',
    condition: 'Healthy / No Disease',
    severity: 'Low',
    commonIn: 'Optimal Agro-ecological zones',
    description: 'Vibrant green chlorophyll-rich foliage with intact venation and no visible necrosis.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=600&q=80',
  }
];
