import { describe, expect, it } from "vitest";
import { escaparAtributo, generarCodigoEmbed } from "../embed";

const ID = "84ae641e-7298-42f5-9f5a-93e2e41e6dfd";
const BASE = "https://autogestion.tiempo.hn";

describe("generarCodigoEmbed", () => {
  it("horizontal: proporción del video y ancho máximo 720", () => {
    const html = generarCodigoEmbed({ id: ID, titulo: "Nota", ancho: 1280, alto: 720, baseUrl: BASE });
    expect(html).toContain("max-width:720px");
    expect(html).toContain("aspect-ratio:1280/720");
    expect(html).toContain(`src="${BASE}/embed/${ID}"`);
  });

  it("vertical: ancho máximo 360", () => {
    const html = generarCodigoEmbed({ id: ID, titulo: "Nota", ancho: 720, alto: 1280, baseUrl: BASE });
    expect(html).toContain("max-width:360px");
    expect(html).toContain("aspect-ratio:720/1280");
  });

  it("cuadrado cuenta como horizontal", () => {
    const html = generarCodigoEmbed({ id: ID, titulo: "Nota", ancho: 720, alto: 720, baseUrl: BASE });
    expect(html).toContain("max-width:720px");
  });

  it("quita la barra final de la URL base", () => {
    const html = generarCodigoEmbed({ id: ID, titulo: "Nota", ancho: 16, alto: 9, baseUrl: `${BASE}//` });
    expect(html).toContain(`src="${BASE}/embed/${ID}"`);
  });

  it("escapa el título para que no pueda romper el atributo", () => {
    const html = generarCodigoEmbed({
      id: ID,
      titulo: `"><script>alert('x')</script>&`,
      ancho: 16,
      alto: 9,
      baseUrl: BASE,
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain('title="&quot;&gt;&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;&amp;"');
  });

  it("rechaza ids que no son UUID", () => {
    expect(() => generarCodigoEmbed({ id: `${ID}" onload="x`, titulo: "t", ancho: 1, alto: 1, baseUrl: BASE })).toThrow();
    expect(() => generarCodigoEmbed({ id: "../../vouchers", titulo: "t", ancho: 1, alto: 1, baseUrl: BASE })).toThrow();
  });

  it("rechaza dimensiones inválidas", () => {
    expect(() => generarCodigoEmbed({ id: ID, titulo: "t", ancho: 0, alto: 9, baseUrl: BASE })).toThrow();
    expect(() => generarCodigoEmbed({ id: ID, titulo: "t", ancho: 16.5, alto: 9, baseUrl: BASE })).toThrow();
    expect(() => generarCodigoEmbed({ id: ID, titulo: "t", ancho: 16, alto: -9, baseUrl: BASE })).toThrow();
  });
});

describe("escaparAtributo", () => {
  it("escapa los cinco caracteres peligrosos", () => {
    expect(escaparAtributo(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });
});
