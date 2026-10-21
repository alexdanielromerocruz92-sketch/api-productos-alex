CREATE TABLE IF NOT EXISTS maestros (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(180) UNIQUE NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(160) NOT NULL,
  descripcion TEXT,
  precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  maestro_id INTEGER REFERENCES maestros(id) ON DELETE SET NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pokemon (
  id INTEGER PRIMARY KEY CHECK (id > 0),
  nombre VARCHAR(120) NOT NULL,
  tipo VARCHAR(80) NOT NULL,
  imagen_frontal TEXT NOT NULL DEFAULT '',
  imagen_trasera TEXT NOT NULL DEFAULT '',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO maestros (id, nombre, correo) VALUES
  (1, 'Alex', 'alex@example.com'),
  (2, 'María', 'maria@example.com'),
  (3, 'Daniela Ruiz', 'daniela.ruiz@example.com'),
  (4, 'Carlos Mendoza', 'carlos.mendoza@example.com'),
  (5, 'Lucía Torres', 'lucia.torres@example.com'),
  (6, 'Miguel Herrera', 'miguel.herrera@example.com'),
  (7, 'Sofía Castro', 'sofia.castro@example.com'),
  (8, 'Diego Flores', 'diego.flores@example.com'),
  (9, 'Valeria Ortiz', 'valeria.ortiz@example.com'),
  (10, 'Javier Morales', 'javier.morales@example.com'),
  (11, 'Camila Reyes', 'camila.reyes@example.com'),
  (12, 'Andrés Navarro', 'andres.navarro@example.com'),
  (13, 'Fernanda Silva', 'fernanda.silva@example.com'),
  (14, 'Ricardo Cruz', 'ricardo.cruz@example.com'),
  (15, 'Elena Vega', 'elena.vega@example.com'),
  (16, 'Gabriel Rojas', 'gabriel.rojas@example.com'),
  (17, 'Natalia Jiménez', 'natalia.jimenez@example.com'),
  (18, 'Emilio Vargas', 'emilio.vargas@example.com'),
  (19, 'Paola Delgado', 'paola.delgado@example.com'),
  (20, 'Mateo Campos', 'mateo.campos@example.com'),
  (21, 'Renata Luna', 'renata.luna@example.com'),
  (22, 'Samuel Ortega', 'samuel.ortega@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO productos (id, nombre, descripcion, precio, stock, maestro_id) VALUES
  (1, 'Teclado mecánico', 'Teclado USB para oficina', 899.00, 12, 1),
  (2, 'Mouse inalámbrico', 'Mouse óptico', 349.50, 25, 1),
  (3, 'Monitor 24 pulgadas', 'Monitor Full HD', 2899.00, 7, 2)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('maestros', 'id'), GREATEST((SELECT MAX(id) FROM maestros), 1));
SELECT setval(pg_get_serial_sequence('productos', 'id'), GREATEST((SELECT MAX(id) FROM productos), 1));

