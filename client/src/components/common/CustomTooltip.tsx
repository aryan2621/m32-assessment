import { formatCurrency } from "@/utils/formatters";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
    dataKey?: string;
    payload?: any;
  }>;
  label?: string;
  formatter?: (value: number | string, name?: string) => string;
  labelFormatter?: (label: string) => string;
}

export function CustomTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const defaultFormatter = (value: number | string) => {
    if (typeof value === "number") {
      return formatCurrency(value);
    }
    return String(value);
  };

  const formatValue = formatter || defaultFormatter;
  const displayLabel = labelFormatter ? labelFormatter(label || "") : label;

  const firstEntry = payload[0];
  const isPieChart = firstEntry?.payload?.percent !== undefined;

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "2px solid #111827",
        borderRadius: "10px",
        padding: "14px 18px",
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        minWidth: "180px",
      }}
    >
      {displayLabel && (
        <p
          style={{
            margin: "0 0 10px 0",
            fontWeight: 700,
            fontSize: "15px",
            color: "#111827",
            borderBottom: "2px solid #e5e7eb",
            paddingBottom: "8px",
            letterSpacing: "0.025em",
          }}
        >
          {displayLabel}
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {payload.map((entry, index) => {
          const displayName = entry.name || entry.dataKey || "Value";
          const displayValue = formatValue(entry.value || 0, displayName);
          const percent = entry.payload?.percent;

          return (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#111827",
                fontSize: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  gap: "2px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#374151" }}>
                    {displayName}:
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: "#111827",
                      fontSize: "14px",
                    }}
                  >
                    {displayValue}
                  </span>
                </div>
                {isPieChart && percent !== undefined && (
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      fontWeight: 500,
                    }}
                  >
                    {((percent || 0) * 100).toFixed(1)}% of total
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
