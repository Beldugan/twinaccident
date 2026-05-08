# TwinAccident — Digital Twin EDR

**Aplicație web pentru reconstrucție și expertiză post-accident pe baza datelor EDR conform UN R160/R169**

> Lucrare de dizertație — Master Ingineria Vehiculelor Moderne  
> Universitatea „Ovidius" Constanța — FIMIM — 2026  
> Autor: Ing. Adrian Mircea Beldugan

---

## Demo live

**[https://beldugan.github.io/twinaccident/](https://beldugan.github.io/twinaccident/)**

---

## Funcționalități

- **Parser EDR** — citire date conforme UN R160/R169 din fișiere CSV
- **Generator sintetic** — simulare scenarii cu parametri configurabili
- **4 scenarii preset** — frontal, T-bone, rear-end, run-off/capotare
- **Modul 1: Reconstituire cinematică** — traiectorie, viteză impact, delta-V, energie
- **Modul 2: Comportament șofer** — PRT, distanță oprire, detecție erori
- **Modul 3: Audit sisteme** — ABS, ESC, airbag, centură
- **Vizualizare 3D** — scenă Three.js cu animație temporală
- **Export raport PDF** — structurat conform expertizei tehnice judiciare

---

## Stack tehnologic

| Componentă | Tehnologie |
|---|---|
| Build | Vite 8 |
| Limbaj | TypeScript |
| UI Framework | React 18 |
| Styling | Tailwind CSS v3 |
| Vizualizare 3D | Three.js + @react-three/fiber |
| Grafice 2D | Recharts |
| Export PDF | jsPDF |
| Parsare CSV | PapaParse |

---

## Instalare și rulare locală

```bash
git clone https://github.com/Beldugan/twinaccident.git
cd twinaccident
npm install
npm run dev
```

Aplicația va fi disponibilă la `http://localhost:5173/twinaccident/`

## Build producție

```bash
npm run build
```

---

## Deployment GitHub Pages (pas cu pas)

1. Creează un repository nou pe GitHub: `twinaccident` (public)
2. Adaugă remote-ul și face push:
   ```bash
   git remote add origin https://github.com/Beldugan/twinaccident.git
   git push -u origin main
   ```
3. În **Settings → Pages** → Source: **GitHub Actions**
4. La fiecare push pe `main`, GitHub Actions va deploya automat la  
   `https://Beldugan.github.io/twinaccident/`

---

## Format date EDR (CSV)

```
# VEHICLE
category,M1
mass_kerb_kg,1395
...

# PRE-CRASH
t,vehicleSpeed,longitudinalAccel,...
-5.0,72.0,0.02,...

# CRASH
t,deltaV_longitudinal,...
0.000,0.0,...

# EVENTS
parameter,value
triggerEvent,airbag_deployment
...
```

---

## Structura proiectului

```
src/
├── edr/          # Schema R160, parser CSV, generator sintetic, validare
├── physics/      # Cinematică, energie, impact, frânare, traiectorie
├── analysis/     # Reconstituire, comportament șofer, audit sisteme, concluzii
├── viz3d/        # Scenă Three.js cu vehicule și traiectorii animate
├── components/   # UI React (Dashboard, DataInput, ScenarioSelector, etc.)
├── store/        # React Context + useReducer
└── utils/        # Unități, formatare, culori
```

---

## Licență

MIT — liber pentru utilizare educațională și academică.
