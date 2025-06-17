#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de puertos...\n');

// Archivos a verificar
const filesToCheck = [
  '.env',
  '.env.example',
  '.env.production',
  'server/config.js',
  'server/server.js',
  'vite.config.ts',
  'src/providers/dataProvider.ts',
  'src/providers/authProvider.ts',
];

// Función para verificar archivos
function checkFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  ${filePath} - No encontrado`);
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  let hasIssue = false;
  
  lines.forEach((line, index) => {
    if (line.includes('8080') && !line.includes('//') && !line.includes('*')) {
      console.log(`❌ ${filePath}:${index + 1} - Referencia a puerto 8080 encontrada`);
      console.log(`   ${line.trim()}`);
      hasIssue = true;
    }
  });
  
  if (!hasIssue) {
    console.log(`✅ ${filePath} - OK`);
  }
}

// Verificar cada archivo
filesToCheck.forEach(checkFile);

// Verificar la variable de entorno actual
console.log('\n📋 Variables de entorno actuales:');
console.log(`   VITE_API_URL: ${process.env.VITE_API_URL || 'No definida'}`);
console.log(`   PORT: ${process.env.PORT || 'No definida'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'No definida'}`);

// Leer el archivo .env actual
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const apiUrlMatch = envContent.match(/VITE_API_URL=(.+)/);
  if (apiUrlMatch) {
    console.log(`\n🔧 VITE_API_URL en .env: ${apiUrlMatch[1]}`);
    if (apiUrlMatch[1].includes('3001')) {
      console.log('✅ Puerto configurado correctamente para desarrollo');
    } else {
      console.log('❌ Puerto incorrecto - debería ser http://localhost:3001');
    }
  }
}

console.log('\n✨ Verificación completada');
