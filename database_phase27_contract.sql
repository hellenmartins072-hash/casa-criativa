-- Adicionar campos de configuração de contrato na tabela settings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='contract_text') THEN
    ALTER TABLE public.settings ADD COLUMN contract_text TEXT DEFAULT 'As partes declaram estar de acordo com todas as cláusulas e condições estabelecidas neste instrumento. Em caso de desistência por parte do CONTRATANTE após o início da confecção, os valores já pagos a título de sinal não serão reembolsados, servindo para cobrir custos de material e hora técnica.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='contract_image_url') THEN
    ALTER TABLE public.settings ADD COLUMN contract_image_url TEXT;
  END IF;
END $$;
