import type { Plugin, ViteDevServer } from "vite";

/**
 * Prints a colorized FLUX ASCII banner right before Vite's dev URLs.
 * Dev-only (apply: "serve"), so it never runs during production builds.
 */
export function fluxBanner(): Plugin {
  const indigo = "\x1b[38;2;99;102;241m";
  const violet = "\x1b[38;2;167;139;250m";
  const dim = "\x1b[90m";
  const bold = "\x1b[1m";
  const reset = "\x1b[0m";
  const art = [
    "   ███████╗██╗     ██╗   ██╗██╗  ██╗",
    "   ██╔════╝██║     ██║   ██║╚██╗██╔╝",
    "   █████╗  ██║     ██║   ██║ ╚███╔╝ ",
    "   ██╔══╝  ██║     ██║   ██║ ██╔██╗ ",
    "   ██║     ███████╗╚██████╔╝██╔╝ ██╗",
    "   ╚═╝     ╚══════╝ ╚═════╝ ╚═╝  ╚═╝",
  ];

  return {
    name: "flux-banner",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      const printUrls = server.printUrls.bind(server);
      server.printUrls = () => {
        console.log("");
        console.log(art.map((line) => `${bold}${indigo}${line}${reset}`).join("\n"));
        console.log(`   ${violet}Frontend${reset} ${dim}·${reset} React + Vite\n`);
        printUrls();
      };
    },
  };
}
