# 🎨 Componentes Styled de MOVICAR

Sistema de componentes reutilizables con **Poppins** integrado, responsive automático y theme-aware.

## 📦 Componentes Disponibles

### 1. StyledCard

Tarjeta base reutilizable con tema automático.

```tsx
import { StyledCard } from '@/components/styled';

// Básico
<StyledCard>
  <Typography>Contenido</Typography>
</StyledCard>

// Con hover effect
<StyledCard hover>
  <Typography>Clickeable</Typography>
</StyledCard>

// Padding personalizado
<StyledCard padding={2}>
  <Typography>Menos padding</Typography>
</StyledCard>
```

**Props:**
- `hover?: boolean` - Añade efecto hover (transform + shadow)
- `padding?: number` - Padding en theme.spacing units (default: 3)
- Acepta todos los props de Material-UI `Paper`

---

### 2. StyledKPI

Componente especializado para KPIs (indicadores clave).

```tsx
import { StyledKPI } from '@/components/styled';
import { TrendingUpIcon } from '@mui/icons-material';

<StyledKPI
  icon={<TrendingUpIcon />}
  label="Ocupación de Flota"
  value="68%"
  subtitle="Meta: 75%"
  color="#10b981"
/>

// Con elemento extra (chip, badge, etc.)
<StyledKPI
  icon={<MoneyIcon />}
  label="Ingresos del Mes"
  value="$825K"
  color="#8b5cf6"
  extra={
    <Chip label="+12%" color="success" size="small" />
  }
/>
```

**Props:**
- `icon: React.ReactElement` - Icono Material-UI (requerido)
- `label: string` - Etiqueta del KPI (requerido)
- `value: string | number` - Valor principal (requerido)
- `subtitle?: string` - Texto secundario opcional
- `color: string` - Color hex para icono y valor (requerido)
- `extra?: React.ReactNode` - Elemento adicional (chip, badge, etc.)

---

### 3. StyledSection

Sección con título, subtítulo y acción opcional.

```tsx
import { StyledSection } from '@/components/styled';
import { Tabs, Tab } from '@mui/material';

// Básico
<StyledSection title="Últimas Rentas">
  <Table>...</Table>
</StyledSection>

// Con subtítulo
<StyledSection
  title="Desempeño del Negocio"
  subtitle="Ingresos y ocupación en el tiempo"
>
  <LineChart />
</StyledSection>

// Con acción (tabs, botones, etc.)
<StyledSection
  title="Analíticas"
  subtitle="Periodo seleccionado"
  action={
    <Tabs value={0}>
      <Tab label="Hoy" />
      <Tab label="Semana" />
    </Tabs>
  }
>
  <Chart />
</StyledSection>
```

**Props:**
- `title: string` - Título de la sección (requerido)
- `subtitle?: string` - Subtítulo opcional
- `action?: React.ReactNode` - Elemento de acción (tabs, botón, etc.)
- `children: React.ReactNode` - Contenido (requerido)
- `padding?: number` - Padding personalizado (default: 3)
- `marginBottom?: number` - Margen inferior en theme.spacing units

---

## 🎯 Beneficios

✅ **Type-safe**: Todo con TypeScript
✅ **Theme-aware**: Usa automáticamente dark/light mode
✅ **Responsive**: Breakpoints integrados de Material-UI
✅ **Consistente**: Mismo estilo en toda la app
✅ **Escalable**: Fácil de modificar en un solo lugar
✅ **Poppins integrado**: Usa la tipografía del tema automáticamente

---

## 📝 Ejemplo Completo: Dashboard KPIs

```tsx
import { Box } from '@mui/material';
import { StyledKPI } from '@/components/styled';
import {
  TrendingUpIcon,
  CheckCircleIcon,
  MoneyIcon,
} from '@mui/icons-material';

const Dashboard = () => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(6, 1fr)',
        },
        gap: 2,
        mb: 4,
      }}
    >
      <StyledKPI
        icon={<TrendingUpIcon />}
        label="Ocupación de Flota"
        value="68%"
        subtitle="Meta: 75%"
        color="#10b981"
      />

      <StyledKPI
        icon={<CheckCircleIcon />}
        label="Vehículos Disponibles"
        value={45}
        subtitle="unidades listas"
        color="#10b981"
      />

      <StyledKPI
        icon={<MoneyIcon />}
        label="Ingresos del Mes"
        value="$825K"
        color="#8b5cf6"
        extra={
          <Chip
            label="+12%"
            color="success"
            size="small"
            icon={<TrendingUpIcon />}
          />
        }
      />
    </Box>
  );
};
```

---

## 🚀 Mejores Prácticas

1. **Usar siempre estos componentes** en lugar de repetir estilos inline
2. **Colores consistentes**: Usar la paleta del tema (#10b981, #8b5cf6, etc.)
3. **Responsive por defecto**: Usar breakpoints de MUI (xs, sm, md, lg, xl)
4. **TypeScript**: Aprovechar los tipos para evitar errores

---

## 🔧 Cómo Extender

Si necesitas un nuevo componente styled:

1. Crea `StyledNuevoComponente.tsx` en esta carpeta
2. Usa `styled()` API de MUI con theme-aware
3. Exporta el componente y sus tipos en `index.ts`
4. Documenta el uso aquí en README.md

**Ejemplo:**

```tsx
// StyledAlert.tsx
import { Alert, AlertProps } from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledAlert = styled(Alert)<AlertProps>(({ theme }) => ({
  borderRadius: theme.spacing(2),
  fontWeight: 500,
  // ... más estilos
}));
```

---

**Última actualización**: Diciembre 2025
**Tipografía**: Poppins (configurada en theme)
**Framework**: Material-UI v5 + TypeScript
