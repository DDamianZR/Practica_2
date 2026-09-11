const BACKGROUND_COLOR = "#07090c";
const INLINE_PROPS = ["stroke", "fill", "stroke-width", "stroke-dasharray", "opacity"] as const;

function inlineComputedStyles(original: Element, clone: Element): void {
  if (original.tagName.toLowerCase() === "defs") return;

  const computed = getComputedStyle(original);
  const style = INLINE_PROPS.map((prop) => `${prop}:${computed.getPropertyValue(prop)}`).join(";");
  clone.setAttribute("style", style);

  const originalChildren = Array.from(original.children);
  const cloneChildren = Array.from(clone.children);
  for (let i = 0; i < originalChildren.length; i++) {
    inlineComputedStyles(originalChildren[i], cloneChildren[i]);
  }
}

function prepareClone(svg: SVGSVGElement): { clone: SVGSVGElement; width: number; height: number } {
  const width = svg.width.baseVal.value || svg.viewBox.baseVal.width;
  const height = svg.height.baseVal.value || svg.viewBox.baseVal.height;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  inlineComputedStyles(svg, clone);

  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("x", "0");
  bg.setAttribute("y", "0");
  bg.setAttribute("width", String(width));
  bg.setAttribute("height", String(height));
  bg.setAttribute("fill", BACKGROUND_COLOR);
  clone.insertBefore(bg, clone.firstChild);

  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));

  return { clone, width, height };
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadTimingSvg(svg: SVGSVGElement, filename: string): void {
  const { clone } = prepareClone(svg);
  const serialized = new XMLSerializer().serializeToString(clone);
  triggerDownload(new Blob([serialized], { type: "image/svg+xml;charset=utf-8" }), filename);
}

export function downloadTimingPng(svg: SVGSVGElement, filename: string, scale = 2): void {
  const { clone, width, height } = prepareClone(svg);
  const serialized = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) triggerDownload(blob, filename);
    }, "image/png");
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(serialized);
}
