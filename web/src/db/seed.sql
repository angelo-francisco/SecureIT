-- Admin
INSERT INTO AdminUser (id, email, passwordHash, createdAt)
VALUES ('admin-001', 'admin@secureit.com', '$2b$12$uw/SYHkEWL1aVO82pPcbfut2Z7/e/aB1r5LTyw1IW8LEOWtRIwdBG', '2026-07-29T00:00:00.000Z');

-- Plan
INSERT INTO Plan (id, name, description, basePrice, currency, durationDays, isActive, isDefault, createdAt, updatedAt)
VALUES ('plan-licenca-001', 'Licença', 'Acesso completo a todas as funcionalidades do SecureIT', 81.27, 'USD', 30, 1, 1, '2026-07-29T00:00:00.000Z', '2026-07-29T00:00:00.000Z');

-- Features
INSERT INTO PlanFeature (id, planId, name, description, price, isActive, createdAt)
VALUES
('pf-licenca-001', 'plan-licenca-001', 'Análise Comportamental', 'Análise avançada de comportamento em tempo real', 0, 1, '2026-07-29T00:00:00.000Z'),
('pf-licenca-002', 'plan-licenca-001', 'Cloud Storage', 'Armazenamento de gravações na cloud', 0, 1, '2026-07-29T00:00:00.000Z'),
('pf-licenca-003', 'plan-licenca-001', 'Tunnel de Acesso Remoto', 'Acesso remoto seguro às suas câmeras', 0, 1, '2026-07-29T00:00:00.000Z');
