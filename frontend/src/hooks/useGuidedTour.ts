/**
 * Hook para el tour guiado de onboarding.
 * Se lanza automáticamente la primera vez que el usuario entra al Dashboard.
 * Guarda estado en localStorage para no repetirse.
 */
import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_KEY = 'movicar_tour_completed';

function getTourSteps(isDarkMode: boolean) {
  const popoverBg = isDarkMode ? '#1c1c2e' : '#ffffff';
  const popoverColor = isDarkMode ? 'rgba(255,255,255,0.9)' : '#111827';
  const descColor = isDarkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';

  return {
    popoverClass: `movicar-tour ${isDarkMode ? 'dark' : 'light'}`,
    steps: [
      {
        element: '[data-tour="logo"]',
        popover: {
          title: 'Bienvenido a MOVICAR',
          description: 'Tu sistema integral de gestión de renta de vehículos. Desde aquí puedes acceder a todas las funciones.',
        },
      },
      {
        element: '[data-tour="sidebar-nav"]',
        popover: {
          title: 'Navegación',
          description: 'Los módulos están organizados por área: Ventas, Inventario, Finanzas y Administración. Solo verás las secciones que corresponden a tu rol.',
        },
      },
      {
        element: '[data-tour="global-search"]',
        popover: {
          title: 'Búsqueda Global',
          description: 'Busca clientes, vehículos, rentas y más. También puedes usar Ctrl+K para abrir la paleta de comandos rápida.',
        },
      },
      {
        element: '[data-tour="theme-toggle"]',
        popover: {
          title: 'Modo Oscuro / Claro',
          description: 'Cambia entre modo oscuro y claro según tu preferencia. Atajo: Shift+D',
        },
      },
      {
        element: '[data-tour="alerts"]',
        popover: {
          title: 'Centro de Alertas',
          description: 'Aquí verás notificaciones importantes: mantenimientos vencidos, rentas próximas a vencer y más.',
        },
      },
      {
        element: '[data-tour="settings"]',
        popover: {
          title: 'Configuración',
          description: 'Personaliza tarifas, servicios extra, ubicaciones y preferencias del sistema.',
        },
      },
      {
        element: '[data-tour="user-profile"]',
        popover: {
          title: 'Tu Perfil',
          description: 'Gestiona tu cuenta y cierra sesión desde aquí. ¡Listo para comenzar!',
        },
      },
    ],
    // Custom styles via CSS vars
    cssVars: { popoverBg, popoverColor, descColor },
  };
}

export function useGuidedTour(isDarkMode: boolean) {
  const location = useLocation();
  const hasLaunched = useRef(false);

  const startTour = useCallback(() => {
    const tourConfig = getTourSteps(isDarkMode);

    const d = driver({
      showProgress: true,
      animate: true,
      overlayColor: isDarkMode ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.5)',
      stagePadding: 8,
      stageRadius: 12,
      popoverOffset: 12,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      progressText: '{{current}} de {{total}}',
      steps: tourConfig.steps,
      onDestroyStarted: () => {
        localStorage.setItem(TOUR_KEY, 'true');
        d.destroy();
      },
    });

    d.drive();
  }, [isDarkMode]);

  // Auto-launch on first visit to dashboard
  useEffect(() => {
    if (hasLaunched.current) return;
    if (location.pathname !== '/dashboard') return;
    if (localStorage.getItem(TOUR_KEY) === 'true') return;

    hasLaunched.current = true;
    const timer = setTimeout(startTour, 1200);
    return () => clearTimeout(timer);
  }, [location.pathname, startTour]);

  return { startTour };
}
