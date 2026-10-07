const control = document.querySelector("#interval");
const output = document.querySelector("#interval-value");
control?.addEventListener("input", () => {
  const interval = Number(control.value);
  output.value = String(interval);
  document.querySelectorAll("[data-point]").forEach((point) => {
    const index = Number(point.dataset.point) % 7;
    point.setAttribute("cx", String(280 + (index - 3) * interval));
  });
});
