/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";

import { getDashboard } from "../api/dashboard.api";
import { useAuth } from "../auth/AuthContext";

import "./css/Dashboard.css";

interface DashboardData {
  statistics: {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    totalDepartments: number;
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
  };
  departments: {
    id: number;
    name: string;
    employeeCount: number;
  }[];
}

interface PieDatum {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: PieDatum[];
  centerValue: string;
  centerLabel: string;
}

const EMPTY_DASHBOARD: DashboardData = {
  statistics: {
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    totalDepartments: 0,
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
  },
  departments: [],
};

const DEPARTMENT_COLORS = [
  "#4f46e5",
  "#7c3aed",
  "#2563eb",
  "#0891b2",
  "#059669",
  "#16a34a",
  "#ca8a04",
  "#ea580c",
  "#dc2626",
  "#db2777",
  "#9333ea",
  "#4f46e5",
];

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),

    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function createDonutPath(
  startAngle: number,
  endAngle: number,
  outerRadius: number,
  innerRadius: number,
) {
  const startOuter = polarToCartesian(50, 50, outerRadius, endAngle);

  const endOuter = polarToCartesian(50, 50, outerRadius, startAngle);

  const startInner = polarToCartesian(50, 50, innerRadius, endAngle);

  const endInner = polarToCartesian(50, 50, innerRadius, startAngle);

  const angle = endAngle - startAngle;

  const largeArcFlag = angle > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

function DonutChart({ data, centerValue, centerLabel }: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const chartData = total > 0 ? data.filter((item) => item.value > 0) : [];

  const slices = chartData.reduce<
    (PieDatum & {
      originalIndex: number;
      startAngle: number;
      endAngle: number;
      midpoint: number;
      percentage: number;
    })[]
  >((result, item, index) => {
    const previousSlice = result[result.length - 1];

    const startAngle = previousSlice?.endAngle ?? 0;

    const sliceAngle = (item.value / total) * 360;

    const endAngle = startAngle + sliceAngle;

    const midpoint = startAngle + sliceAngle / 2;

    result.push({
      ...item,
      originalIndex: index,
      startAngle,
      endAngle,
      midpoint,
      percentage: (item.value / total) * 100,
    });

    return result;
  }, []);

  const hoveredItem = hoveredIndex !== null ? slices[hoveredIndex] : null;

  const tooltipPosition = hoveredItem
    ? polarToCartesian(50, 50, 42, hoveredItem.midpoint)
    : null;

  return (
    <div className="dashboard-chart-wrapper">
      <div className="dashboard-chart">
        <svg
          viewBox="0 0 100 100"
          className="dashboard-donut"
          role="img"
          aria-label={`${centerLabel}: ${centerValue}`}
        >
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="#f2f4f7"
            strokeWidth="12"
          />

          {slices.map((slice, index) => (
            <path
              key={`${slice.label}-${index}`}
              d={createDonutPath(
                slice.startAngle,
                slice.endAngle,
                hoveredIndex === index ? 40 : 38,
                27,
              )}
              fill={slice.color}
              stroke="#ffffff"
              strokeWidth="1.2"
              className="dashboard-donut-slice"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>

        <div className="dashboard-chart-center">
          <strong>{centerValue}</strong>
          <span>{centerLabel}</span>
        </div>

        {hoveredItem && tooltipPosition && (
          <div
            className="dashboard-chart-tooltip"
            style={{
              left: `${tooltipPosition.x}%`,
              top: `${tooltipPosition.y}%`,
            }}
          >
            <div className="dashboard-tooltip-title">
              <span
                className="dashboard-tooltip-dot"
                style={{
                  backgroundColor: hoveredItem.color,
                }}
              />

              {hoveredItem.label}
            </div>

            <strong>{hoveredItem.value.toLocaleString()}</strong>

            <span>{hoveredItem.percentage.toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className="dashboard-chart-legend">
        {data
          .filter((item) => item.value > 0)
          .slice(0, 4)
          .map((item) => (
            <div
              key={item.label}
              className="dashboard-legend-item"
              onMouseEnter={() => {
                const index = slices.findIndex(
                  (slice) => slice.label === item.label,
                );

                setHoveredIndex(index >= 0 ? index : null);
              }}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span
                className="dashboard-legend-dot"
                style={{
                  backgroundColor: item.color,
                }}
              />

              <span className="dashboard-legend-label">{item.label}</span>

              <strong>{item.value}</strong>
            </div>
          ))}

        {data.filter((item) => item.value > 0).length > 4 && (
          <div className="dashboard-legend-more">
            Hover the chart for more details
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState<DashboardData>(EMPTY_DASHBOARD);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const data = await getDashboard();

      setDashboard(data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);

      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const statistics = dashboard.statistics;

  const employeeChartData: PieDatum[] = [
    {
      label: "Active",
      value: statistics.activeEmployees,
      color: "#12b76a",
    },
    {
      label: "Inactive",
      value: statistics.inactiveEmployees,
      color: "#98a2b3",
    },
  ];

  const accountChartData: PieDatum[] = [
    {
      label: "Active",
      value: statistics.activeUsers,
      color: "#4f46e5",
    },
    {
      label: "Inactive",
      value: statistics.inactiveUsers,
      color: "#f79009",
    },
  ];

  const departmentChartData = useMemo<PieDatum[]>(
    () =>
      dashboard.departments.map((department, index) => ({
        label: department.name,
        value: department.employeeCount,
        color: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
      })),
    [dashboard.departments],
  );

  function formatNumber(value: number) {
    return new Intl.NumberFormat().format(value);
  }

  function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "Good morning";
    }

    if (hour < 18) {
      return "Good afternoon";
    }

    return "Good evening";
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading-header">
          <div className="dashboard-skeleton dashboard-skeleton-title" />
          <div className="dashboard-skeleton dashboard-skeleton-subtitle" />
        </div>

        <div className="dashboard-stat-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="dashboard-card dashboard-stat-card">
              <div className="dashboard-skeleton dashboard-skeleton-small" />
              <div className="dashboard-skeleton dashboard-skeleton-number" />
            </div>
          ))}
        </div>

        <div className="dashboard-chart-grid">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="dashboard-card dashboard-chart-card dashboard-chart-loading"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* HEADER */}
      <section className="dashboard-header">
        <div>
          <div className="dashboard-eyebrow">WORKFORCE OVERVIEW</div>

          <h1 className="dashboard-title">
            {getGreeting()}, <span>{user?.firstName ?? "there"}</span>.
          </h1>

          <p className="dashboard-subtitle">
            Here's what's happening across your organization.
          </p>
        </div>

        <button
          type="button"
          className="btn dashboard-refresh-button"
          onClick={loadDashboard}
          disabled={loading}
        >
          <span>↻</span>
          Refresh
        </button>
      </section>

      {/* ERROR */}
      {error && (
        <div className="alert alert-danger dashboard-alert">
          <div>
            <strong>Unable to load dashboard</strong>

            <div>{error}</div>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={loadDashboard}
          >
            Retry
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <section className="dashboard-stat-grid">
        <div className="dashboard-card dashboard-stat-card">
          <div>
            <div className="dashboard-stat-label">Total Employees</div>

            <div className="dashboard-stat-value">
              {formatNumber(statistics.totalEmployees)}
            </div>
          </div>

          <div className="dashboard-stat-footer">
            <span className="dashboard-positive">
              {formatNumber(statistics.activeEmployees)}
            </span>
            <span>active</span>
          </div>
        </div>

        <div className="dashboard-card dashboard-stat-card">
          <div>
            <div className="dashboard-stat-label">Active Employees</div>

            <div className="dashboard-stat-value">
              {formatNumber(statistics.activeEmployees)}
            </div>
          </div>

          <div className="dashboard-stat-footer">
            <span className="dashboard-positive">
              {statistics.totalEmployees > 0
                ? Math.round(
                    (statistics.activeEmployees / statistics.totalEmployees) *
                      100,
                  )
                : 0}
              %
            </span>

            <span>of workforce</span>
          </div>
        </div>

        <div className="dashboard-card dashboard-stat-card">
          <div>
            <div className="dashboard-stat-label">Departments</div>

            <div className="dashboard-stat-value">
              {formatNumber(statistics.totalDepartments)}
            </div>
          </div>

          <div className="dashboard-stat-footer">
            <span className="dashboard-neutral">Organizational</span>

            <span>units</span>
          </div>
        </div>

        <div className="dashboard-card dashboard-stat-card">
          <div>
            <div className="dashboard-stat-label">User Accounts</div>

            <div className="dashboard-stat-value">
              {formatNumber(statistics.totalUsers)}
            </div>
          </div>

          <div className="dashboard-stat-footer">
            <span className="dashboard-positive">
              {formatNumber(statistics.activeUsers)}
            </span>

            <span>active</span>
          </div>
        </div>
      </section>

      {/* CHARTS */}
      <section className="dashboard-chart-grid">
        {/* WORKFORCE */}
        <div className="dashboard-card dashboard-chart-card">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Workforce Overview</h2>

              <p className="dashboard-panel-subtitle">Employee status</p>
            </div>

            <span className="dashboard-chart-badge">
              {statistics.totalEmployees}
            </span>
          </div>

          <DonutChart
            data={employeeChartData}
            centerValue={formatNumber(statistics.totalEmployees)}
            centerLabel="Employees"
          />
        </div>

        {/* ACCOUNTS */}
        <div className="dashboard-card dashboard-chart-card">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Account Overview</h2>

              <p className="dashboard-panel-subtitle">User account status</p>
            </div>

            <span className="dashboard-chart-badge">
              {statistics.totalUsers}
            </span>
          </div>

          <DonutChart
            data={accountChartData}
            centerValue={formatNumber(statistics.totalUsers)}
            centerLabel="Accounts"
          />
        </div>

        {/* DEPARTMENTS */}
        <div className="dashboard-card dashboard-chart-card">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Employees by Department</h2>

              <p className="dashboard-panel-subtitle">Workforce distribution</p>
            </div>

            <span className="dashboard-chart-badge">
              {dashboard.departments.length}
            </span>
          </div>

          <DonutChart
            data={departmentChartData}
            centerValue={formatNumber(statistics.totalEmployees)}
            centerLabel="Employees"
          />
        </div>
      </section>
    </div>
  );
}
