import puppeteer from "puppeteer";

let browserPool = null;

export const getBrowserPool = async () => {
  if (!browserPool) {
    browserPool = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserPool;
};

export const closeBrowserPool = async () => {
  if (browserPool) {
    await browserPool.close();
    browserPool = null;
  }
};
