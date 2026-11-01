// app/windows/FaqContent.tsx
import Image from "next/image";

const partners = [
  { name: "UQAC",       src: "/images/UQAC LOGO.webp" },
  { name: "LAR.i",      src: "/images/LARI LOGO.webp" },
  { name: "LIMA",        src: "/images/LIMA LOGO.webp" },
  { name: "MAGE-UQAC",  src: "/images/Mage UQAC.webp" },
  { name: "Genium360",   src: "/images/Genuim LOGO.webp" },
  { name: "FQ",          src: "/images/FOIQ LOGO.webp" },
];

function chunk<T>(arr: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < arr.length; i += size) rows.push(arr.slice(i, i + size));
  return rows;
}

export function FaqContent() {
  const rows = chunk(partners, 2);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: "flex", gap: 14, justifyContent: "center" }}>
          {row.map(({ name, src }) => (
            <div
              key={name}
              className="bg-white rounded-md flex items-center justify-center shadow-md"
              style={{ width: 200, height: 110, padding: 14 }}
            >
              <Image
                src={src}
                alt={name}
                width={170}
                height={85}
                className="object-contain"
                style={{ maxWidth: 170, maxHeight: 85 }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
