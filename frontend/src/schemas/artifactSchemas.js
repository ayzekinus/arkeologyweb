/**
 * Artifact (Buluntu) form schemas:
 * - Pretty rendering (modal)
 * - Dynamic form rendering (create/edit) without touching Buluntu.jsx for new fields
 *
 * Keys map to stored JSON fields: row.details / row.measurements.
 */

export const ENUMS = {
  surface_quality: {
    0: "Pürtüklü",
    1: "Tozsu",
    2: "Kaygan",
  },
  baking: {
    0: "İyi",
    1: "Orta",
    2: "Kötü",
  },
  texture: {
    0: "Sert",
    1: "Orta",
    2: "Yumuşak",
  },
  pore: {
    0: "Az",
    1: "Orta",
    2: "Çok",
  },
};

export const UNITS = {
  length: ["mm", "cm", "m"],
  weight: ["gr", "kg"],
};

/**
 * Measurement schema (common fields).
 * Add/remove fields here without changing page component.
 */
export const MEASUREMENT_SCHEMA = [
  { key: "height", label: "Yükseklik", unitKey: "height_unit", kind: "measure", unitType: "length" },
  { key: "nozzle_diameter", label: "Ağız Çapı", unitKey: "nozzle_diameter_unit", kind: "measure", unitType: "length" },
  { key: "base_diameter", label: "Kaide/Dip Çapı", unitKey: "base_diameter_unit", kind: "measure", unitType: "length" },
  { key: "wall_thickness", label: "Kalınlık/Cidar", unitKey: "wall_thickness_unit", kind: "measure", unitType: "length" },
  { key: "length", label: "Uzunluk", unitKey: "length_unit", kind: "measure", unitType: "length" },
  { key: "width", label: "Genişlik", unitKey: "width_unit", kind: "measure", unitType: "length" },
  { key: "body_diameter", label: "Gövde Çapı", unitKey: "body_diameter_unit", kind: "measure", unitType: "length" },
];

/**
 * Details schema per form_type.
 * kind: text | textarea | enum | measure
 */
export const DETAILS_SCHEMA = {
  // Coin (Sikke)
  SIKKE: [
    { key: "condition", label: "Kondüsyon", kind: "text" },
    { key: "unit", label: "Birimi", kind: "text" },
    { key: "diameter", label: "Çap", unitKey: "diameter_unit", kind: "measure", unitType: "length" },
    { key: "mold_direction", label: "Kalıp Yönü", kind: "text" },
    { key: "emperor", label: "İmparator", kind: "text" },
    { key: "minting_year", label: "Darp Yılı", kind: "text" },

    { key: "front_face_definition", label: "Ön Yüz Tanımı", kind: "textarea", fullWidth: true },
    { key: "back_face_definition", label: "Arka Yüz Tanımı", kind: "textarea", fullWidth: true },
    { key: "front_face_legend", label: "Ön Yüz Lejandı", kind: "textarea", fullWidth: true },
    { key: "back_face_legend", label: "Arka Yüz Lejandı", kind: "textarea", fullWidth: true },

    { key: "mint", label: "Darphane", kind: "text" },
    { key: "branch", label: "Şube", kind: "text" },
    { key: "reference", label: "Ref.", kind: "text" },
    { key: "weight", label: "Ağırlık", unitKey: "weight_unit", kind: "measure", unitType: "weight" },
  ],

  // Ceramic (Seramik)
  SERAMIK: [
    { key: "clay_color", label: "Hamur Rengi", kind: "text" },
    { key: "undercoat_color", label: "Astar Rengi", kind: "text" },
    { key: "dipinto_color", label: "Dipinto Rengi", kind: "text" },
    { key: "surface_color", label: "Yüzey Rengi", kind: "text" },
    { key: "glaze_color", label: "Sır Rengi", kind: "text" },
    { key: "pattern_color", label: "Bezeme Rengi", kind: "text" },
    { key: "other_color", label: "Diğer Renk", kind: "text" },

    { key: "clay_definition", label: "Hamur Tanım", kind: "textarea", fullWidth: true },
    { key: "form_definition", label: "Form Tanım", kind: "textarea", fullWidth: true },
    { key: "more_definition", label: "Astar/Sır/Yüzey Tanım", kind: "textarea", fullWidth: true },

    { key: "surface_quality", label: "Yüzey Kalitesi", kind: "enum", enumKey: "surface_quality" },
    { key: "baking", label: "Fırınlama", kind: "enum", enumKey: "baking" },
    { key: "texture", label: "Doku", kind: "enum", enumKey: "texture" },
    { key: "pore", label: "Gözenek", kind: "enum", enumKey: "pore" },
  ],

  // Grave (Mezar) — placeholder for next iteration
  MEZAR: [
    { key: "grave_type", label: "Mezar Tipi", kind: "text" },
    { key: "burial_form", label: "Gömü Biçimi", kind: "text" },
    { key: "burial_type", label: "Gömü Tipi", kind: "text" },
    { key: "depth", label: "Derinlik", kind: "text" },
    { key: "direction", label: "Yön", kind: "text" },
    { key: "grave_artifacts", label: "Mezar Buluntuları", kind: "textarea", fullWidth: true },
  ],
};
