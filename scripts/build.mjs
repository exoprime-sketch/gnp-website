import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = path.join(projectRoot, "src", "site.template.html");
const localesDirectory = path.join(projectRoot, "src", "locales");

const pages = [
  {
    locale: "ko",
    output: path.join(projectRoot, "index.html"),
  },
  {
    locale: "en",
    output: path.join(projectRoot, "en", "index.html"),
  },
];

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const flatten = (value, prefix = "", result = new Map()) => {
  for (const [key, nestedValue] of Object.entries(value)) {
    const token = prefix ? `${prefix}.${key}` : key;
    if (
      nestedValue !== null &&
      typeof nestedValue === "object" &&
      !Array.isArray(nestedValue)
    ) {
      flatten(nestedValue, token, result);
    } else {
      result.set(token, nestedValue);
    }
  }
  return result;
};

const render = (template, messages, locale) => {
  const values = flatten(messages);
  const usedTokens = new Set();

  const html = template.replace(
    /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g,
    (placeholder, token) => {
      if (!values.has(token)) {
        throw new Error(`[${locale}] Missing locale value for ${placeholder}`);
      }
      usedTokens.add(token);
      return escapeHtml(values.get(token));
    },
  );

  const unresolved = html.match(/{{\s*[^}]+\s*}}/g);
  if (unresolved) {
    throw new Error(
      `[${locale}] Unresolved template tokens: ${[...new Set(unresolved)].join(", ")}`,
    );
  }

  return {
    html: `${html.trim()}\n`,
    usedTokens,
  };
};

const template = await readFile(templatePath, "utf8");

for (const page of pages) {
  const localePath = path.join(localesDirectory, `${page.locale}.json`);
  const messages = JSON.parse(await readFile(localePath, "utf8"));
  const { html } = render(template, messages, page.locale);

  await mkdir(path.dirname(page.output), { recursive: true });
  await writeFile(page.output, html, "utf8");
  console.log(
    `Generated ${path.relative(projectRoot, page.output)} (${page.locale})`,
  );
}
