type ERLMetricsCardProps = {
  erlRating: number;
  erlEdge: number;
  projectedMargin: number;
  projectedTotal: number | null;
totalProjectionSource: string;
  confidence: string;
  blowoutRisk: string;
  dataCompleteness: number;
  uncertainty: number;
};

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

export default function ERLMetricsCard({
  erlRating,
  erlEdge,
  projectedMargin,

  projectedTotal,
  totalProjectionSource,

  confidence,
  blowoutRisk,
  dataCompleteness,
  uncertainty,
}: ERLMetricsCardProps) {
  const metrics = [
    {
      label: "ERL Rating",
      value: `${erlRating.toFixed(1)}/100`,
    },
    {
      label: "ERL Edge",
      value: formatSigned(erlEdge),
    },
    {
      label: "Projected Margin",
      value: formatSigned(projectedMargin),
    },
    {
  label: "Projected Total",
  value:
    projectedTotal === null
      ? "Unavailable"
      : projectedTotal.toFixed(1),
},
{
  label: "Total Source",
  value: totalProjectionSource,
},
    {
      label: "Confidence",
      value: confidence,
    },
    {
      label: "Blowout Risk",
      value: blowoutRisk,
    },
    {
      label: "Data Completeness",
      value: `${dataCompleteness.toFixed(0)}%`,
    },
    {
      label: "Uncertainty",
      value: `${uncertainty.toFixed(0)}%`,
    },
  ];

  return (
    <div className="rounded-xl border border-yellow-900/70 bg-yellow-950/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400">
        EasyRunLine Intelligence
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <p className="text-xs text-zinc-500">
              {metric.label}
            </p>

            <p className="mt-1 font-bold text-white">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}