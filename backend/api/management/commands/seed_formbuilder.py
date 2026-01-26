from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone


try:
    from api.models import (
        ArtifactForm,
        ArtifactFormField,
        FieldDefinition,
        LookupItem,
        LookupList,
        MaterialAlias,
        MaterialFormMap,
        MaterialGroup,
    )
    from core.models import Artifact, MainCode, Report
except Exception:  # pragma: no cover
    # Fallback if project split modules later
    from api.models_formbuilder import (  # type: ignore
        ArtifactForm,
        ArtifactFormField,
        FieldDefinition,
        LookupItem,
        LookupList,
        MaterialAlias,
        MaterialFormMap,
        MaterialGroup,
    )
    from core.models import Artifact, MainCode, Report  # type: ignore


DENSTY_CHOICES = [
    {"value": "0", "label": "Az"},
    {"value": "1", "label": "Orta"},
    {"value": "2", "label": "Çok"},
]

DIMENTION_CHOICES = [
    {"value": "0", "label": "İnce"},
    {"value": "1", "label": "Orta"},
    {"value": "2", "label": "İri"},
]

SURFACE_QUALITY = [
    {"value": "0", "label": "Pürtüklü"},
    {"value": "1", "label": "Tozsu"},
    {"value": "2", "label": "Kaygan"},
]

BAKING = [
    {"value": "0", "label": "İyi"},
    {"value": "1", "label": "Orta"},
    {"value": "2", "label": "Kötü"},
]

TEXTURE = [
    {"value": "0", "label": "Sert"},
    {"value": "1", "label": "Orta"},
    {"value": "2", "label": "Yumuşak"},
]

GLASS_OBJECT_FEATURES = [
    {"value": "bezemeli", "label": "Bezemeli"},
    {"value": "renkli", "label": "Renkli"},
]

GLASS_CURRENT_STATE = [
    {"value": "tum", "label": "Tüm"},
    {"value": "kirik", "label": "Kırık"},
    {"value": "parcali", "label": "Parçalı"},
]

GLASS_LIME_DECAY = [
    {"value": "ince", "label": "İnce"},
    {"value": "kalin", "label": "Kalın"},
    {"value": "lokal", "label": "Lokal"},
    {"value": "tum", "label": "Tüm"},
]

GLASS_DECAY_TYPES = [
    {"value": "matlasma", "label": "Matlaşma"},
    {"value": "irizasyon", "label": "İrizasyon"},
    {"value": "kahve_siyah", "label": "Kahve Rengi - Siyah Lekelenme"},
    {"value": "yapraklanma", "label": "Yapraklanma"},
    {"value": "yarik", "label": "Yarık Oluşumu"},
    {"value": "opaklasma", "label": "Opaklaşma"},
    {"value": "crizzling", "label": "Crizzling"},
]

GLASS_CHEMICAL_CLEAN = [
    {"value": "saf_su", "label": "Saf Su"},
    {"value": "alkol", "label": "Alkol"},
]

GLASS_MECHANICAL_CLEAN = [
    {"value": "bisturi", "label": "Bisturi"},
    {"value": "firca", "label": "Fırça"},
]

GLASS_ADHESIVE = [
    {"value": "araldit_2020", "label": "Araldit 2020"},
]

GLASS_CONSOLIDATION = [
    {"value": "paraloid_b72", "label": "Paraloid B-72"},
]

LOOKUPS = {
    "FINDING_PLACE": [
        {"value": "Alan A", "label": "Alan A", "order": 10},
        {"value": "Alan B", "label": "Alan B", "order": 20},
        {"value": "Alan C", "label": "Alan C", "order": 30},
        {"value": "Müze Deposu", "label": "Müze Deposu", "order": 40},
    ],
    "FORM_OBJECT": [
        {"value": "Seramik Parça", "label": "Seramik Parça", "order": 10},
        {"value": "Metal Parça", "label": "Metal Parça", "order": 20},
        {"value": "Cam Parça", "label": "Cam Parça", "order": 30},
        {"value": "Mimari Parça", "label": "Mimari Parça", "order": 40},
        {"value": "Sikke", "label": "Sikke", "order": 50},
        {"value": "Figürin", "label": "Figürin", "order": 60},
        {"value": "Terracotta", "label": "Terracotta", "order": 70},
        {"value": "Mezar", "label": "Mezar", "order": 80},
        {"value": "Diğer", "label": "Diğer", "order": 90},
    ],
    "PRODUCTION_MATERIAL": [
        {"value": "Seramik", "label": "Seramik", "order": 10},
        {"value": "Terracotta", "label": "Terracotta", "order": 20},
        {"value": "Figürin", "label": "Figürin", "order": 30},
        {"value": "Metal", "label": "Metal", "order": 40},
        {"value": "Cam", "label": "Cam", "order": 50},
        {"value": "Taş", "label": "Taş", "order": 60},
        {"value": "Kemik", "label": "Kemik", "order": 70},
        {"value": "Diğer", "label": "Diğer", "order": 80},
    ],
    "PERIOD": [
        {"value": "Prehistorik", "label": "Prehistorik", "order": 10},
        {"value": "Arkaik", "label": "Arkaik", "order": 20},
        {"value": "Klasik", "label": "Klasik", "order": 30},
        {"value": "Hellenistik", "label": "Hellenistik", "order": 40},
        {"value": "Roma", "label": "Roma", "order": 50},
        {"value": "Bizans", "label": "Bizans", "order": 60},
        {"value": "Osmanlı", "label": "Osmanlı", "order": 70},
        {"value": "Diğer", "label": "Diğer", "order": 80},
    ],
    "PRODUCTION_SITE": [
        {"value": "Bilinmiyor", "label": "Bilinmiyor", "order": 10},
        {"value": "Yerel Üretim", "label": "Yerel Üretim", "order": 20},
        {"value": "İthal", "label": "İthal", "order": 30},
    ],
    "EMPEROR": [
        {"value": "Augustus", "label": "Augustus", "order": 10},
        {"value": "Hadrianus", "label": "Hadrianus", "order": 20},
        {"value": "Traianus", "label": "Traianus", "order": 30},
    ],
    "COLOR": [
        {"value": "Kırmızı", "label": "Kırmızı", "order": 10},
        {"value": "Siyah", "label": "Siyah", "order": 20},
        {"value": "Kahverengi", "label": "Kahverengi", "order": 30},
        {"value": "Beyaz", "label": "Beyaz", "order": 40},
        {"value": "Gri", "label": "Gri", "order": 50},
    ],
    "GRAVE_TYPE": [
        {"value": "Sanduka", "label": "Sanduka", "order": 10},
        {"value": "Küp", "label": "Küp", "order": 20},
        {"value": "Kaya Mezar", "label": "Kaya Mezar", "order": 30},
        {"value": "Toprak", "label": "Toprak", "order": 40},
    ],
    "BURIAL_FORM": [
        {"value": "İnhumasyon", "label": "İnhumasyon", "order": 10},
        {"value": "Kremasyon", "label": "Kremasyon", "order": 20},
    ],
    "BURIAL_TYPE": [
        {"value": "Tek Gömü", "label": "Tek Gömü", "order": 10},
        {"value": "Çoklu Gömü", "label": "Çoklu Gömü", "order": 20},
    ],
}


FORMS = [
    {"key": "GENEL", "title": "Genel", "order": 0},
    {"key": "SIKKE", "title": "Sikke", "order": 10},
    {"key": "SERAMIK", "title": "Seramik", "order": 20},
    {"key": "TERRACOTTA", "title": "Terracotta", "order": 30},
    {"key": "FIGURIN", "title": "Figürin", "order": 40},
    {"key": "MEZAR", "title": "Mezar", "order": 50},
    {"key": "CAM_METAL", "title": "Cam / Metal", "order": 60},
    {"key": "KONSERVASYON_GENEL", "title": "Konservasyon Genel", "order": 70},
    {"key": "KONSERVASYON_CAM", "title": "Konservasyon (Cam)", "order": 80},
]


FIELDS = [
    # --- SIKKE (details) ---
    {"key": "coin.condition", "label": "Kondüsyon", "data_type": "string", "bucket": "details", "section": "Sikke"},
    {"key": "coin.unit", "label": "Birimi", "data_type": "string", "bucket": "details", "section": "Sikke"},
    {"key": "coin.mold_direction", "label": "Kalıp Yönü", "data_type": "string", "bucket": "details", "section": "Sikke"},
    {"key": "coin.emperor", "label": "İmparator", "data_type": "select", "bucket": "details", "section": "Sikke", "list_type": "EMPEROR"},
    {"key": "coin.minting_year", "label": "Darp Yılı", "data_type": "string", "bucket": "details", "section": "Sikke"},
    {"key": "coin.front_face_definition", "label": "Ön Yüz Tanımı", "data_type": "text", "bucket": "details", "section": "Sikke"},
    {"key": "coin.back_face_definition", "label": "Arka Yüz Tanımı", "data_type": "text", "bucket": "details", "section": "Sikke"},
    {"key": "coin.front_face_legend", "label": "Ön Yüz Lejandı", "data_type": "string", "bucket": "details", "section": "Sikke"},
    {"key": "coin.back_face_legend", "label": "Arka Yüz Lejandı", "data_type": "string", "bucket": "details", "section": "Sikke"},
    {"key": "coin.mint", "label": "Darphane", "data_type": "select", "bucket": "details", "section": "Sikke", "list_type": "PRODUCTION_SITE"},
    {"key": "coin.branch", "label": "Şube", "data_type": "string", "bucket": "details", "section": "Sikke"},
    {"key": "coin.reference", "label": "Ref.", "data_type": "string", "bucket": "details", "section": "Sikke"},

    # --- Measurements shared ---
    {"key": "measure.diameter", "label": "Çap", "data_type": "decimal", "bucket": "measurements", "section": "Ölçüler", "unit_group": "length"},
    {"key": "measure.weight", "label": "Ağırlık", "data_type": "decimal", "bucket": "measurements", "section": "Ölçüler", "unit_group": "weight"},
    {"key": "measure.height", "label": "Yükseklik", "data_type": "decimal", "bucket": "measurements", "section": "Ölçüler", "unit_group": "length"},
    {"key": "measure.nozzle_diameter", "label": "Ağız Çapı", "data_type": "decimal", "bucket": "measurements", "section": "Ölçüler", "unit_group": "length"},
    {"key": "measure.base_diameter", "label": "Kaide/Dip Çapı", "data_type": "decimal", "bucket": "measurements", "section": "Ölçüler", "unit_group": "length"},
    {"key": "measure.wall_thickness", "label": "Kalınlık/Cidar", "data_type": "decimal", "bucket": "measurements", "section": "Ölçüler", "unit_group": "length"},
    {"key": "measure.body_diameter", "label": "Gövde Çapı", "data_type": "decimal", "bucket": "measurements", "section": "Ölçüler", "unit_group": "length"},
    {"key": "measure.length", "label": "Uzunluk", "data_type": "decimal", "bucket": "measurements", "section": "Ölçüler", "unit_group": "length"},
    {"key": "measure.width", "label": "Genişlik", "data_type": "decimal", "bucket": "measurements", "section": "Ölçüler", "unit_group": "length"},
    {"key": "measure.depth", "label": "Derinlik", "data_type": "decimal", "bucket": "measurements", "section": "Ölçüler", "unit_group": "length"},

    # --- CERAMIC colors and surface ---
    {"key": "ceramic.clay_color", "label": "Hamur Rengi", "data_type": "select", "bucket": "measurements", "section": "Renk & Yüzey", "list_type": "COLOR"},
    {"key": "ceramic.undercoat_color", "label": "Astar Rengi", "data_type": "select", "bucket": "measurements", "section": "Renk & Yüzey", "list_type": "COLOR"},
    {"key": "ceramic.dipinto_color", "label": "Dipinto Rengi", "data_type": "select", "bucket": "measurements", "section": "Renk & Yüzey", "list_type": "COLOR"},
    {"key": "ceramic.surface_color", "label": "Yüzey Rengi", "data_type": "select", "bucket": "measurements", "section": "Renk & Yüzey", "list_type": "COLOR"},
    {"key": "ceramic.glaze_color", "label": "Sır Rengi", "data_type": "select", "bucket": "measurements", "section": "Renk & Yüzey", "list_type": "COLOR"},
    {"key": "ceramic.pattern_color", "label": "Bezeme Rengi", "data_type": "select", "bucket": "measurements", "section": "Renk & Yüzey", "list_type": "COLOR"},
    {"key": "ceramic.other_color_info", "label": "Renk Diğer Bilgi", "data_type": "text", "bucket": "measurements", "section": "Renk & Yüzey"},
    {"key": "ceramic.clay_definition", "label": "Hamur Tanım", "data_type": "text", "bucket": "details", "section": "Renk & Yüzey"},
    {"key": "ceramic.more_definition", "label": "Astar/Sır/Yüzey Tanım", "data_type": "text", "bucket": "details", "section": "Renk & Yüzey"},
    {"key": "ceramic.surface_quality", "label": "Yüzey Kalitesi", "data_type": "choice", "bucket": "details", "section": "Renk & Yüzey", "choices": SURFACE_QUALITY},
    {"key": "ceramic.baking", "label": "Fırınlama", "data_type": "choice", "bucket": "details", "section": "Renk & Yüzey", "choices": BAKING},
    {"key": "ceramic.texture", "label": "Doku", "data_type": "choice", "bucket": "details", "section": "Renk & Yüzey", "choices": TEXTURE},

    # --- Additives (shared for ceramic-like) ---
    {"key": "additives.soil_density", "label": "Kum Yoğunluğu", "data_type": "choice", "bucket": "additives", "section": "Katkılar", "choices": DENSTY_CHOICES},
    {"key": "additives.soil_dimention", "label": "Kum Boyutu", "data_type": "choice", "bucket": "additives", "section": "Katkılar", "choices": DIMENTION_CHOICES},
    {"key": "additives.mica_density", "label": "Mika Yoğunluğu", "data_type": "choice", "bucket": "additives", "section": "Katkılar", "choices": DENSTY_CHOICES},
    {"key": "additives.mica_dimention", "label": "Mika Boyutu", "data_type": "choice", "bucket": "additives", "section": "Katkılar", "choices": DIMENTION_CHOICES},
    {"key": "additives.lime_density", "label": "Kireç Yoğunluğu", "data_type": "choice", "bucket": "additives", "section": "Katkılar", "choices": DENSTY_CHOICES},
    {"key": "additives.lime_dimention", "label": "Kireç Boyutu", "data_type": "choice", "bucket": "additives", "section": "Katkılar", "choices": DIMENTION_CHOICES},
    {"key": "additives.pot_clay_density", "label": "Samot Yoğunluğu", "data_type": "choice", "bucket": "additives", "section": "Katkılar", "choices": DENSTY_CHOICES},
    {"key": "additives.pot_clay_dimention", "label": "Samot Boyutu", "data_type": "choice", "bucket": "additives", "section": "Katkılar", "choices": DIMENTION_CHOICES},
    {"key": "additives.quartz_density", "label": "Kuvars Yoğunluğu", "data_type": "choice", "bucket": "additives", "section": "Katkılar", "choices": DENSTY_CHOICES},
    {"key": "additives.quartz_dimention", "label": "Kuvars Boyutu", "data_type": "choice", "bucket": "additives", "section": "Katkılar", "choices": DIMENTION_CHOICES},
    {"key": "additives.stone_density", "label": "Tascık Yoğunluğu", "data_type": "choice", "bucket": "additives", "section": "Katkılar", "choices": DENSTY_CHOICES},
    {"key": "additives.stone_dimention", "label": "Tascık Boyutu", "data_type": "choice", "bucket": "additives", "section": "Katkılar", "choices": DIMENTION_CHOICES},
    {"key": "additives.plant_density", "label": "Bitki Yoğunluğu", "data_type": "choice", "bucket": "additives", "section": "Katkılar", "choices": DENSTY_CHOICES},
    {"key": "additives.plant_dimention", "label": "Bitki Boyutu", "data_type": "choice", "bucket": "additives", "section": "Katkılar", "choices": DIMENTION_CHOICES},
    {"key": "additives.others", "label": "Katkı Diğer", "data_type": "text", "bucket": "additives", "section": "Katkılar"},

    # --- CAM/METAL details ---
    {"key": "cm.construction_technique", "label": "Yapım Tekniği", "data_type": "string", "bucket": "details", "section": "Cam / Metal"},
    {"key": "cm.pattern_inscription", "label": "Bezeme/Yazıt", "data_type": "string", "bucket": "details", "section": "Cam / Metal"},
    {"key": "cm.other_info", "label": "Diğer Bilgiler", "data_type": "text", "bucket": "details", "section": "Cam / Metal"},

    # --- GRAVE details ---
    {"key": "grave.grave_type", "label": "Mezar Tipi", "data_type": "select", "bucket": "details", "section": "Mezar", "list_type": "GRAVE_TYPE"},
    {"key": "grave.burial_form", "label": "Gömü Biçimi", "data_type": "select", "bucket": "details", "section": "Mezar", "list_type": "BURIAL_FORM"},
    {"key": "grave.burial_type", "label": "Gömü Tipi", "data_type": "select", "bucket": "details", "section": "Mezar", "list_type": "BURIAL_TYPE"},
    {"key": "grave.direction", "label": "Yön", "data_type": "string", "bucket": "details", "section": "Mezar"},
    {"key": "grave.grave_artifacts", "label": "Mezar Buluntuları", "data_type": "text", "bucket": "details", "section": "Mezar"},

    # --- CONSERVATION (general) ---
    {"key": "conservation.lab_entry_date", "label": "Lab Giriş Tarihi", "data_type": "date", "bucket": "details", "section": "Konservasyon Genel Bilgiler"},
    {"key": "conservation.lab_exit_date", "label": "Lab Çıkış Tarihi", "data_type": "date", "bucket": "details", "section": "Konservasyon Genel Bilgiler"},
    {"key": "conservation.entry_piece_count", "label": "Giriş Parça Sayısı", "data_type": "int", "bucket": "details", "section": "Konservasyon Genel Bilgiler"},
    {"key": "conservation.exit_piece_count", "label": "Çıkış Parça Sayısı", "data_type": "int", "bucket": "details", "section": "Konservasyon Genel Bilgiler"},
    {"key": "conservation.conservator", "label": "Konservatör", "data_type": "string", "bucket": "details", "section": "Konservasyon Genel Bilgiler"},

    # --- CONSERVATION (glass) ---
    {"key": "conservation.glass.object_features", "label": "Objenin Özellikleri", "data_type": "multiselect", "bucket": "details", "section": "Objenin Özellikleri", "choices": GLASS_OBJECT_FEATURES},
    {"key": "conservation.glass.current_state", "label": "Mevcut Durum", "data_type": "multiselect", "bucket": "details", "section": "Mevcut Durum", "choices": GLASS_CURRENT_STATE},
    {"key": "conservation.glass.decay_lime", "label": "Kalker", "data_type": "choice", "bucket": "details", "section": "Bozulmalar", "choices": GLASS_LIME_DECAY},
    {"key": "conservation.glass.decay_types", "label": "Bozulmalar", "data_type": "multiselect", "bucket": "details", "section": "Bozulmalar", "choices": GLASS_DECAY_TYPES},
    {"key": "conservation.glass.clean_chemical", "label": "Kimyasal", "data_type": "multiselect", "bucket": "details", "section": "Temizlik", "choices": GLASS_CHEMICAL_CLEAN},
    {"key": "conservation.glass.clean_mechanical", "label": "Mekanik", "data_type": "multiselect", "bucket": "details", "section": "Temizlik", "choices": GLASS_MECHANICAL_CLEAN},
    {"key": "conservation.glass.adhesive", "label": "Yapıştırma", "data_type": "choice", "bucket": "details", "section": "Yapıştırma", "choices": GLASS_ADHESIVE},
    {"key": "conservation.glass.consolidation", "label": "Sağlamlaştırma", "data_type": "choice", "bucket": "details", "section": "Sağlamlaştırma", "choices": GLASS_CONSOLIDATION},
    {"key": "conservation.glass.notes", "label": "Açıklama", "data_type": "text", "bucket": "details", "section": "Açıklama"},
    {"key": "conservation.glass.images", "label": "Görseller", "data_type": "file", "bucket": "details", "section": "Görseller"},
]


FORM_FIELD_MAP = {
    "GENEL": [],
    "SIKKE": [
        ("coin.condition", False),
        ("coin.unit", False),
        ("measure.diameter", False),
        ("coin.mold_direction", False),
        ("coin.emperor", False),
        ("coin.minting_year", False),
        ("coin.front_face_definition", False),
        ("coin.back_face_definition", False),
        ("coin.front_face_legend", False),
        ("coin.back_face_legend", False),
        ("coin.mint", False),
        ("coin.branch", False),
        ("coin.reference", False),
        ("measure.weight", False),
    ],
    "SERAMIK": [
        ("measure.height", False),
        ("measure.nozzle_diameter", False),
        ("measure.base_diameter", False),
        ("measure.wall_thickness", False),
        ("measure.length", False),
        ("measure.width", False),
        ("measure.diameter", False),
        ("ceramic.clay_color", False),
        ("ceramic.undercoat_color", False),
        ("ceramic.dipinto_color", False),
        ("ceramic.surface_color", False),
        ("ceramic.glaze_color", False),
        ("ceramic.pattern_color", False),
        ("ceramic.other_color_info", False),
        ("ceramic.clay_definition", False),
        ("ceramic.more_definition", False),
        ("ceramic.surface_quality", False),
        ("ceramic.baking", False),
        ("ceramic.texture", False),
        ("additives.soil_density", False),
        ("additives.soil_dimention", False),
        ("additives.mica_density", False),
        ("additives.mica_dimention", False),
        ("additives.lime_density", False),
        ("additives.lime_dimention", False),
        ("additives.pot_clay_density", False),
        ("additives.pot_clay_dimention", False),
        ("additives.quartz_density", False),
        ("additives.quartz_dimention", False),
        ("additives.stone_density", False),
        ("additives.stone_dimention", False),
        ("additives.plant_density", False),
        ("additives.plant_dimention", False),
        ("additives.others", False),
    ],
    "TERRACOTTA": [
        ("measure.height", False),
        ("measure.length", False),
        ("measure.width", False),
        ("ceramic.clay_color", False),
        ("ceramic.undercoat_color", False),
        ("ceramic.other_color_info", False),
        ("ceramic.clay_definition", False),
        ("ceramic.more_definition", False),
    ],
    "FIGURIN": [
        ("measure.height", False),
        ("measure.length", False),
        ("measure.width", False),
        ("ceramic.clay_color", False),
        ("ceramic.undercoat_color", False),
        ("ceramic.other_color_info", False),
        ("ceramic.clay_definition", False),
        ("ceramic.more_definition", False),
    ],
    "CAM_METAL": [
        ("cm.construction_technique", False),
        ("cm.pattern_inscription", False),
        ("measure.height", False),
        ("measure.nozzle_diameter", False),
        ("measure.base_diameter", False),
        ("measure.wall_thickness", False),
        ("measure.body_diameter", False),
        ("measure.length", False),
        ("measure.width", False),
        ("cm.other_info", False),
    ],
    "MEZAR": [
        ("measure.length", False),
        ("measure.width", False),
        ("measure.depth", False),
        ("grave.grave_type", False),
        ("grave.burial_form", False),
        ("grave.burial_type", False),
        ("grave.direction", False),
        ("grave.grave_artifacts", False),
    ],
    "KONSERVASYON_GENEL": [
        ("conservation.lab_entry_date", False),
        ("conservation.lab_exit_date", False),
        ("conservation.entry_piece_count", False),
        ("conservation.exit_piece_count", False),
        ("conservation.conservator", False, True),
    ],
    "KONSERVASYON_CAM": [
        ("conservation.glass.object_features", False),
        ("conservation.glass.current_state", False),
        ("conservation.glass.decay_lime", False),
        ("conservation.glass.decay_types", False),
        ("conservation.glass.clean_chemical", False),
        ("conservation.glass.clean_mechanical", False),
        ("conservation.glass.adhesive", False),
        ("conservation.glass.consolidation", False),
        ("conservation.glass.notes", False),
        ("conservation.glass.images", False),
    ],
}


class Command(BaseCommand):
    help = "Seed default Form Builder forms/fields mappings (safe to re-run)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing Form Builder definitions (forms/fields/maps) before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        reset = options.get("reset")

        if reset:
            ArtifactFormField.objects.all().delete()
            MaterialFormMap.objects.all().delete()
            MaterialAlias.objects.all().delete()
            MaterialGroup.objects.all().delete()
            LookupItem.objects.all().delete()
            LookupList.objects.all().delete()
            ArtifactForm.objects.all().delete()
            FieldDefinition.objects.all().delete()

        # Forms
        forms_by_key = {}
        for f in FORMS:
            obj, _ = ArtifactForm.objects.update_or_create(
                key=f["key"],
                defaults={"title": f["title"], "order": f.get("order", 99), "is_active": True},
            )
            forms_by_key[obj.key] = obj

        # Fields
        fields_by_key = {}
        for fd in FIELDS:
            obj, _ = FieldDefinition.objects.update_or_create(
                key=fd["key"],
                defaults={
                    "label": fd["label"],
                    "data_type": fd.get("data_type", "string"),
                    "bucket": fd.get("bucket", "details"),
                    "section": fd.get("section", ""),
                    "help_text": fd.get("help_text", ""),
                    "list_type": fd.get("list_type", "") or "",
                    "unit_group": fd.get("unit_group", "") or "",
                    "choices": fd.get("choices", None),
                    "is_active": True,
                },
            )
            fields_by_key[obj.key] = obj

        # Form-field mapping
        for form_key, items in FORM_FIELD_MAP.items():
            form = forms_by_key.get(form_key)
            if not form:
                continue
            for i, item in enumerate(items, start=1):
                if len(item) == 3:
                    field_key, required, readonly = item
                else:
                    field_key, required = item
                    readonly = False
                field = fields_by_key.get(field_key)
                if not field:
                    continue
                defaults = {"required": bool(required), "readonly": bool(readonly), "order": i}
                if hasattr(ArtifactFormField, "is_active"):
                    defaults["is_active"] = True
                ArtifactFormField.objects.update_or_create(
                    form=form,
                    field=field,
                    defaults=defaults,
                )

        # Material groups + form mapping (optional defaults)
        metal, _ = MaterialGroup.objects.update_or_create(key="METAL", defaults={"title": "Metal", "is_active": True})
        ceramic, _ = MaterialGroup.objects.update_or_create(key="CERAMIC", defaults={"title": "Seramik", "is_active": True})
        grave, _ = MaterialGroup.objects.update_or_create(key="GRAVE", defaults={"title": "Mezar", "is_active": True})
        glass, _ = MaterialGroup.objects.update_or_create(key="GLASS", defaults={"title": "Cam", "is_active": True})

        def map_form(group, form_key, order):
            f = forms_by_key.get(form_key)
            if f:
                MaterialFormMap.objects.update_or_create(group=group, form=f, defaults={"order": order})

        map_form(metal, "SIKKE", 10)
        map_form(metal, "CAM_METAL", 20)

        map_form(ceramic, "SERAMIK", 10)
        map_form(ceramic, "TERRACOTTA", 20)
        map_form(ceramic, "FIGURIN", 30)

        map_form(grave, "MEZAR", 10)

        map_form(glass, "KONSERVASYON_GENEL", 10)
        map_form(glass, "KONSERVASYON_CAM", 20)

        # Example aliases (edit in admin as needed)
        for name in ["Altın", "Gümüş", "Bronz", "Bakır", "Demir", "Metal"]:
            MaterialAlias.objects.update_or_create(name=name, defaults={"group": metal})
        for name in ["Seramik", "Pişmiş Toprak", "Terracotta", "Kil"]:
            MaterialAlias.objects.update_or_create(name=name, defaults={"group": ceramic})
        for name in ["Mezar"]:
            MaterialAlias.objects.update_or_create(name=name, defaults={"group": grave})
        for name in ["Cam"]:
            MaterialAlias.objects.update_or_create(name=name, defaults={"group": glass})

        # Lookup lists + items
        for key, items in LOOKUPS.items():
            lookup, _ = LookupList.objects.update_or_create(
                key=key,
                defaults={
                    "title": key.replace("_", " ").title(),
                    "description": "",
                    "order": 99,
                    "is_active": True,
                },
            )
            for item in items:
                LookupItem.objects.update_or_create(
                    lookup=lookup,
                    value=item["value"],
                    defaults={
                        "label": item.get("label", item["value"]),
                        "order": item.get("order", 99),
                        "is_active": True,
                    },
                )

        finding_place_lookup = LookupList.objects.filter(key="FINDING_PLACE").first()
        finding_places = (
            list(LookupItem.objects.filter(lookup=finding_place_lookup, is_active=True).order_by("order", "label"))
            if finding_place_lookup
            else []
        )
        if finding_places:
            sample_codes = ["AAA", "AAB", "AAC"]
            for code, finding_place in zip(sample_codes, finding_places):
                MainCode.objects.update_or_create(
                    code=code,
                    defaults={
                        "finding_place": finding_place,
                        "plan_square": "A10",
                        "description": "Örnek Anakod",
                        "layer": "1",
                        "level": "1",
                        "grave_no": "1",
                        "gis": "N/A",
                    },
                )

            for main_code in MainCode.objects.all()[:3]:
                Artifact.objects.update_or_create(
                    main_code=main_code,
                    artifact_no=1,
                    defaults={
                        "artifact_date": main_code.created_at.date(),
                        "form_type": "GENEL",
                    },
                )

            sample_artifacts = list(Artifact.objects.filter(main_code__in=MainCode.objects.all()[:3])[:5])
            if sample_artifacts:
                report, _ = Report.objects.update_or_create(
                    title="Örnek Rapor",
                    defaults={
                        "report_type": "GENEL",
                        "prepared_by": "Seed Builder",
                        "finding_place": finding_places[0],
                        "writing_date": timezone.now().date(),
                        "study_year": timezone.now().year,
                        "description": "Seed builder tarafından oluşturulan örnek rapor.",
                    },
                )
                report.artifacts.set(sample_artifacts)

        self.stdout.write(self.style.SUCCESS("Form Builder seed completed."))
