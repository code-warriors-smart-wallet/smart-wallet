import puppeteer from "puppeteer";

export async function getPdfFromHTML(html: string): Promise<Uint8Array<ArrayBufferLike>> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "20px",
      bottom: "20px",
      left: "20px",
      right: "20px"
    }
  });

  await browser.close();
  return pdfBuffer;
}