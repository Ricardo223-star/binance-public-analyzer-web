(function () {
  window.BinanceAnalyzer = window.BinanceAnalyzer || {};

  function formatPrice(value) {
    const digits = value >= 1000 ? 2 : value >= 1 ? 4 : 6;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(Number(value || 0));
  }

  function formatPercent(value) {
    const absoluteValue = Math.abs(Number(value || 0)).toFixed(2);
    return `${value >= 0 ? "+" : "-"}${absoluteValue}%`;
  }

  function formatVolume(value) {
    const safeValue = Number(value || 0);
    if (safeValue >= 1_000_000_000) {
      return `${(safeValue / 1_000_000_000).toFixed(2)}B`;
    }
    if (safeValue >= 1_000_000) {
      return `${(safeValue / 1_000_000).toFixed(2)}M`;
    }
    if (safeValue >= 1_000) {
      return `${(safeValue / 1_000).toFixed(2)}K`;
    }
    return safeValue.toFixed(2);
  }

  function formatLastUpdated(timestamp) {
    if (!timestamp) {
      return "--:--:--";
    }

    return new Date(timestamp).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  window.BinanceAnalyzer.Format = {
    formatPrice,
    formatPercent,
    formatVolume,
    formatLastUpdated,
    escapeHtml,
  };
})();
