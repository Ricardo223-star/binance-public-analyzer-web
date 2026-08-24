(function () {
  window.BinanceAnalyzer = window.BinanceAnalyzer || {};

  const { chartVisibleCandles } = window.BinanceAnalyzer.AnalysisRules;
  const { formatPrice, formatVolume, formatCandleDateTime } = window.BinanceAnalyzer.Format;

  function createLinePoints(values, visibleStartIndex, width, height, minPrice, maxPrice) {
    const visibleValues = values.slice(visibleStartIndex);
    const step = visibleValues.length > 1 ? width / (visibleValues.length - 1) : width;
    const range = Math.max(maxPrice - minPrice, 1);

    return visibleValues
      .map((value, index) => {
        if (value === null) {
          return null;
        }

        const x = index * step;
        const y = height - ((value - minPrice) / range) * height;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .filter(Boolean)
      .join(" ");
  }

  function renderCandlestickChart(analysis, selectedCandleOpenTime) {
    const visibleCandles = analysis.candles.slice(-chartVisibleCandles);
    const visibleStartIndex = Math.max(0, analysis.candles.length - visibleCandles.length);
    const selectedCandle =
      visibleCandles.find((candle) => String(candle.openTime) === String(selectedCandleOpenTime)) ||
      null;
    const width = 760;
    const rightGutter = 74;
    const plotWidth = width - rightGutter;
    const totalHeight = 432;
    const priceHeight = 294;
    const volumeTop = 318;
    const volumeHeight = 72;

    const emaValues = []
      .concat(analysis.ema21Series.slice(visibleStartIndex))
      .concat(analysis.ema50Series.slice(visibleStartIndex))
      .concat(analysis.ema180Series.slice(visibleStartIndex))
      .filter((value) => value !== null);

    const lows = visibleCandles.map((candle) => candle.low).concat(emaValues);
    const highs = visibleCandles.map((candle) => candle.high).concat(emaValues);
    const minPrice = Math.min(...lows) * 0.996;
    const maxPrice = Math.max(...highs) * 1.004;
    const range = Math.max(maxPrice - minPrice, 1);
    const maxVolume = Math.max(...visibleCandles.map((candle) => candle.volume), 1);
    const step = visibleCandles.length ? plotWidth / visibleCandles.length : 0;

    const priceScale = [0, 1, 2, 3].map((gridIndex) => {
      const ratio = gridIndex / 3;
      const y = priceHeight * ratio;
      const value = maxPrice - range * ratio;
      return {
        y,
        value,
      };
    });

    const candleShapes = visibleCandles
      .map((candle, index) => {
        const x = index * step + step * 0.18;
        const candleWidth = Math.max(4, step * 0.6);
        const openY = priceHeight - ((candle.open - minPrice) / range) * priceHeight;
        const closeY = priceHeight - ((candle.close - minPrice) / range) * priceHeight;
        const highY = priceHeight - ((candle.high - minPrice) / range) * priceHeight;
        const lowY = priceHeight - ((candle.low - minPrice) / range) * priceHeight;
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.max(Math.abs(closeY - openY), 2);
        const rising = candle.close >= candle.open;
        const color = rising ? "#22c55e" : "#ef4444";
        const volumeBarHeight = (candle.volume / maxVolume) * volumeHeight;
        const selected = String(candle.openTime) === String(selectedCandleOpenTime);

        return `
          <line x1="${(x + candleWidth / 2).toFixed(2)}" y1="${highY.toFixed(2)}" x2="${(
            x + candleWidth / 2
          ).toFixed(2)}" y2="${lowY.toFixed(2)}" stroke="${color}" stroke-width="1.4" />
          <rect x="${x.toFixed(2)}" y="${bodyTop.toFixed(2)}" width="${candleWidth.toFixed(
            2,
          )}" height="${bodyHeight.toFixed(2)}" rx="1.8" fill="${color}" />
          <rect x="${x.toFixed(2)}" y="${(volumeTop + volumeHeight - volumeBarHeight).toFixed(
            2,
          )}" width="${candleWidth.toFixed(2)}" height="${Math.max(volumeBarHeight, 1).toFixed(
            2,
          )}" rx="1.2" fill="${color}" opacity="0.85" />
          ${
            selected
              ? `<line x1="${(x + candleWidth / 2).toFixed(2)}" y1="0" x2="${(
                  x + candleWidth / 2
                ).toFixed(2)}" y2="${(volumeTop + volumeHeight).toFixed(
                  2,
                )}" stroke="#f8fafc" stroke-opacity="0.4" stroke-dasharray="5 5" stroke-width="1.4" />`
              : ""
          }
          <rect
            x="${(x - step * 0.14).toFixed(2)}"
            y="0"
            width="${Math.max(step * 0.96, 6).toFixed(2)}"
            height="${(volumeTop + volumeHeight).toFixed(2)}"
            fill="transparent"
            data-action="select-candle"
            data-candle-open-time="${candle.openTime}"
            style="pointer-events: all;"
          />
        `;
      })
      .join("");

    const horizontalGrid = priceScale
      .map((gridItem) => {
        const y = gridItem.y;
        return `<line x1="0" y1="${y.toFixed(2)}" x2="${width}" y2="${y.toFixed(
          2,
        )}" stroke="#334155" stroke-opacity="0.75" stroke-width="1" />`;
      })
      .join("");

    const priceScaleLabels = priceScale
      .map(
        (gridItem) => `
          <text
            x="${plotWidth + 10}"
            y="${(gridItem.y + 4).toFixed(2)}"
            fill="#cbd5e1"
            font-size="13"
            text-anchor="start"
          >${formatPrice(gridItem.value)}</text>
        `,
      )
      .join("");

    const ema21Points = createLinePoints(
      analysis.ema21Series,
      visibleStartIndex,
      plotWidth,
      priceHeight,
      minPrice,
      maxPrice,
    );
    const ema50Points = createLinePoints(
      analysis.ema50Series,
      visibleStartIndex,
      plotWidth,
      priceHeight,
      minPrice,
      maxPrice,
    );
    const ema180Points = createLinePoints(
      analysis.ema180Series,
      visibleStartIndex,
      plotWidth,
      priceHeight,
      minPrice,
      maxPrice,
    );

    const selectedCandleMarkup = selectedCandle
      ? `
        <div class="chart-selected">
          <span>${formatCandleDateTime(selectedCandle.closeTime)}</span>
          <span>O ${formatPrice(selectedCandle.open)}</span>
          <span>H ${formatPrice(selectedCandle.high)}</span>
          <span>L ${formatPrice(selectedCandle.low)}</span>
          <span>C ${formatPrice(selectedCandle.close)}</span>
          <span>V ${formatVolume(selectedCandle.volume)}</span>
        </div>
      `
      : '<p class="chart-hint">Toca una vela para ver hora, OHLC y volumen.</p>';

    return `
      <svg viewBox="0 0 ${width} ${totalHeight}" aria-label="Gráfico de velas">
        ${horizontalGrid}
        ${priceScaleLabels}
        <rect x="0" y="${volumeTop}" width="${plotWidth}" height="${volumeHeight}" fill="none" stroke="#334155" stroke-opacity="0.5" />
        ${candleShapes}
        <polyline points="${ema21Points}" fill="none" stroke="#38bdf8" stroke-width="2.4" />
        <polyline points="${ema50Points}" fill="none" stroke="#f59e0b" stroke-width="2.2" />
        <polyline points="${ema180Points}" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-opacity="0.88" />
      </svg>
      <div class="chart-meta">
        <div class="legend">
          <span class="legend-item"><span class="legend-dot" style="background:#38bdf8"></span>EMA21</span>
          <span class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span>EMA50</span>
          <span class="legend-item"><span class="legend-dot" style="background:#ffffff"></span>EMA180</span>
        </div>
        <div>Rango: ${formatPrice(minPrice)} - ${formatPrice(maxPrice)}</div>
      </div>
      ${selectedCandleMarkup}
    `;
  }

  window.BinanceAnalyzer.ChartUI = {
    renderCandlestickChart,
  };
})();
