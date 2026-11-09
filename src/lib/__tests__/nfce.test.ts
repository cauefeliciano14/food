// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { brNumber, isNfceUrl, looksLikeFood, mapUnit, parseNfceHtml, prettyName } from "../nfce";

// Trimmed copy of the national NFC-e consultation page layout.
const SAMPLE = `<html><body>
<div id="conteudo">
  <div class="txtCenter">
    <div id="u20" class="txtTopo">SUPERMERCADO BOM PRECO LTDA</div>
    <div class="text">CNPJ: 00.000.000/0001-00</div>
  </div>
  <table id="tabResult" cellspacing="0" cellpadding="0" align="center" width="100%">
    <tr id="Item + 1">
      <td valign="top"><span class="txtTit">PTO FGO SADIA KG</span><span class="RCod">(Código: 7891 )</span><br>
        <span class="Rqtd"><strong>Qtde.:</strong>0,856</span><span class="RUN"><strong>UN: </strong>KG</span>
        <span class="RvlUnit"><strong>Vl. Unit.:</strong>&nbsp;22,90</span></td>
      <td align="right" valign="top" class="txtTit noWrap">Vl. Total<br><span class="valor">19,60</span></td>
    </tr>
    <tr id="Item + 2">
      <td valign="top"><span class="txtTit">LEITE INT PIRACANJUBA 1L</span><span class="RCod">(Código: 7898 )</span><br>
        <span class="Rqtd"><strong>Qtde.:</strong>6</span><span class="RUN"><strong>UN: </strong>UN</span>
        <span class="RvlUnit"><strong>Vl. Unit.:</strong>&nbsp;4,99</span></td>
      <td align="right" valign="top" class="txtTit noWrap">Vl. Total<br><span class="valor">29,94</span></td>
    </tr>
    <tr id="Item + 3">
      <td valign="top"><span class="txtTit">DETERG YPE NEUTRO 500ML</span><span class="RCod">(Código: 7896 )</span><br>
        <span class="Rqtd"><strong>Qtde.:</strong>1</span><span class="RUN"><strong>UN: </strong>UN</span>
        <span class="RvlUnit"><strong>Vl. Unit.:</strong>&nbsp;2,79</span></td>
      <td align="right" valign="top" class="txtTit noWrap">Vl. Total<br><span class="valor">2,79</span></td>
    </tr>
  </table>
  <div id="infos"><ul><li><strong>Número: </strong>123 <strong>Série: </strong>1 <strong>Emissão: </strong>08/11/2026 18:30:12 - Via Consumidor</li></ul></div>
</div></body></html>`;

describe("NFC-e", () => {
  it("recognizes consultation links", () => {
    expect(isNfceUrl("https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=3526|2|1|1|ABC")).toBe(true);
    expect(isNfceUrl("http://www.fazenda.pr.gov.br/nfce/qrcode?p=4126|2|1")).toBe(true);
    expect(isNfceUrl("https://example.com/?p=1")).toBe(false);
    expect(isNfceUrl("7891000100103")).toBe(false);
  });
  it("parses numbers and units", () => {
    expect(brNumber("1.234,56")).toBe(1234.56);
    expect(brNumber(" 0,856")).toBe(0.856);
    expect(brNumber("6")).toBe(6);
    expect(mapUnit("KG")).toBe("kg");
    expect(mapUnit("UN")).toBe("un");
    expect(mapUnit("LT")).toBe("L");
    expect(mapUnit("XYZ")).toBe("un");
  });
  it("parses the national layout", () => {
    const d = parseNfceHtml(SAMPLE);
    expect(d.store).toBe("SUPERMERCADO BOM PRECO LTDA");
    expect(d.purchaseDate).toBe("2026-11-08");
    expect(d.items).toEqual([
      { rawName: "PTO FGO SADIA KG", quantity: 0.856, unit: "KG", unitPrice: 22.9, total: 19.6 },
      { rawName: "LEITE INT PIRACANJUBA 1L", quantity: 6, unit: "UN", unitPrice: 4.99, total: 29.94 },
      { rawName: "DETERG YPE NEUTRO 500ML", quantity: 1, unit: "UN", unitPrice: 2.79, total: 2.79 },
    ]);
  });
  it("fails clearly on an unknown layout", () => {
    expect(() => parseNfceHtml("<html><body><p>Captcha</p></body></html>")).toThrow(/Não reconheci/);
  });
  it("turns receipt text into readable names", () => {
    expect(prettyName("PTO FGO SADIA KG")).toBe("Peito frango sadia");
    expect(prettyName("LEITE INT PIRACANJUBA 1L")).toBe("Leite integral piracanjuba");
    expect(prettyName("ARROZ T JOAO 5KG")).toBe("Arroz t joao");
    expect(looksLikeFood("Detergente ype neutro")).toBe(false);
    expect(looksLikeFood("Peito frango sadia")).toBe(true);
  });
});
