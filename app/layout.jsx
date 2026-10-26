import "./globals.css";

export const metadata = {
  title: "Financeiro Pessoal",
  description: "Planejamento financeiro pessoal com cenários (Planos A, B, C…)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 transition-colors duration-200 antialiased dark:bg-slate-950 dark:text-slate-100" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
