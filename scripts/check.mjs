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
      html.includes('class="lang-switch') &&
      html.includes('class="skip-link"') &&
      html.includes('id="audience"') &&
      html.includes('id="approach"'),
  ),
  "Navigation, language switching, accessibility, or client journey sections are missing",
);
assert(
  [ko, en].every(
    (html) =>
      html.includes("body.menu-open{overflow:hidden;padding-right:") &&
      html.includes("document.body.classList.toggle(\"menu-open\", isOpen)") &&
      html.includes('link.setAttribute("aria-current", "location")') &&
      html.includes("target.scrollIntoView({") &&
      html.includes('window.history.pushState(null, "", targetHash)') &&
      !html.includes("html{scroll-behavior:smooth"),
  ),
  "Navigation state, controlled scrolling, or full-screen mobile menu behavior is missing",
);
assert(
  [ko, en].every(
    (html) =>
      html.includes("requestedLanguage === currentLanguage") &&
      html.includes("activeSectionId") &&
      html.includes("supportedHashes.has(visibleSectionHash)") &&
      html.includes("window.location.assign(destination.href)"),
  ),
  "Locale switching must avoid current-language reloads and preserve valid sections",
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
    "Rigorous Power System Studies",
    "Utilities &amp; Grid Operators",
    "Power System Studies, Grid Planning &amp; Markets",
    "Clear evidence for the next decision",
    "A clear path from technical question to recommendation",
    "Development of an Ethiopian Electricity Tariff Negotiation Framework",
    "Automated &amp; Coordinated Control System for FACTS (UPFC)",
    "Professional Engineer Office",
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
  [ko, en].every(
    (html) =>
      html.includes('<script type="application/ld+json">') &&
      html.includes('"@type": "ProfessionalService"') &&
      html.includes("target.focus({ preventScroll: true })") &&
      html.includes('activeId === "approach" ? "services" : activeId'),
  ),
  "Structured data, skip-link focus, or approach navigation mapping is missing",
);

for (const [locale, html] of [
  ["ko", ko],
  ["en", en],
]) {
  const structuredData = html.match(
    /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/,
  );
  try {
    JSON.parse(structuredData?.[1] ?? "");
  } catch {
    failures.push(`${locale} JSON-LD must be valid JSON`);
  }

  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const missingAnchorTargets = [
    ...html.matchAll(/href="#([^"]+)"/g),
  ]
    .map((match) => match[1])
    .filter((target) => !ids.has(target));
  assert(
    missingAnchorTargets.length === 0,
    `${locale} page contains links to missing section IDs: ${missingAnchorTargets.join(", ")}`,
  );
}
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
