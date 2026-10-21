-- Agrega 20 maestros de prueba a una base ya inicializada.
-- Seguro de volver a ejecutar: ignora conflictos de claves únicas.
INSERT INTO maestros (id, nombre, correo) VALUES
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
ON CONFLICT DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('maestros', 'id'),
  GREATEST((SELECT MAX(id) FROM maestros), 1)
);
