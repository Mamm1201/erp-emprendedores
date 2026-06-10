# Frontend — ERP Mantenimiento Hospitalario

Interfaz web construida con React 19, Vite 8 y Tailwind CSS 4.

## Variables de entorno

```bash
cp .env.example .env
```

| Variable | Descripción | Default |
|---|---|---|
| `VITE_API_URL` | URL base del backend | `http://localhost:3000` |

## Scripts disponibles

```bash
npm run dev       # Servidor de desarrollo con HMR — http://localhost:5173
npm run build     # Compila para producción (genera dist/)
npm run preview   # Previsualiza el build de producción
npm run lint      # Ejecuta ESLint
```

## Estructura del proyecto

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx     Contenedor principal: sidebar + área de contenido
│   │   └── Sidebar.tsx       Menú de navegación lateral
│   └── ui/
│       ├── badge.tsx         Etiqueta de estado con variantes de color
│       ├── button.tsx        Botón con variantes (default, outline, ghost, etc.)
│       ├── card.tsx          Tarjeta con header, content
│       └── table.tsx         Tabla de datos
├── hooks/
│   └── use-upcoming-visits.ts  TanStack Query — GET /maintenance-plans/upcoming
├── lib/
│   ├── api.ts      Cliente HTTP (get, post, patch, delete) sobre fetch
│   ├── types.ts    Tipos TypeScript compartidos (Client, Branch, WorkOrder, etc.)
│   └── utils.ts    Función cn() para combinar clases Tailwind
├── pages/
│   ├── DashboardPage.tsx   Próximas visitas con tarjetas de resumen
│   └── PlaceholderPage.tsx Página temporal para rutas en desarrollo
├── App.tsx         Router — define todas las rutas
└── main.tsx        Punto de entrada — QueryClientProvider + RouterProvider
```

## Stack de librerías

| Librería | Uso |
|---|---|
| `react-router-dom` | Routing (createBrowserRouter) |
| `@tanstack/react-query` | Caché y fetching de datos del servidor |
| `react-hook-form` | Formularios (próximamente) |
| `zod` | Validación de esquemas (próximamente) |
| `date-fns` | Formateo y cálculo de fechas |
| `lucide-react` | Íconos |
| `class-variance-authority` | Variantes de componentes UI |
| `tailwind-merge` + `clsx` | Combinación segura de clases Tailwind |

## Rutas disponibles

| Ruta | Página | Estado |
|---|---|---|
| `/` | Dashboard — próximas visitas | Implementado |
| `/clientes` | Gestión de clientes (IPS) | En desarrollo |
| `/ordenes` | Órdenes de trabajo | En desarrollo |
| `/planes` | Planes de mantenimiento | En desarrollo |
| `/equipos` | Equipos por sede | En desarrollo |

## Convenciones

- **Hooks de datos**: un archivo por recurso en `src/hooks/`. Usan TanStack Query con `queryKey` estructurado como `[recurso, filtros]`.
- **Tipos**: todos los tipos de API viven en `src/lib/types.ts`. No se duplican en componentes.
- **API client**: siempre usar `api.get()`, `api.post()`, etc. de `src/lib/api.ts`. Nunca llamar `fetch` directamente en componentes.
- **Componentes UI**: los componentes base están en `src/components/ui/`. Para páginas completas, crear carpeta en `src/pages/`.

## Cómo agregar una nueva pantalla

1. Crear `src/pages/NombrePage.tsx`
2. Si necesita datos, crear `src/hooks/use-nombre.ts` con TanStack Query
3. Agregar la ruta en `src/App.tsx`
4. Agregar el enlace en `src/components/layout/Sidebar.tsx`
