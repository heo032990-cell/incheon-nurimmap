(() => {
  const panel = document.querySelector("#programSearch");
  const filters = document.querySelector("#programFilters");
  const toggle = document.querySelector("#toggleSearchFilters");
  if (!panel || !filters || !toggle) return;
  const compactQuery = window.matchMedia("(max-width: 1199px)");
  let userChoice = null;
  function setExpanded(expanded) {
    panel.classList.toggle("filtersCollapsed", !expanded);
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.textContent = expanded ? "검색조건 접기" : "검색조건 펼치기";
  }
  function applyViewport() {
    if (!compactQuery.matches) setExpanded(true);
    else setExpanded(userChoice === null ? false : userChoice);
  }
  toggle.addEventListener("click", () => {
    userChoice = toggle.getAttribute("aria-expanded") !== "true";
    setExpanded(userChoice);
  });
  compactQuery.addEventListener?.("change", applyViewport);
  document.querySelector("#resetFilters")?.addEventListener("click", () => {
    if (compactQuery.matches) { userChoice = false; setExpanded(false); }
  });
  applyViewport();
})();