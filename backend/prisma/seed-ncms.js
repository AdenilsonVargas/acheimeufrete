import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega NCMs do MERCOSUL a partir do JSON extraído
const ncmsFilePath = path.join(__dirname, '../src/data/ncms-mercosul.json');
const ncmsData = JSON.parse(fs.readFileSync(ncmsFilePath, 'utf-8'));

const prisma = new PrismaClient();

function inferCaracteristicas(descricao) {
  const d = descricao.toLowerCase();
  const flags = [];
  if (d.includes('explosiv')) flags.push('explosivo');
  if (d.includes('quím') || d.includes('quim')) flags.push('quimico');
  if (d.includes('radioat')) flags.push('radioativo');
  if (d.includes('perec')) flags.push('perecivel');
  if (d.includes('líquido') || d.includes('liquido')) flags.push('liquido');
  if (d.includes('gás') || d.includes('gas')) flags.push('gasoso');
  if (d.includes('frágil') || d.includes('fragil')) flags.push('fragil');
  if (d.includes('vivo') || d.includes('animais')) flags.push('animal_vivo');
  if (d.includes('bebida') || d.includes('suco')) flags.push('bebida');
  if (d.includes('carne')) flags.push('perecivel');
  return Array.from(new Set(flags));
}

async function main() {
  console.log('📥 Importando NCMs MERCOSUL para o banco...');

  // Deduplica por código e prepara payload
  const map = new Map();
  for (const item of ncmsData) {
    const codigo = String(item.codigo).replace(/\D/g, '');
    if (!/^\d{8}$/.test(codigo)) continue;
    if (!map.has(codigo)) {
      const descricao = item.descricao?.trim() || '';
      map.set(codigo, {
        codigo,
        descricao,
        classificacao: descricao,
        caracteristicas: inferCaracteristicas(descricao)
      });
    }
  }

  const lista = Array.from(map.values());
  console.log(`✅ Encontrados ${lista.length} NCMs únicos do MERCOSUL.`);

  // Upsert em lotes para eficiência
  const batchSize = 500;
  for (let i = 0; i < lista.length; i += batchSize) {
    const chunk = lista.slice(i, i + batchSize);
    await Promise.all(
      chunk.map((n) =>
        prisma.nCM.upsert({
          where: { codigo: n.codigo },
          update: {
            descricao: n.descricao,
            classificacao: n.classificacao,
            caracteristicas: n.caracteristicas,
            updatedAt: new Date(),
          },
          create: {
            codigo: n.codigo,
            descricao: n.descricao,
            classificacao: n.classificacao,
            caracteristicas: n.caracteristicas,
          },
        })
      )
    );
    console.log(`✔️ Upsert ${Math.min(i + batchSize, lista.length)}/${lista.length}`);
  }

  console.log('✅ Seed de NCMs concluído.');
}

main()
  .catch((e) => {
    console.error('❌ Erro seed NCMs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
