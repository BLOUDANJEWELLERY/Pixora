import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

const Header: React.FC = () => {
  const router = useRouter();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Civil ID", path: "/civil-id" },
    { name: "Back Extend", path: "/back-extend" },
    { name: "Remove BG", path: "/remove-bg" },
  ];

  return (
    <header
      style={{
        backgroundColor: "#f9f4ef",
        borderBottom: "2px solid #c1a36d",
        padding: "1rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h1 style={{ color: "#704214", fontWeight: 700, fontSize: "1.5rem" }}>
        My Project
      </h1>
      <nav>
        <ul
          style={{
            display: "flex",
            gap: "1.5rem",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                style={{
                  color:
                    router.pathname === item.path ? "#b8860b" : "#704214",
                  textDecoration: "none",
                  fontWeight:
                    router.pathname === item.path ? 700 : 500,
                  borderBottom:
                    router.pathname === item.path
                      ? "2px solid #b8860b"
                      : "2px solid transparent",
                  paddingBottom: "0.2rem",
                  transition: "all 0.2s ease",
                }}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Header;