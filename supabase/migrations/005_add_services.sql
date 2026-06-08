-- Adiciona campo de serviços contratados ao cliente
-- Preenchido durante o onboarding (step 6)
-- Valores: 'traffic' (Tráfego Pago), 'content' (Gestão de Conteúdo)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS services text[] DEFAULT '{}';
