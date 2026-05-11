import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { coordinatorAPI } from "../../services/api";
import {
  Card,
  StatCard,
  LoadingPage,
  Button,
  Badge,
} from "../../components/ui";
import toast from "react-hot-toast";

const BRANCH_COLORS = [
  "#00d4ff",
  "#7c3aed",
  "#00e676",
  "#ff6b35",
  "#ff4757",
  "#ffd700",
  "#ff69b4",
  "#00bcd4",
  "#9c27b0",
];

export default function CoordinatorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    coordinatorAPI
      .getDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPage text="Loading dashboard..." />;
  if (!data) return <div>Failed to load</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "32px",
              fontWeight: 800,
              marginBottom: "4px",
            }}
          >
            Placement Dashboard
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Overview of all batches and placement statistics
          </p>
        </div>
        <Button
          onClick={() => navigate("/coordinator/drives/new")}
          style={{
            background: "var(--accent-primary)",
            color: "var(--bg-primary)",
            padding: "12px 24px",
            borderRadius: "var(--radius)",
            fontWeight: 700,
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "none",
            cursor: "pointer",
          }}
        >
          + New Drive
        </Button>
      </div>

      {/* Summary Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        <StatCard
          label="Active Drives"
          value={data.summary.activeDrives}
          icon="🏢"
          color="var(--accent-primary)"
        />
        <StatCard
          label="Completed Drives"
          value={data.summary.frozenDrives}
          icon="✅"
          color="var(--accent-green)"
        />
        <StatCard
          label="Off-Campus Drives"
          value={data.summary.totalOffCampusDrives}
          icon="🌐"
          color="#7c3aed"
        />
        <StatCard
          label="Total On-Campus"
          value={data.summary.totalOnCampusDrives}
          icon="📊"
          color="var(--accent-orange)"
        />
      </div>

      {/* Batch Pie Charts */}
      <div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "22px",
            marginBottom: "20px",
          }}
        >
          Batch-wise Placement Statistics
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {data.batchData.map((batch) => {
            const pieData = batch.branches
              .filter((b) => b.total > 0)
              .map((b, i) => ({
                name: b.branch,
                value: b.total,
                selected: b.selected,
                fill: BRANCH_COLORS[i % BRANCH_COLORS.length],
              }));

            return (
              <Card key={batch.batch} glow style={{ cursor: "pointer" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "20px",
                        fontWeight: 700,
                      }}
                    >
                      Batch {batch.batch}
                    </h3>
                    <p
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "13px",
                        marginTop: "2px",
                      }}
                    >
                      {batch.selected}/{batch.total} placed •{" "}
                      {batch.placementPercent}%
                    </p>
                  </div>
                  <Badge
                    variant={
                      batch.placementPercent >= 70
                        ? "success"
                        : batch.placementPercent >= 40
                          ? "warning"
                          : "danger"
                    }
                  >
                    {batch.placementPercent}%
                  </Badge>
                </div>

                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} opacity={0.85} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(val, name, props) => [
                        `${props.payload.selected}/${val} placed`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Branch breakdown */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    marginBottom: "16px",
                  }}
                >
                  {pieData.map((b, i) => (
                    <div
                      key={b.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        navigate(
                          `/coordinator/students?batch=${batch.batch}&branch=${b.name}`,
                        )
                      }
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: b.fill,
                        }}
                      />
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {b.name}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() =>
                      navigate(`/coordinator/students?batch=${batch.batch}`)
                    }
                    style={{
                      flex: 1,
                      padding: "8px",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      fontSize: "12px",
                      transition: "var(--transition)",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.borderColor = "var(--accent-primary)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.borderColor = "var(--border)")
                    }
                  >
                    👥 View Students
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/coordinator/drives?batch=${batch.batch}`)
                    }
                    style={{
                      flex: 1,
                      padding: "8px",
                      background: "var(--accent-primary)",
                      border: "none",
                      borderRadius: "8px",
                      color: "var(--bg-primary)",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    📊 Track Placements
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
