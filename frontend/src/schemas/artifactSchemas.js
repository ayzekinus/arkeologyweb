// Frontend fallback schemas (Form Builder is the source of truth).
// These are used only if the backend schema endpoint is unavailable.

export const UNITS = {
  length: [
    { value: "mm", label: "mm" },
    { value: "cm", label: "cm" },
    { value: "m", label: "m" },
  ],
  weight: [
    { value: "gr", label: "gr" },
    { value: "kg", label: "kg" },
  ],
};

export const ENUMS = {
  surface_quality: [
    { value: 0, label: "Pürtüklü" },
    { value: 1, label: "Tozsu" },
    { value: 2, label: "Kaygan" },
  ],
  baking: [
    { value: 0, label: "İyi" },
    { value: 1, label: "Orta" },
    { value: 2, label: "Kötü" },
  ],
  texture: [
    { value: 0, label: "Sert" },
    { value: 1, label: "Orta" },
    { value: 2, label: "Yumuşak" },
  ],
  density: [
    { value: 0, label: "Az" },
    { value: 1, label: "Orta" },
    { value: 2, label: "Çok" },
  ],
  dimension: [
    { value: 0, label: "İnce" },
    { value: 1, label: "Orta" },
    { value: 2, label: "İri" },
  ],
};

const t = (key, label, opts = {}) => ({
  key,
  label,
  kind: "text",
  ...opts,
});

const e = (key, label, enumKey, opts = {}) => ({
  key,
  label,
  kind: "enum",
  enumKey,
  ...opts,
});

const m = (key, label, unitKey, unitType = "length", opts = {}) => ({
  key,
  label,
  kind: "measure",
  unitKey,
  unitType,
  ...opts,
});

// --- Fallback "details" schemas (bucket: details) ---
export const DETAILS_SCHEMA = {
  "GENEL": [
    t("construction_technique", "Yapım Tekniği"),
    t("pattern_inscription", "Bezeme / Yazıt"),
    t("other_info", "Diğer Bilgiler", { kind: "textarea", fullWidth: true }),
  ],
  "SIKKE": [
    t("condition", "Kondüsyon"),
    t("unit", "Birimi"),
    m("diameter", "Çap", "diameter_unit", "length"),
    t("mold_direction", "Kalıp Yönü"),
    t("emperor", "İmparator"),
    t("minting_year", "Darp Yılı"),
    t("front_face_definition", "Ön Yüz Tanımı", { fullWidth: true }),
    t("back_face_definition", "Arka Yüz Tanımı", { fullWidth: true }),
    t("front_face_legend", "Ön Yüz Lejandı", { fullWidth: true }),
    t("back_face_legend", "Arka Yüz Lejandı", { fullWidth: true }),
    t("mint", "Darphane"),
    t("branch", "Şube"),
    t("reference", "Ref."),
    m("weight", "Ağırlık", "weight_unit", "weight"),
  ],
  "SERAMIK": [
    t("construction_technique", "Yapım Tekniği"),
    t("pattern_inscription", "Bezeme / Yazıt"),
    t("clay_definition", "Hamur Tanım", { kind: "textarea", fullWidth: true }),
    t("more_definition", "Astar / Sır / Yüzey Tanım", { kind: "textarea", fullWidth: true }),
    e("surface_quality", "Yüzey Kalitesi", "surface_quality"),
    e("baking", "Fırınlama", "baking"),
    e("texture", "Doku", "texture"),
    e("pore", "Gözenek (Yoğunluk)", "density"),
  ],
  "TERRACOTTA": [],
  "FIGURIN": [],
  "MEZAR": [
    t("grave_type", "Mezar Tipi"),
    t("burial_form", "Gömü Biçimi"),
    t("burial_type", "Gömü Tipi"),
    t("direction", "Yön"),
    t("grave_artifacts", "Mezar Buluntuları", { kind: "textarea", fullWidth: true }),
  ],
  "CAM_METAL": [],
};

// --- Fallback "measurements" schema (bucket: measurements) ---
export const MEASUREMENT_SCHEMA = [
  m("height", "Yükseklik", "height_unit", "length"),
  m("nozzle_diameter", "Ağız Çapı", "nozzle_diameter_unit", "length"),
  m("base_diameter", "Kaide / Dip Çapı", "base_diameter_unit", "length"),
  m("wall_thickness", "Kalınlık / Cidar", "wall_thickness_unit", "length"),
  m("body_diameter", "Gövde Çapı", "body_diameter_unit", "length"),
  m("length", "Uzunluk", "length_unit", "length"),
  m("width", "Genişlik", "width_unit", "length"),
  m("depth", "Derinlik", "depth_unit", "length"),
  m("weight", "Ağırlık", "weight_unit", "weight"),
];
