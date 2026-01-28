import Account from '../models/Account';

/**
 * Seed Chart of Accounts - Catálogo de Cuentas Mexicano
 *
 * Estructura basada en NIF (Normas de Información Financiera) mexicanas
 * 1000 - Activo
 * 2000 - Pasivo
 * 3000 - Capital/Patrimonio
 * 4000 - Ingresos
 * 5000 - Gastos
 */
export const seedChartOfAccounts = async (): Promise<void> => {
  try {
    // Check if accounts already exist
    const existing = await Account.count();
    if (existing > 0) {
      console.log('✓ Chart of Accounts already exists, skipping...');
      return;
    }

    console.log('📝 Seeding Chart of Accounts...');

    // ============================================
    // 1000 - ACTIVO
    // ============================================
    const activo = await Account.create({
      accountCode: '1000',
      accountName: 'Activo',
      accountType: 'asset',
      balance: 0,
      description: 'Recursos controlados por la entidad',
      isActive: true,
    });

    // 1100 - Activo Circulante
    const activoCirculante = await Account.create({
      accountCode: '1100',
      accountName: 'Activo Circulante',
      accountType: 'asset',
      parentAccountId: activo.id,
      balance: 0,
      description: 'Activos líquidos o que se convertirán en efectivo en el corto plazo',
      isActive: true,
    });

    await Account.bulkCreate([
      {
        accountCode: '1110',
        accountName: 'Caja',
        accountType: 'asset',
        parentAccountId: activoCirculante.id,
        balance: 0,
        description: 'Efectivo en caja chica',
        isActive: true,
      },
      {
        accountCode: '1120',
        accountName: 'Bancos',
        accountType: 'asset',
        parentAccountId: activoCirculante.id,
        balance: 0,
        description: 'Dinero en cuentas bancarias',
        isActive: true,
      },
      {
        accountCode: '1130',
        accountName: 'Clientes',
        accountType: 'asset',
        parentAccountId: activoCirculante.id,
        balance: 0,
        description: 'Cuentas por cobrar a clientes',
        isActive: true,
      },
      {
        accountCode: '1140',
        accountName: 'Documentos por Cobrar',
        accountType: 'asset',
        parentAccountId: activoCirculante.id,
        balance: 0,
        description: 'Pagarés y documentos por cobrar',
        isActive: true,
      },
      {
        accountCode: '1150',
        accountName: 'IVA por Acreditar',
        accountType: 'asset',
        parentAccountId: activoCirculante.id,
        balance: 0,
        description: 'IVA pagado pendiente de acreditar',
        isActive: true,
      },
      {
        accountCode: '1160',
        accountName: 'Anticipos a Proveedores',
        accountType: 'asset',
        parentAccountId: activoCirculante.id,
        balance: 0,
        description: 'Pagos adelantados a proveedores',
        isActive: true,
      },
    ]);

    // 1200 - Activo Fijo (No Circulante)
    const activoFijo = await Account.create({
      accountCode: '1200',
      accountName: 'Activo Fijo',
      accountType: 'asset',
      parentAccountId: activo.id,
      balance: 0,
      description: 'Bienes tangibles de larga duración',
      isActive: true,
    });

    await Account.bulkCreate([
      {
        accountCode: '1210',
        accountName: 'Vehículos',
        accountType: 'asset',
        parentAccountId: activoFijo.id,
        balance: 0,
        description: 'Flota de vehículos para renta',
        isActive: true,
      },
      {
        accountCode: '1220',
        accountName: 'Equipo de Transporte',
        accountType: 'asset',
        parentAccountId: activoFijo.id,
        balance: 0,
        description: 'Otro equipo de transporte',
        isActive: true,
      },
      {
        accountCode: '1230',
        accountName: 'Equipo de Cómputo',
        accountType: 'asset',
        parentAccountId: activoFijo.id,
        balance: 0,
        description: 'Computadoras y equipo tecnológico',
        isActive: true,
      },
      {
        accountCode: '1240',
        accountName: 'Mobiliario y Equipo de Oficina',
        accountType: 'asset',
        parentAccountId: activoFijo.id,
        balance: 0,
        description: 'Muebles y equipamiento de oficinas',
        isActive: true,
      },
      {
        accountCode: '1250',
        accountName: 'Edificios',
        accountType: 'asset',
        parentAccountId: activoFijo.id,
        balance: 0,
        description: 'Inmuebles propiedad de la empresa',
        isActive: true,
      },
      {
        accountCode: '1260',
        accountName: 'Depreciación Acumulada',
        accountType: 'asset',
        parentAccountId: activoFijo.id,
        balance: 0,
        description: 'Depreciación acumulada de activos fijos (cuenta complementaria)',
        isActive: true,
      },
    ]);

    // ============================================
    // 2000 - PASIVO
    // ============================================
    const pasivo = await Account.create({
      accountCode: '2000',
      accountName: 'Pasivo',
      accountType: 'liability',
      balance: 0,
      description: 'Obligaciones presentes de la entidad',
      isActive: true,
    });

    // 2100 - Pasivo Circulante
    const pasivoCirculante = await Account.create({
      accountCode: '2100',
      accountName: 'Pasivo Circulante',
      accountType: 'liability',
      parentAccountId: pasivo.id,
      balance: 0,
      description: 'Obligaciones a corto plazo (menos de 1 año)',
      isActive: true,
    });

    await Account.bulkCreate([
      {
        accountCode: '2110',
        accountName: 'Proveedores',
        accountType: 'liability',
        parentAccountId: pasivoCirculante.id,
        balance: 0,
        description: 'Cuentas por pagar a proveedores',
        isActive: true,
      },
      {
        accountCode: '2120',
        accountName: 'Acreedores Diversos',
        accountType: 'liability',
        parentAccountId: pasivoCirculante.id,
        balance: 0,
        description: 'Otras cuentas por pagar',
        isActive: true,
      },
      {
        accountCode: '2130',
        accountName: 'IVA por Pagar',
        accountType: 'liability',
        parentAccountId: pasivoCirculante.id,
        balance: 0,
        description: 'IVA cobrado pendiente de pago al SAT',
        isActive: true,
      },
      {
        accountCode: '2140',
        accountName: 'ISR por Pagar',
        accountType: 'liability',
        parentAccountId: pasivoCirculante.id,
        balance: 0,
        description: 'Impuesto sobre la renta por pagar',
        isActive: true,
      },
      {
        accountCode: '2150',
        accountName: 'Retenciones por Pagar',
        accountType: 'liability',
        parentAccountId: pasivoCirculante.id,
        balance: 0,
        description: 'Retenciones de impuestos por enterar',
        isActive: true,
      },
      {
        accountCode: '2160',
        accountName: 'Sueldos por Pagar',
        accountType: 'liability',
        parentAccountId: pasivoCirculante.id,
        balance: 0,
        description: 'Nómina pendiente de pago',
        isActive: true,
      },
      {
        accountCode: '2170',
        accountName: 'Cuotas IMSS por Pagar',
        accountType: 'liability',
        parentAccountId: pasivoCirculante.id,
        balance: 0,
        description: 'Cuotas al Instituto Mexicano del Seguro Social',
        isActive: true,
      },
      {
        accountCode: '2180',
        accountName: 'Anticipos de Clientes',
        accountType: 'liability',
        parentAccountId: pasivoCirculante.id,
        balance: 0,
        description: 'Pagos adelantados recibidos de clientes',
        isActive: true,
      },
    ]);

    // 2200 - Pasivo a Largo Plazo
    const pasivoLargoPlazo = await Account.create({
      accountCode: '2200',
      accountName: 'Pasivo a Largo Plazo',
      accountType: 'liability',
      parentAccountId: pasivo.id,
      balance: 0,
      description: 'Obligaciones con vencimiento mayor a 1 año',
      isActive: true,
    });

    await Account.bulkCreate([
      {
        accountCode: '2210',
        accountName: 'Préstamos Bancarios LP',
        accountType: 'liability',
        parentAccountId: pasivoLargoPlazo.id,
        balance: 0,
        description: 'Créditos bancarios a largo plazo',
        isActive: true,
      },
      {
        accountCode: '2220',
        accountName: 'Documentos por Pagar LP',
        accountType: 'liability',
        parentAccountId: pasivoLargoPlazo.id,
        balance: 0,
        description: 'Pagarés y documentos a largo plazo',
        isActive: true,
      },
    ]);

    // ============================================
    // 3000 - CAPITAL / PATRIMONIO
    // ============================================
    const capital = await Account.create({
      accountCode: '3000',
      accountName: 'Capital',
      accountType: 'equity',
      balance: 0,
      description: 'Participación de los propietarios en la entidad',
      isActive: true,
    });

    await Account.bulkCreate([
      {
        accountCode: '3100',
        accountName: 'Capital Social',
        accountType: 'equity',
        parentAccountId: capital.id,
        balance: 0,
        description: 'Aportaciones de los socios',
        isActive: true,
      },
      {
        accountCode: '3200',
        accountName: 'Utilidades Retenidas',
        accountType: 'equity',
        parentAccountId: capital.id,
        balance: 0,
        description: 'Utilidades acumuladas de ejercicios anteriores',
        isActive: true,
      },
      {
        accountCode: '3300',
        accountName: 'Utilidad del Ejercicio',
        accountType: 'equity',
        parentAccountId: capital.id,
        balance: 0,
        description: 'Utilidad o pérdida del ejercicio en curso',
        isActive: true,
      },
      {
        accountCode: '3400',
        accountName: 'Reserva Legal',
        accountType: 'equity',
        parentAccountId: capital.id,
        balance: 0,
        description: 'Reserva obligatoria según legislación mexicana (5% anual)',
        isActive: true,
      },
    ]);

    // ============================================
    // 4000 - INGRESOS
    // ============================================
    const ingresos = await Account.create({
      accountCode: '4000',
      accountName: 'Ingresos',
      accountType: 'income',
      balance: 0,
      description: 'Incrementos en los beneficios económicos',
      isActive: true,
    });

    await Account.bulkCreate([
      {
        accountCode: '4100',
        accountName: 'Ingresos por Renta de Vehículos',
        accountType: 'income',
        parentAccountId: ingresos.id,
        balance: 0,
        description: 'Ingreso principal del negocio',
        isActive: true,
      },
      {
        accountCode: '4200',
        accountName: 'Ingresos por Seguro',
        accountType: 'income',
        parentAccountId: ingresos.id,
        balance: 0,
        description: 'Cobros por seguro de vehículos',
        isActive: true,
      },
      {
        accountCode: '4300',
        accountName: 'Ingresos por Accesorios',
        accountType: 'income',
        parentAccountId: ingresos.id,
        balance: 0,
        description: 'Venta de accesorios y extras (GPS, sillas, etc.)',
        isActive: true,
      },
      {
        accountCode: '4400',
        accountName: 'Ingresos por Penalizaciones',
        accountType: 'income',
        parentAccountId: ingresos.id,
        balance: 0,
        description: 'Cargos por retraso, daños, limpieza, etc.',
        isActive: true,
      },
      {
        accountCode: '4500',
        accountName: 'Otros Ingresos',
        accountType: 'income',
        parentAccountId: ingresos.id,
        balance: 0,
        description: 'Ingresos diversos no recurrentes',
        isActive: true,
      },
      {
        accountCode: '4600',
        accountName: 'Productos Financieros',
        accountType: 'income',
        parentAccountId: ingresos.id,
        balance: 0,
        description: 'Intereses ganados',
        isActive: true,
      },
    ]);

    // ============================================
    // 5000 - GASTOS
    // ============================================
    const gastos = await Account.create({
      accountCode: '5000',
      accountName: 'Gastos',
      accountType: 'expense',
      balance: 0,
      description: 'Decrementos en los beneficios económicos',
      isActive: true,
    });

    // 5100 - Gastos de Operación
    const gastosOperacion = await Account.create({
      accountCode: '5100',
      accountName: 'Gastos de Operación',
      accountType: 'expense',
      parentAccountId: gastos.id,
      balance: 0,
      description: 'Gastos necesarios para la operación del negocio',
      isActive: true,
    });

    await Account.bulkCreate([
      {
        accountCode: '5110',
        accountName: 'Sueldos y Salarios',
        accountType: 'expense',
        parentAccountId: gastosOperacion.id,
        balance: 0,
        description: 'Nómina del personal',
        isActive: true,
      },
      {
        accountCode: '5120',
        accountName: 'Cuotas Patronales IMSS',
        accountType: 'expense',
        parentAccountId: gastosOperacion.id,
        balance: 0,
        description: 'Aportaciones patronales al seguro social',
        isActive: true,
      },
      {
        accountCode: '5130',
        accountName: 'Renta de Oficinas',
        accountType: 'expense',
        parentAccountId: gastosOperacion.id,
        balance: 0,
        description: 'Arrendamiento de locales',
        isActive: true,
      },
      {
        accountCode: '5140',
        accountName: 'Servicios Públicos',
        accountType: 'expense',
        parentAccountId: gastosOperacion.id,
        balance: 0,
        description: 'Luz, agua, teléfono, internet',
        isActive: true,
      },
      {
        accountCode: '5150',
        accountName: 'Papelería y Útiles',
        accountType: 'expense',
        parentAccountId: gastosOperacion.id,
        balance: 0,
        description: 'Material de oficina',
        isActive: true,
      },
      {
        accountCode: '5160',
        accountName: 'Publicidad y Marketing',
        accountType: 'expense',
        parentAccountId: gastosOperacion.id,
        balance: 0,
        description: 'Gastos de promoción y publicidad',
        isActive: true,
      },
      {
        accountCode: '5170',
        accountName: 'Honorarios Profesionales',
        accountType: 'expense',
        parentAccountId: gastosOperacion.id,
        balance: 0,
        description: 'Servicios de contadores, abogados, etc.',
        isActive: true,
      },
    ]);

    // 5200 - Gastos de Vehículos
    const gastosVehiculos = await Account.create({
      accountCode: '5200',
      accountName: 'Gastos de Vehículos',
      accountType: 'expense',
      parentAccountId: gastos.id,
      balance: 0,
      description: 'Gastos relacionados con la flota',
      isActive: true,
    });

    await Account.bulkCreate([
      {
        accountCode: '5210',
        accountName: 'Mantenimiento de Vehículos',
        accountType: 'expense',
        parentAccountId: gastosVehiculos.id,
        balance: 0,
        description: 'Reparaciones y mantenimiento preventivo',
        isActive: true,
      },
      {
        accountCode: '5220',
        accountName: 'Combustible',
        accountType: 'expense',
        parentAccountId: gastosVehiculos.id,
        balance: 0,
        description: 'Gasolina y diesel',
        isActive: true,
      },
      {
        accountCode: '5230',
        accountName: 'Seguros de Vehículos',
        accountType: 'expense',
        parentAccountId: gastosVehiculos.id,
        balance: 0,
        description: 'Pólizas de seguro de la flota',
        isActive: true,
      },
      {
        accountCode: '5240',
        accountName: 'Tenencias y Verificaciones',
        accountType: 'expense',
        parentAccountId: gastosVehiculos.id,
        balance: 0,
        description: 'Impuestos vehiculares y verificación',
        isActive: true,
      },
      {
        accountCode: '5250',
        accountName: 'Depreciación de Vehículos',
        accountType: 'expense',
        parentAccountId: gastosVehiculos.id,
        balance: 0,
        description: 'Depreciación contable de la flota',
        isActive: true,
      },
      {
        accountCode: '5260',
        accountName: 'Lavado de Vehículos',
        accountType: 'expense',
        parentAccountId: gastosVehiculos.id,
        balance: 0,
        description: 'Limpieza de vehículos',
        isActive: true,
      },
    ]);

    // 5300 - Gastos Financieros
    const gastosFinancieros = await Account.create({
      accountCode: '5300',
      accountName: 'Gastos Financieros',
      accountType: 'expense',
      parentAccountId: gastos.id,
      balance: 0,
      description: 'Costos financieros',
      isActive: true,
    });

    await Account.bulkCreate([
      {
        accountCode: '5310',
        accountName: 'Intereses Pagados',
        accountType: 'expense',
        parentAccountId: gastosFinancieros.id,
        balance: 0,
        description: 'Intereses de préstamos y créditos',
        isActive: true,
      },
      {
        accountCode: '5320',
        accountName: 'Comisiones Bancarias',
        accountType: 'expense',
        parentAccountId: gastosFinancieros.id,
        balance: 0,
        description: 'Comisiones por servicios bancarios',
        isActive: true,
      },
    ]);

    // 5400 - Otros Gastos
    await Account.bulkCreate([
      {
        accountCode: '5400',
        accountName: 'Otros Gastos',
        accountType: 'expense',
        parentAccountId: gastos.id,
        balance: 0,
        description: 'Gastos diversos no clasificados',
        isActive: true,
      },
    ]);

    const totalAccounts = await Account.count();
    console.log(`✅ Chart of Accounts seeded successfully - ${totalAccounts} accounts created`);
    console.log('   1000 - Activo (16 subcuentas)');
    console.log('   2000 - Pasivo (12 subcuentas)');
    console.log('   3000 - Capital (4 subcuentas)');
    console.log('   4000 - Ingresos (6 subcuentas)');
    console.log('   5000 - Gastos (16 subcuentas)');
  } catch (error) {
    console.error('❌ Error seeding Chart of Accounts:', error);
    throw error;
  }
};

export default seedChartOfAccounts;
