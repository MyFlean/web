(function () {
  function fetchSync(url) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, false);
      xhr.send(null);
      if (xhr.status < 200 || xhr.status >= 300) return "";
      return String(xhr.responseText || "").trim();
    } catch (e) {
      return "";
    }
  }

  function currentPageFile() {
    var path = (window.location.pathname || "/").replace(/\/+$/, "");
    var leaf = path.slice(path.lastIndexOf("/") + 1).toLowerCase();
    if (!leaf) return "index.html";
    if (!leaf.endsWith(".html")) return leaf + ".html";
    return leaf;
  }

  /** Match prior per-page footers: highlight Home on marketing + policy pages; About/Contact on those pages. */
  function applyFooterNavActive() {
    var leaf = currentPageFile();
    var companyActive = "index.html";
    if (leaf === "about.html") companyActive = "about.html";
    else if (leaf === "contact.html") companyActive = "contact.html";

    document.querySelectorAll("footer.footer a[href]").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href !== "index.html" && href !== "about.html" && href !== "contact.html") return;
      var active = href === companyActive;
      var mt = href === "index.html" ? "15px" : "12px";
      var base = "display:block;margin-top:" + mt + ";text-decoration:none;";
      if (active) a.setAttribute("style", base + "color:#fdc700;font-weight:600;");
      else a.setAttribute("style", base + "color:#d6d6d6;");
    });

    var activeCompanyClass =
      "font-['Manrope'] text-[14px] leading-6 text-[#fdc700] hover:underline";
    var inactiveCompanyClass =
      "font-['Manrope'] text-[14px] leading-6 text-[#d6d6d6] hover:text-white hover:underline";

    document.querySelectorAll("main.mobile-view > footer nav[aria-label='Company'] a").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      a.setAttribute(
        "class",
        href === companyActive ? activeCompanyClass : inactiveCompanyClass
      );
    });
  }

  var desktopMount = document.querySelector("[data-site-footer-desktop]");
  var mobileMount = document.querySelector("[data-site-footer-mobile]");
  if (!desktopMount && !mobileMount) return;

  // Site root-relative so nested paths (e.g. /onelink/) still load canonical partials.
  var desktopHtml = desktopMount ? fetchSync("/partials/footer-desktop.html") : "";
  var mobileHtml = mobileMount ? fetchSync("/partials/footer-mobile.html") : "";

  if (desktopMount && desktopHtml) desktopMount.outerHTML = desktopHtml;
  if (mobileMount && mobileHtml) mobileMount.outerHTML = mobileHtml;

  applyFooterNavActive();
  window.dispatchEvent(new Event("resize"));
})();
