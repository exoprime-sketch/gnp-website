import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const read = (relativePath) =>
  readFile(path.join(projectRoot, relativePath), "utf8");

const [ko, en, notFound, cname, sitemap, robots] = await Promise.all([
  read("index.html"),
  read("en/index.html"),
  read("404.html"),
  read("CNAME"),
  read("sitemap.xml"),
  read("robots.txt"),
]);

assert(cname.trim() === "greennetpower.com", "CNAME must remain greennetpower.com");
assert(ko.includes('<html lang="ko">'), "Korean page must declare lang=ko");
assert(en.includes('<html lang="en">'), "English page must declare lang=en");
assert(
  ko.includes('<link rel="canonical" href="https://greennetpower.com/">'),
  "Korean canonical URL is missing",
);
assert(
  en.includes('<link rel="canonical" href="https://greennetpower.com/en/">'),
  "English canonical URL is missing",
);
assert(
  [ko, en].every(
    (html) =>
      html.includes('hreflang="ko"') &&
      html.includes('hreflang="en"') &&
      html.includes('hreflang="x-default"'),
  ),
  "Every locale must include ko, en, and x-default hreflang links",
);
assert(
  ko.includes('property="og:locale" content="ko_KR"'),
  "Korean Open Graph locale is missing",
);
assert(
  en.includes('property="og:locale" content="en_US"'),
  "English Open Graph locale is missing",
);
assert(
  en.includes('property="og:image" content="https://greennetpower.com/assets/og-image.jpg"'),
  "English Open Graph image URL is missing",
);
assert(
  !/[가-힣]/u.test(en),
  "English output contains unexpected Korean user-facing text",
);
assert(
  !/{{\s*[^}]+\s*}}/.test(ko + en),
  "Generated pages contain unresolved locale tokens",
);
assert(
  [ko, en].every(
    (html) =>
      html.includes('class="menu-toggle"') &&
      html.includes('class="mobile-menu"') &&
      html.includes('class="lang-switch'),
  ),
  "Desktop/mobile navigation or language switcher is missing",
);
assert(
  ko.includes('href="tel:01034663726"') &&
    en.includes('href="tel:+821034663726"') &&
    [ko, en].every((html) =>
      html.includes('href="mailto:roundyou@hotmail.com"'),
    ),
  "Phone or email contact link is missing",
);
assert(
  [
    "power flow, short-circuit, and transient stability studies",
    "Power System Studies, Grid Planning &amp; Markets",
    "Development of an Ethiopian Electricity Tariff Negotiation Framework",
    "coordinated control system for FACTS devices",
    "Registered Professional Engineer Office",
  ].every((phrase) => en.includes(phrase)),
  "English output is missing reviewed industry terminology",
);
assert(
  ![
    "FACTS coordinated-control system",
    "national grid advisory programs",
    "commissioned technical training",
    "T&amp;D Planning",
    "shared-use transmission-line review",
  ].some((phrase) => en.includes(phrase)),
  "English output contains terminology retired by the industry review",
);
assert(
  notFound.includes("Green Net Power") && /[가-힣]/u.test(notFound),
  "404 page must provide both Korean and English guidance",
);
assert(
  sitemap.includes("<loc>https://greennetpower.com/</loc>") &&
    sitemap.includes("<loc>https://greennetpower.com/en/</loc>"),
  "Sitemap must include both locale URLs",
);
assert(
  robots.includes("https://greennetpower.com/sitemap.xml"),
  "robots.txt must reference the sitemap",
);

const projectImages = [...ko.matchAll(/<img\b[^>]*\balt="([^"]*)"[^>]*>/g)];
assert(projectImages.length === 7, "Expected seven project images");
assert(
  projectImages.every((match) => match[1].trim().length > 0),
  "Every project image must have localized alt text",
);

for (const requiredFile of [
  ".nojekyll",
  "assets/og-image.jpg",
  "src/locales/ko.json",
  "src/locales/en.json",
  "src/site.template.html",
]) {
  try {
    await access(path.join(projectRoot, requiredFile));
  } catch {
    failures.push(`Missing required file: ${requiredFile}`);
  }
}

if (failures.length > 0) {
  console.error(`Validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Static bilingual site validation passed.");
