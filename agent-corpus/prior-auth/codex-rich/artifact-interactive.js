const tabs = document.querySelectorAll("[data-tab]");
const result = document.querySelector("#interaction-result");
for (const tab of tabs) tab.addEventListener("click", () => {
  for (const item of tabs) item.setAttribute("aria-selected", String(item === tab));
  result.textContent = "Focused " + tab.dataset.tab;
  result.dataset.interactionResult = "tab:" + tab.dataset.tab;
});
document.querySelector("#copy-export")?.addEventListener("click", () => {
  result.textContent = document.querySelector("#export-note")?.value ?? "";
  result.dataset.interactionResult = "copied";
});
