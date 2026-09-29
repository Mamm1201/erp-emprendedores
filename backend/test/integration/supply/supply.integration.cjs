/* eslint-disable */
// Pruebas de integracion — Linea de Suministro (SUPPLY)
// Contrato: docs/domain/supply-line-contract-v1.0.md
//
// Ejecuta los servicios reales de NestJS (build de `nest build`) contra una
// base DESECHABLE. Aborta si la base no se llama `erp_it_*`: nunca debe correr
// contra la base real. Ver README.md de esta carpeta.
//
//   cd backend && npm run build
//   DATABASE_URL=postgresql://.../erp_it_supply node test/integration/supply/supply.integration.cjs

const path = require('path');

const DIST = process.env.DIST_DIR
  ? path.resolve(process.env.DIST_DIR)
  : path.resolve(__dirname, '../../../dist/src');
const mod = (p) => require(path.join(DIST, p));

const results = [];
const ok = (name, cond, detail = '') => {
  results.push(!!cond);
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};
async function expectError(name, fn, re) {
  try { await fn(); ok(name, false, 'no lanzo error'); }
  catch (e) { ok(name, re.test(e.message), e.message); }
}

(async () => {
  const { NestFactory } = require('@nestjs/core');
  const { validate } = require('class-validator');
  const { plainToInstance } = require('class-transformer');
  const { AppModule } = mod('app.module');
  const { PrismaService } = mod('prisma/prisma.service');
  const { ClientsService } = mod('modules/clients/clients.service');
  const { AccountsService } = mod('modules/accounts/accounts.service');
  const { OpportunitiesService } = mod('modules/opportunities/opportunities.service');
  const { QuotationsService } = mod('modules/quotations/quotations.service');
  const { WorkOrdersService } = mod('modules/work-orders/work-orders.service');
  const { CreateWorkOrderDto } = mod('modules/work-orders/dto/create-work-order.dto');
  const { ServiceRecordsService } = mod('modules/service-records/service-records.service');
  const { InvoicesService } = mod('modules/invoices/invoices.service');
  const { MaintenanceContractsService } = mod('modules/maintenance-contracts/maintenance-contracts.service');
  const { MaintenancePlansService } = mod('modules/maintenance-plans/maintenance-plans.service');
  const { PublicService } = mod('modules/public/public.service');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const prisma = app.get(PrismaService);
  const [{ db }] = await prisma.$queryRawUnsafe('SELECT current_database() AS db');
  if (!String(db).startsWith('erp_it_')) {
    console.error(`ABORT: la base "${db}" no es desechable (se exige prefijo erp_it_)`);
    process.exit(2);
  }
  console.log('Base:', db);

  const clients = app.get(ClientsService);
  const accounts = app.get(AccountsService);
  const opportunities = app.get(OpportunitiesService);
  const quotations = app.get(QuotationsService);
  const wos = app.get(WorkOrdersService);
  const records = app.get(ServiceRecordsService);
  const invoices = app.get(InvoicesService);
  const contracts = app.get(MaintenanceContractsService);
  const plans = app.get(MaintenancePlansService);
  const pub = app.get(PublicService);

  const userId = (await prisma.user.findFirst({ where: { isActive: true }, select: { id: true } })).id;
  const tag = `IT-${Date.now()}`;
  // Fecha de negocio (Bogota), no UTC: el backend rechaza fechas futuras.
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
  const toStatus = async (id, ...ss) => { for (const s of ss) await wos.updateStatus(id, { status: s }); };

  // ── C1: alta de cliente -> sede Principal ────────────────────────────────
  const client = await clients.create({ legalName: `Consultorios XXX ${tag}`, type: 'COMPANY' });
  const branches = await prisma.branch.findMany({ where: { clientId: client.id } });
  ok('C1 cliente nuevo nace con 1 sede "Principal" marcada como principal',
    branches.length === 1 && branches[0].name === 'Principal' && branches[0].isPrimary);
  const principal = branches[0];

  // ── C1 CRM: promocion de cuenta -> cliente con Principal (ciudad de la cuenta)
  const account = await accounts.create(
    { legalName: `Cuenta CRM ${tag}`, city: 'Medellín', institutionType: 'CLINIC', source: 'REFERRAL' }, userId);
  const opp = await opportunities.create(account.id, { title: `Opp ${tag}`, source: 'REFERRAL' }, userId);
  await opportunities.generateQuotation(account.id, opp.id,
    { items: [{ description: 'Módulo', quantity: 1, unitPrice: 100000 }] }, userId);
  const promoted = await prisma.account.findUnique({ where: { id: account.id }, select: { promotedClientId: true } });
  const crmBranches = await prisma.branch.findMany({ where: { clientId: promoted.promotedClientId } });
  ok('C1 CRM: cliente promovido nace con "Principal" y la ciudad de la cuenta',
    crmBranches.length === 1 && crmBranches[0].name === 'Principal' && crmBranches[0].isPrimary && crmBranches[0].city === 'Medellín');

  // ── S1: validacion del tipo en el DTO (PREVENTIVE reservado) ─────────────
  const errsPrev = await validate(plainToInstance(CreateWorkOrderDto, { clientId: client.id, title: 'x', type: 'PREVENTIVE' }));
  ok('S1 PREVENTIVE se rechaza al crear/convertir una OT', errsPrev.some((e) => e.property === 'type'));
  const errsSupply = await validate(plainToInstance(CreateWorkOrderDto, { clientId: client.id, title: 'x', type: 'SUPPLY' }));
  ok('S1 SUPPLY se acepta en el DTO', errsSupply.length === 0);

  // ── S3/S4: conversion cotizacion -> OT SUPPLY ────────────────────────────
  const quote = await quotations.create({
    clientId: client.id,
    items: [
      { description: 'Módulo inalámbrico + mando + lámpara + alerta', quantity: 1, unitPrice: 500000 },
      { description: 'Instalación', quantity: 1, unitPrice: 0 },
    ],
  }, userId);
  const wo = await wos.create({ clientId: client.id, quotationId: quote.id, type: 'SUPPLY', title: `${quote.number} — Consultorios XXX` }, userId);
  const woFull = await wos.findOne(wo.id);
  const q2 = await prisma.quotation.findUnique({ where: { id: quote.id }, select: { status: true } });
  ok('S4 conversion conserva quotationId y la cotizacion pasa a CONVERTED', woFull.quotationId === quote.id && q2.status === 'CONVERTED');
  ok('S3 sin sede indicada -> sede principal del cliente', woFull.branchId === principal.id);
  ok('S1 OT creada con type SUPPLY y expuesto en la respuesta', woFull.type === 'SUPPLY');
  ok('S4 OT hereda las 2 lineas (incluida instalacion $0)',
    woFull.items.length === 2 && woFull.items.some((i) => Number(i.lineTotal) === 0));

  // ── S3: OT SUPPLY sin sede resoluble -> 400 ──────────────────────────────
  const legacy = await prisma.client.create({ data: { legalName: `Legado sin sede ${tag}` } }); // cliente previo a C1
  await expectError('S3 OT SUPPLY para cliente sin sedes se rechaza',
    () => wos.create({ clientId: legacy.id, type: 'SUPPLY', title: 'x' }, userId), /requiere una sede/);
  const legacyWo = await wos.create({ clientId: legacy.id, title: 'Correctivo sin sede' }, userId);
  ok('Regresion: OT sin tipo sigue naciendo CORRECTIVE (y sin sede si el cliente no tiene)',
    legacyWo.type === 'CORRECTIVE' && legacyWo.branchId === null);

  // ── S3: la resolucion automatica de sede es SOLO de SUPPLY ───────────────
  const north = await prisma.branch.create({ data: { clientId: client.id, name: `Sede Norte ${tag}` } });
  const corrNoBranch = await wos.create({ clientId: client.id, type: 'CORRECTIVE', title: 'Correctivo sin sede' }, userId);
  const inspNoBranch = await wos.create({ clientId: client.id, type: 'INSPECTION', title: 'Inspeccion sin sede' }, userId);
  ok('Regresion: CORRECTIVE/INSPECTION sin sede indicada quedan sin sede (cliente con Principal)',
    corrNoBranch.branchId === null && inspNoBranch.branchId === null);
  const corrExplicit = await wos.create({ clientId: client.id, type: 'CORRECTIVE', branchId: north.id, title: 'Correctivo con sede' }, userId);
  ok('Regresion: CORRECTIVE con sede indicada la conserva', corrExplicit.branchId === north.id);
  const quoteNorthC = await quotations.create({ clientId: client.id, branchId: north.id,
    items: [{ description: 'Revision', quantity: 1, unitPrice: 1000 }] }, userId);
  const corrFromQuote = await wos.create({ clientId: client.id, quotationId: quoteNorthC.id, type: 'CORRECTIVE', title: 'Correctivo desde COT' }, userId);
  ok('Regresion: CORRECTIVE desde cotizacion con sede no hereda sede automaticamente', corrFromQuote.branchId === null);
  const quoteNorthS = await quotations.create({ clientId: client.id, branchId: north.id,
    items: [{ description: 'Periferico', quantity: 1, unitPrice: 1000 }] }, userId);
  const supplyFromQuote = await wos.create({ clientId: client.id, quotationId: quoteNorthS.id, type: 'SUPPLY', title: 'Suministro desde COT' }, userId);
  ok('S3 SUPPLY sin sede indicada -> sede de la cotizacion (antes que la principal)', supplyFromQuote.branchId === north.id);

  // ── S5/S6/S7: acta SUPPLY con 2 equipos nuevos ───────────────────────────
  const eqBefore = await prisma.equipment.count({ where: { branchId: principal.id } });
  await records.create(wo.id, {
    interventions: [
      { newEquipment: { type: 'MEDICAL_ALERT', brand: 'STECH NODES', model: 'Módulo inalámbrico', serialNumber: `SN-${tag}-1`,
                        installDate: today, notes: 'Incluye mando, lámpara de pasillo y alerta audiovisual' },
        occurredAt: today, activitiesPerformed: 'Suministro e instalación del módulo' },
      { newEquipment: { type: 'OTHER', brand: 'Motorola', model: 'Radio UHF', serialNumber: `SN-${tag}-2`, installDate: today,
                        warrantyExpiresAt: '2027-09-28' },
        occurredAt: today, activitiesPerformed: 'Suministro sin instalación' },
    ],
  });
  const newEq = await prisma.equipment.findMany({ where: { branchId: principal.id }, orderBy: { serialNumber: 'asc' } });
  const ivs = await prisma.intervention.findMany({ where: { workOrderId: wo.id }, include: { checklistItems: true } });
  ok('S5 se crean 2 Equipment en cliente + sede de la OT, con QR', newEq.length === eqBefore + 2 && newEq.every((e) => e.qrCode));
  ok('S5 installDate = fecha de entrega; garantia solo si se ingresa',
    newEq.every((e) => e.installDate && e.installDate.toISOString().slice(0, 10) === today) &&
    newEq.filter((e) => e.warrantyExpiresAt).length === 1);
  ok('S9 2 intervenciones SUPPLY sobre los equipos nuevos', ivs.length === 2 && ivs.every((i) => i.type === 'SUPPLY'));
  ok('S7 intervenciones SUPPLY sin checklist de mantenimiento', ivs.every((i) => i.checklistItems.length === 0));

  // ── S6: validaciones de equipo ───────────────────────────────────────────
  await expectError('S6 equipo existente y nuevo a la vez se rechaza',
    () => records.addInterventions(wo.id, { interventions: [{ equipmentId: newEq[0].id, newEquipment: { type: 'OTHER' } }] }), /no ambos/);
  await expectError('S6 intervencion sin equipo se rechaza',
    () => records.addInterventions(wo.id, { interventions: [{ occurredAt: today }] }), /no ambos/);

  // ── S5: "Nuevo equipo" solo en OTs SUPPLY ────────────────────────────────
  const corrective = await wos.create({ clientId: client.id, title: `Correctivo ${tag}` }, userId);
  await expectError('S5 equipo nuevo en OT no SUPPLY se rechaza',
    () => records.create(corrective.id, { interventions: [{ newEquipment: { type: 'OTHER' } }] }), /Solo una OT de Suministro/);

  // ── Regresion: correctivo sigue con checklist ─────────────────────────────
  const nurse = await prisma.equipment.findFirst({ where: { type: 'NURSE_CALL', deletedAt: null, branch: { clientId: { not: client.id } } }, select: { id: true, branchId: true, branch: { select: { clientId: true } } } });
  if (nurse) {
    const corr2 = await wos.create({ clientId: nurse.branch.clientId, branchId: nurse.branchId, title: `Correctivo checklist ${tag}` }, userId);
    await records.create(corr2.id, { interventions: [{ equipmentId: nurse.id, occurredAt: today }] });
    const civ = await prisma.intervention.findFirst({ where: { workOrderId: corr2.id }, include: { checklistItems: true } });
    ok('Regresion: intervencion CORRECTIVE conserva el checklist estandar', civ.type === 'CORRECTIVE' && civ.checklistItems.length > 0);

    // ── Periferico incorporado a un equipo existente (SUPPLY sobre existente)
    const eqCountBefore = await prisma.equipment.count();
    const periph = await wos.create({ clientId: nurse.branch.clientId, branchId: nurse.branchId, type: 'SUPPLY', title: `Lámpara de pasillo ${tag}` }, userId);
    await records.create(periph.id, { interventions: [{ equipmentId: nurse.id, occurredAt: today,
      activitiesPerformed: 'Suministro e integración de lámpara de pasillo nueva' }] });
    const piv = await prisma.intervention.findFirst({ where: { workOrderId: periph.id } });
    ok('Periferico: intervencion SUPPLY sobre el equipo existente, sin crear otro Equipment',
      piv.type === 'SUPPLY' && piv.equipmentId === nurse.id && (await prisma.equipment.count()) === eqCountBefore);
  } else {
    ok('Regresion/periferico: se requiere un NURSE_CALL existente en la base', false, 'no encontrado');
  }

  // ── S8: cierre (>= 1 intervencion) y cuenta de cobro con instalacion $0 ──
  const emptySupply = await wos.create({ clientId: client.id, type: 'SUPPLY', title: `Suministro vacio ${tag}` }, userId);
  await toStatus(emptySupply.id, 'SCHEDULED', 'IN_PROGRESS');
  await expectError('S8 OT SUPPLY sin intervenciones no se puede completar (regla sin cambios)',
    () => wos.updateStatus(emptySupply.id, { status: 'COMPLETED' }), /al menos una intervenci/);

  await toStatus(wo.id, 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED');
  const inv = await invoices.create({ workOrderId: wo.id, dueDate: '2026-10-28' }, userId);
  ok('Facturacion: CC desde OT SUPPLY con 2 lineas (instalacion $0) y total 500.000',
    inv.items.length === 2 && Number(inv.total) === 500000);

  // ── QR: SUPPLY no cuenta como mantenimiento ──────────────────────────────
  const qr = await pub.findEquipmentByQrCode(newEq[0].qrCode);
  ok('QR: equipo recien suministrado sin "ultimo mantenimiento" (SUPPLY no cuenta)', qr.lastMaintenance === null, JSON.stringify({ rel: qr.relationshipStatus }));
  ok('QR: muestra fecha de entrega (installDate)', qr.installDate === today);

  // ── Hoja de Vida (API): la entrega aparece en el historial ───────────────
  const hist = await records.findByEquipment(newEq[0].id);
  ok('Hoja de Vida: la intervencion SUPPLY aparece en el historial del equipo', hist.data.some((h) => h.type === 'SUPPLY'));

  // ── Mantenimiento posterior sin duplicar el Equipment ────────────────────
  const eqTotal = await prisma.equipment.count();
  const contract = await contracts.create({ clientId: client.id, billingCycle: 'ANNUAL', value: 1200000,
    startDate: '2026-09-01', endDate: '2027-09-01' });
  await contracts.attachEquipment(contract.id, { equipmentId: newEq[0].id });
  const plan = await plans.create({ contractId: contract.id, branchId: principal.id, frequency: 'QUARTERLY', firstPeriodStart: '2026-09-01' });
  await plans.attachEquipment(plan.id, { equipmentId: newEq[0].id });
  const visitItems = await prisma.maintenanceVisitEquipment.findMany({ where: { equipmentId: newEq[0].id } });
  ok('Mantenimiento posterior: el mismo Equipment entra al contrato y al plan (visitas) sin duplicarse',
    visitItems.length > 0 && (await prisma.equipment.count()) === eqTotal);

  await app.close();
  const failed = results.filter((r) => !r).length;
  console.log(`\n${results.length - failed}/${results.length} verificaciones SUPPLY OK`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('ERROR', e); process.exit(1); });
