import { Link } from "react-router";

interface FlowCard {
  id: string;
  title: string;
  description: string;
  path: string;
  complexity: "Simple" | "Advanced";
  features: string[];
}

const flows: FlowCard[] = [
  {
    id: "simple",
    title: "Simple Flow",
    description: "Linear flow: welcome → profile → preferences → complete",
    path: "/simple",
    complexity: "Simple",
    features: [
      "Linear step progression",
      "Basic form handling",
      "State persistence",
      "Smooth animations",
    ],
  },
  {
    id: "advanced",
    title: "Advanced Flow",
    description: "Branching flow with conditional paths based on user choices",
    path: "/advanced",
    complexity: "Advanced",
    features: [
      "Conditional branching",
      "Context-driven navigation",
      "Component-driven navigation",
      "Business vs personal paths",
    ],
  },
];

export function FlowGallery() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "3rem 1.5rem",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        <header style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              color: "white",
              marginBottom: "0.75rem",
              margin: 0,
            }}
          >
            useFlow Examples
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              color: "rgba(255, 255, 255, 0.9)",
              maxWidth: "600px",
              margin: "0.75rem auto 0",
            }}
          >
            Explore different flow patterns and implementations
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "1.5rem",
            marginBottom: "3rem",
          }}
        >
          {flows.map((flow) => (
            <Link
              key={flow.id}
              to={flow.path}
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              {/** biome-ignore lint/a11y/noStaticElementInteractions: ignore */}
              <div
                style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 15px 40px rgba(0, 0, 0, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 30px rgba(0, 0, 0, 0.2)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    marginBottom: "0.75rem",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "#1a202c",
                      margin: 0,
                    }}
                  >
                    {flow.title}
                  </h2>
                  <span
                    style={{
                      background:
                        flow.complexity === "Simple" ? "#48bb78" : "#ed8936",
                      color: "white",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {flow.complexity}
                  </span>
                </div>

                <p
                  style={{
                    color: "#4a5568",
                    marginBottom: "1rem",
                    fontSize: "0.9rem",
                    lineHeight: "1.5",
                    margin: "0 0 1rem 0",
                  }}
                >
                  {flow.description}
                </p>

                <div>
                  <h3
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      color: "#2d3748",
                      margin: "0 0 0.5rem 0",
                      textAlign: "left",
                    }}
                  >
                    Features
                  </h3>
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.4rem",
                    }}
                  >
                    {flow.features.map((feature, index) => (
                      <li
                        key={index}
                        style={{
                          fontSize: "0.85rem",
                          color: "#718096",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span style={{ color: "#667eea" }}>✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  style={{
                    marginTop: "1rem",
                    paddingTop: "1rem",
                    borderTop: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      color: "#667eea",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                    }}
                  >
                    View Demo
                  </span>
                  <span style={{ color: "#667eea", fontSize: "1.1rem" }}>
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <footer
          style={{
            textAlign: "center",
            marginTop: "auto",
            paddingTop: "2rem",
            color: "rgba(255, 255, 255, 0.8)",
            fontSize: "0.85rem",
          }}
        >
          <p style={{ margin: 0 }}>
            Built with{" "}
            <a
              href="https://github.com/yourusername/useflow"
              style={{ color: "white", textDecoration: "underline" }}
            >
              @useflow/react
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
