// app/windows/ContactsContent.tsx
import Image from "next/image";

export function ContactsContent({ isDark }: { isDark: boolean }) {
  const icons = [
    {
      label: "Facebook",
      href: "https://www.facebook.com/share/14ZexcTKDPQ/?mibextid=wwXIfr",
      src: isDark ? "/images/Light Facebook.webp" : "/images/Dark Facebook.webp",
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/cruqac_robotique?igsh=MWo3NmRxZTRjem9hMw==",
      src: isDark ? "/images/Light Instagram.webp" : "/images/Dark Instagram.webp",
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/club-de-robotique-cruqac-94ab29385?utm_source=share_via&utm_content=profile&utm_medium=member_ios",
      src: isDark ? "/images/Light LinkedIn.webp" : "/images/Dark LinkedIn.webp",
    },
    {
      label: "Email",
      href: "mailto:clubrobotuqac@gmail.com",
      src: isDark ? "/images/Light Email.webp" : "/images/Dark Email.webp",
    },
  ];

  return (
    <>
      <p className="mb-30 text-sm">
        Plusieurs façons de contacter CRUQAC afin d&apos;obtenir des informations sur
        la compétition, le club de robotique, ou pour toute autre question.
        N&apos;hésitez pas à nous contacter, via nos réseaux sociaux ou par courriel!
      </p>
      <div className="flex gap-4 justify-center items-center mt-2">
        {icons.map(({ label, href, src }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith("mailto") ? undefined : "_blank"}
            rel="noopener noreferrer"
            aria-label={label}
            className="flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
          >
            <Image src={src} alt={label} width={36} height={36} />
            <span className="text-[10px] uppercase tracking-widest">{label}</span>
          </a>
        ))}
      </div>
    </>
  );
}
