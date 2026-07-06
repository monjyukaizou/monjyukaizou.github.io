-- 書籍作成シミュレーター用 紙データベース スキーマ (SQLite)
-- 詳細説明は design.md を参照。CSV/JSONへの書き出しを前提に、
-- 列名はGoogleスプレッドシート運用時の列名と対応させてある。

PRAGMA foreign_keys = ON;

-- メーカーマスタ
CREATE TABLE manufacturers (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,          -- メーカー名
    name_kana   TEXT,
    website_url TEXT
);

-- 銘柄マスタ（1銘柄=1行。米坪違いは paper_official_specs / paper_measured_specs 側で展開）
CREATE TABLE papers (
    id               INTEGER PRIMARY KEY,
    manufacturer_id  INTEGER NOT NULL REFERENCES manufacturers(id),
    series_name      TEXT,              -- シリーズ名
    product_name     TEXT NOT NULL,     -- 銘柄名
    product_code     TEXT,              -- メーカー品番
    category         TEXT NOT NULL,     -- 上質紙/書籍用紙/嵩高書籍用紙/コート紙/マットコート/微塗工紙 等
    launch_year      INTEGER,
    discontinued     INTEGER NOT NULL DEFAULT 0,  -- 0/1
    certification    TEXT,              -- FSC/PEFC/再生紙比率など自由記述
    supplier         TEXT,              -- 取扱商社
    reference_price  REAL,              -- 参考価格
    min_lot          TEXT,              -- 最小ロット
    lead_time        TEXT,              -- 標準納期
    notes            TEXT
);

-- メーカー公式仕様（銘柄×米坪×基準寸法で複数行）
CREATE TABLE paper_official_specs (
    id              INTEGER PRIMARY KEY,
    paper_id        INTEGER NOT NULL REFERENCES papers(id),
    base_size       TEXT NOT NULL,      -- 四六判 / 菊判 など連量の基準寸法
    basis_weight_gsm REAL NOT NULL,     -- 米坪 g/m2
    ream_weight_kg   REAL,              -- 連量 kg
    thickness_um     REAL,              -- 紙厚 μm
    whiteness_pct    REAL,              -- 白色度 %
    gloss_pct        REAL,              -- 光沢度 %
    opacity_pct      REAL,              -- 不透明度 %
    source_url       TEXT,              -- 出典URL
    source_document  TEXT,              -- 出典資料名
    recorded_date    TEXT               -- 転記日 (ISO8601)
);

-- 自社実測値（銘柄×測定回で複数行、履歴として蓄積）
CREATE TABLE paper_measured_specs (
    id                  INTEGER PRIMARY KEY,
    paper_id            INTEGER NOT NULL REFERENCES papers(id),
    basis_weight_gsm    REAL,
    thickness_um        REAL,
    whiteness_pct       REAL,
    gloss_pct           REAL,
    opacity_pct         REAL,
    measured_by         TEXT,
    measured_date       TEXT,
    measurement_method  TEXT,
    sample_lot          TEXT,
    confidence_level    INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    notes               TEXT
);

-- 質感評価（5段階、出所を明示）
CREATE TABLE paper_texture_ratings (
    id                  INTEGER PRIMARY KEY,
    paper_id            INTEGER NOT NULL REFERENCES papers(id),
    source_type         TEXT NOT NULL CHECK (source_type IN ('official','measured','sales_note')),
    rough_feel          INTEGER CHECK (rough_feel BETWEEN 1 AND 5),        -- ラフ感
    stiffness           INTEGER CHECK (stiffness BETWEEN 1 AND 5),         -- 硬さ
    bulkiness           INTEGER CHECK (bulkiness BETWEEN 1 AND 5),         -- 嵩高感
    moistness           INTEGER CHECK (moistness BETWEEN 1 AND 5),        -- しっとり感
    premium_feel        INTEGER CHECK (premium_feel BETWEEN 1 AND 5),      -- 高級感
    readability         INTEGER CHECK (readability BETWEEN 1 AND 5),      -- 読みやすさ
    photo_reproduction  INTEGER CHECK (photo_reproduction BETWEEN 1 AND 5), -- 写真再現性
    rated_by            TEXT,
    rated_date          TEXT,
    notes               TEXT
);

-- 営業メモ（自由記述＋タグ）
CREATE TABLE paper_sales_notes (
    id           INTEGER PRIMARY KEY,
    paper_id     INTEGER NOT NULL REFERENCES papers(id),
    note_date    TEXT,
    author       TEXT,
    project_name TEXT,          -- 案件名
    content      TEXT NOT NULL,
    tags         TEXT,          -- カンマ区切り or JSON配列文字列
    rating_overall INTEGER CHECK (rating_overall BETWEEN 1 AND 5)
);

-- 用途ジャンルマスタ（図録/写真集/絵本/文芸書 等、コンテンツ軸）
CREATE TABLE book_genres (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- 用途適性（銘柄×ジャンルの多対多）
CREATE TABLE paper_usage_fitness (
    id        INTEGER PRIMARY KEY,
    paper_id  INTEGER NOT NULL REFERENCES papers(id),
    genre_id  INTEGER NOT NULL REFERENCES book_genres(id),
    fitness_score INTEGER NOT NULL CHECK (fitness_score BETWEEN 1 AND 5),
    reason    TEXT,
    UNIQUE (paper_id, genre_id)
);

-- 判型マスタ（仕上がり寸法）
CREATE TABLE trim_sizes (
    id           INTEGER PRIMARY KEY,
    name         TEXT NOT NULL UNIQUE,  -- 例: A5, 四六判, B5 等
    width_mm     REAL NOT NULL,
    height_mm    REAL NOT NULL
);

-- 製本方式マスタ（背幅・重量補正のパラメータを保持）
CREATE TABLE binding_types (
    id                    INTEGER PRIMARY KEY,
    name                  TEXT NOT NULL UNIQUE, -- 並製本(無線綴じ) / 上製本(丸背) 等
    spine_correction_factor REAL NOT NULL DEFAULT 1.0, -- 背幅補正係数
    spine_fixed_addition_mm REAL NOT NULL DEFAULT 0,   -- 見返し等の固定加算(mm)
    notes                 TEXT
);

-- シミュレーション入力（書籍プロジェクト）
CREATE TABLE book_projects (
    id               INTEGER PRIMARY KEY,
    project_name     TEXT NOT NULL,
    page_count       INTEGER NOT NULL,
    trim_size_id     INTEGER NOT NULL REFERENCES trim_sizes(id),
    binding_type_id  INTEGER NOT NULL REFERENCES binding_types(id),
    paper_id         INTEGER NOT NULL REFERENCES papers(id),   -- 選定した本文紙
    basis_weight_gsm REAL NOT NULL,   -- 選定した米坪(同一銘柄で複数米坪があるため明示)
    created_date     TEXT,
    created_by       TEXT
);

-- シミュレーション計算結果（同一入力の再計算履歴を残す）
CREATE TABLE book_calculation_results (
    id                      INTEGER PRIMARY KEY,
    project_id              INTEGER NOT NULL REFERENCES book_projects(id),
    paper_weight_g          REAL,   -- 本文用紙重量
    spine_width_mm          REAL,   -- 背幅
    total_book_weight_g     REAL,   -- 書籍総重量(概算)
    recommended_flag        INTEGER NOT NULL DEFAULT 0, -- 用途適性から見た推奨可否
    sales_description_text  TEXT,   -- 自動生成した営業説明文
    calculated_date         TEXT
);
