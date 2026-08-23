# Binance Public Analyzer Web

App web estática en `HTML`, `CSS` y `JavaScript` para analizar `BTC/USDT` y `ETH/USDT` con datos públicos de Binance. No usa API key, no accede a tu cuenta y no envía órdenes.

## Estructura

- `index.html`: punto de entrada
- `styles.css`: diseño responsive
- `js/services/binanceService.js`: precio, ticker 24h y velas
- `js/models/market.js`: símbolos y temporalidades
- `js/indicators/ema.js`: `calculateEMA`
- `js/indicators/rsi.js`: `calculateRSI`
- `js/indicators/volume.js`: `calculateAverageVolume`
- `js/indicators/levels.js`: `detectSupportAndResistance`
- `js/analysis/analysisRules.js`: reglas y umbrales
- `js/analysis/analysisEngine.js`: sesgo y explicación
- `js/ui/chart.js`: gráfico SVG de velas y EMAs
- `js/ui/renderers.js`: renderizado de pantallas
- `js/app.js`: estado global, navegación y auto-refresh

## Abrir en la Mac

Opción simple:

```bash
open /Users/ricardofarbman/binance-public-analyzer-web/index.html
```

Opción recomendada en JavaScript:

```bash
cd /Users/ricardofarbman/binance-public-analyzer-web
node server.js
```

Luego abre:

`http://localhost:8080`

## Probar en iPhone

1. Asegúrate de que la Mac y el iPhone estén en la misma red Wi‑Fi.
2. En la carpeta del proyecto, ejecuta:

```bash
cd /Users/ricardofarbman/binance-public-analyzer-web
node server.js
```

3. En la Mac, averigua tu IP local:

```bash
ipconfig getifaddr en0
```

4. En el iPhone, abre Safari y entra a:

`http://TU_IP_LOCAL:8080`

Ejemplo:

`http://192.168.1.25:8080`

## Dónde cambiar las reglas

- `js/analysis/analysisRules.js`
- `js/analysis/analysisEngine.js`
