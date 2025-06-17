#!/usr/bin/env node

/**
 * Script para verificar URLs hardcodeadas en el proyecto
 * Uso: node scripts/check-hardcoded-urls.js
 */

const fs = require('fs');
const path = require('path');

// Patrones a buscar
const patterns = [
  /http:\/\/localhost/gi,
  /https:\/\/localhost/gi,
  /localhost:\d+/gi,
  /127\.0\.0\.1/gi,
  /http:\/\/\d+\.\d+\.\d+\.\d+/gi,
];

// Directorios y archivos a ignorar
const ignorePaths = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.env',
  '.env.example',
  '.env.production',
  'package-lock.json',
  'DEPLOYMENT.md',
  'check-hardcoded-urls.js'
];

// Extensiones de archivo a verificar
const validExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.html'];

let foundIssues = [];

function checkFile(filePath) {
  const ext = path.extname(filePath);
  if (!validExtensions.includes(ext)) return;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      patterns.forEach(pattern => {
        const matches = line.match(pattern);
        if (matches) {
          foundIssues.push({
            file: filePath,
            line: index + 1,
            content: line.trim(),
            match: matches[0]
          });
        }
      });
    });
  } catch (error) {
    console.error(`Error leyendo archivo ${filePath}:`, error.message);
  }
}

function scanDirectory(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      // Verificar si debemos ignorar este path
      if (ignorePaths.some(ignore => filePath.includes(ignore))) {
        return;
      }
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else {
        checkFile(filePath);
      }
    });
  } catch (error) {
    console.error(`Error escaneando directorio ${dir}:`, error.message);
  }
}

// Ejecutar el escaneo
console.log('🔍 Buscando URLs hardcodeadas...\n');
scanDirectory('.');

// Mostrar resultados
if (foundIssues.length === 0) {
  console.log('✅ No se encontraron URLs hardcodeadas!\n');
} else {
  console.log(`❌ Se encontraron ${foundIssues.length} URLs hardcodeadas:\n`);
  
  foundIssues.forEach(issue => {
    console.log(`📄 ${issue.file}:${issue.line}`);
    console.log(`   Encontrado: "${issue.match}"`);
    console.log(`   Línea: ${issue.content}`);
    console.log('');
  });
  
  console.log('\n💡 Recomendaciones:');
  console.log('1. Usa variables de entorno para URLs configurables');
  console.log('2. Para Vite: usa import.meta.env.VITE_*');
  console.log('3. Para Node.js: usa process.env.*');
  console.log('4. Revisa DEPLOYMENT.md para más información\n');
}

// Salir con código de error si hay problemas
process.exit(foundIssues.length > 0 ? 1 : 0);
