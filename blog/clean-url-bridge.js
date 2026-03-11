(() => {
  const hasTrailingSlash = /\/$/.test(window.location.pathname);
  const path = window.location.pathname.replace(/\/+$/, "");
  const slug = path.split("/").pop();
  const relativePrefix = hasTrailingSlash ? "../" : "./";

  if (!slug || slug === "blog") {
    window.location.replace("./");
    return;
  }

  fetch(`${relativePrefix}${slug}.html`, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Article not found: ${slug}`);
      }
      return response.text();
    })
    .then((html) => {
      const hasBaseTag = /<base\s/i.test(html);
      const patchedHtml = hasBaseTag
        ? html
        : html.replace(/<head(\s[^>]*)?>/i, (headTag) => `${headTag}\n    <base href="${relativePrefix}">`);

      document.open();
      document.write(patchedHtml);
      document.close();
    })
    .catch(() => {
      window.location.replace(`${relativePrefix}${slug}.html`);
    });
})();
