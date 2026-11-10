import { describe, expect, it } from "vitest";
import { goBack, registerBack } from "../back";
import { toFileUri } from "../ocr";

describe("photo paths for the text reader", () => {
  it("turns the camera's bare path into a file URI", () => {
    expect(toFileUri("/data/user/0/com.x/cache/p.jpg")).toBe("file:///data/user/0/com.x/cache/p.jpg");
    expect(toFileUri("file:///a.jpg")).toBe("file:///a.jpg");
    expect(toFileUri("content://media/1")).toBe("content://media/1");
  });
});

describe("Android back", () => {
  it("goes back one step at a time, deepest first", () => {
    const log: string[] = [];
    const offTab = registerBack(0, () => log.push("tab"));
    const offSheet = registerBack(1, () => log.push("sheet"));
    const offStep = registerBack(2, () => log.push("step"));
    // a second sheet opened later (e.g. picker over a sheet) wins over the first
    const offSheet2 = registerBack(1, () => log.push("sheet2"));
    goBack(); offStep();
    goBack(); offSheet2();
    goBack(); offSheet();
    goBack(); offTab();
    expect(goBack()).toBe(false);
    expect(log).toEqual(["step", "sheet2", "sheet", "tab"]);
  });
});
