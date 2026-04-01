#!/bin/bash

# Este script fará o backup do banco de dados do projeto Guardião (Controle-UDV) contornando a segurança RLS.

echo "🔒 Baixando como Administrador (Postgres Role)..."
echo "Para contornar o bloqueio de segurança do Supabase e baixar os dados, preciso da sua senha Mestra do Banco de Dados."
echo "(A senha que você criou junto com o projeto lá no começo, não o token do navegador)."
echo ""

read -s -p "🔑 Cole a senha do banco de dados e aperte Enter: " DBPASS
echo ""
echo ""

echo "📦 [1/2] Baixando a estrutura do banco (Tabelas, RLS, Configurações)..."
npx supabase db dump -p "$DBPASS" > schema_backup.sql

echo "📦 [2/2] Baixando todos os dados reais gravados (Linhas da tabela)..."
npx supabase db dump --data-only -p "$DBPASS" > data_backup.sql

echo "✅ BKP CONCLUÍDO de verdade! "
echo "- Estrutura salva em: schema_backup.sql"
echo "- Dados salvos em: data_backup.sql (Pode abrir para checar o tamanho!)"
