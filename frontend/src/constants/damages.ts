/**
 * Catálogo de daños predefinidos para devoluciones
 * Utilizado en ReturnForm y componentes relacionados
 */

export interface DamageOption {
  value: string;
  label: string;
  cost: number;
}

export const DAMAGE_CATALOG: DamageOption[] = [
  { value: 'scratch_bumper', label: 'Rayón en defensa', cost: 300 },
  { value: 'dent_door', label: 'Abolladura en puerta', cost: 800 },
  { value: 'broken_mirror', label: 'Espejo roto', cost: 150 },
  { value: 'scratched_paint', label: 'Pintura rayada', cost: 500 },
  { value: 'flat_tire', label: 'Llanta ponchada', cost: 100 },
  { value: 'cracked_windshield', label: 'Parabrisas estrellado', cost: 1200 },
  { value: 'interior_stain', label: 'Mancha en interior', cost: 200 },
  { value: 'custom', label: 'Otro (personalizado)', cost: 0 }
];

/**
 * Obtiene un daño del catálogo por su valor
 */
export const getDamageByValue = (value: string): DamageOption | undefined => {
  return DAMAGE_CATALOG.find(d => d.value === value);
};
