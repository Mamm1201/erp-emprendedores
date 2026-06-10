# ERP + CMMS — Mantenimiento Especializado de Sistemas Hospitalarios

Sistema de gestión para la empresa de Mario Alejandro Márquez Moreno. Cubre cotizaciones, órdenes de trabajo, facturación y mantenimiento preventivo (CMMS) de equipos hospitalarios.

## Arquitectura

```
erp-emprendedores/
├── backend/      NestJS 11 + Prisma 7 + PostgreSQL 16
├── frontend/     React 19 + Vite + Tailwind 4
└── docker-compose.yml   (solo base de datos)
```

## Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 20 LTS |
| npm | 10 |
| Docker Desktop | Cualquier versión reciente |

## Levantamiento rápido (primera vez)

```bash
# 1. Clonar el repositorio
git clone https://github.com/Mamm1201/erp-emprendedores.git
cd erp-emprendedores

# 2. Levantar la base de datos
docker compose up -d

# 3. Configurar y arrancar el backend
cd backend
cp .env.example .env        # ajustar credenciales si es necesario
npm install
npm run db:migrate           # crea las tablas
npm run db:seed              # carga los datos iniciales (clientes, equipos, planes)
npm run start:dev            # http://localhost:3000

# 4. En otra terminal — arrancar el frontend
cd ../frontend
cp .env.example .env         # ajustar si el backend corre en otro puerto
npm install
npm run dev                  # http://localhost:5173
```

## Uso diario (ya configurado)

```bash
# Terminal 1 — base de datos
docker compose up -d

# Terminal 2 — backend
cd backend && npm run start:dev

# Terminal 3 — frontend
cd frontend && npm run dev
```

Abrir el navegador en **http://localhost:5173**

---

Para detalles técnicos ver:
- [`backend/README.md`](backend/README.md) — API, módulos, variables de entorno
- [`frontend/README.md`](frontend/README.md) — estructura UI, convenciones
