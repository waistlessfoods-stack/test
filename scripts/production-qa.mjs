import "dotenv/config";

import { createHmac, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, request } from "@playwright/test";
import { createClient } from "contentful";
import postgres from "postgres";

const BASE_URL = process.env.QA_BASE_URL || "https://www.waistlessfoods.com";
const QA_SCOPE = process.env.QA_SCOPE || "all";
const runId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomBytes(3).toString("hex")}`;
const outputDirectory = path.resolve("output", "production-qa-2026-08-17");
const screenshotDirectory = path.join(outputDirectory, "screenshots");
const reportPath = path.join(
  outputDirectory,
  QA_SCOPE === "all" ? "results.json" : `results-${QA_SCOPE}.json`
);

const report = {
  runId,
  scope: QA_SCOPE,
  startedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  summary: { passed: 0, failed: 0, warnings: 0 },
  checks: [],
  browser: [],
  notes: [],
};

function addCheck(name, passed, details = {}, severity = "error") {
  report.checks.push({ name, passed, severity, details });
  if (passed) report.summary.passed += 1;
  else if (severity === "warning") report.summary.warnings += 1;
  else report.summary.failed += 1;
}

function maskEmail(email) {
  const [local, domain] = String(email).split("@");
  if (!domain) return "invalid-email";
  return `${local.slice(0, 2)}***@${domain}`;
}

function qaInboxAddress() {
  const source = process.env.Email || process.env.ADMIN_EMAIL || "qa@waistlessfoods.com";
  const [local, domain] = source.trim().toLowerCase().split("@");
  if (!local || !domain) return `qa-${runId}@example.com`;
  return `${local.split("+")[0]}+qa-${runId.slice(-12)}@${domain}`.toLowerCase();
}

async function responseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function checkRouteResponses(api) {
  const requiredRoutes = [
    "/",
    "/about",
    "/services",
    "/services/private",
    "/services/catering",
    "/services/cooking-classes",
    "/recipes",
    "/shop",
    "/blog",
    "/links",
    "/signin",
    "/signup",
    "/admin/reviews",
    "/unsubscribe",
  ];

  const sitemapResponse = await api.get("/sitemap.xml");
  const sitemapText = await sitemapResponse.text();
  const sitemapRoutes = [...sitemapText.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((match) => new URL(match[1]).pathname)
    .filter((route) => !requiredRoutes.includes(route));
  const routes = [...new Set([...requiredRoutes, ...sitemapRoutes])];
  const results = [];

  for (const route of routes) {
    const response = await api.get(route, { timeout: 30_000 });
    results.push({ route, status: response.status(), ok: response.status() < 400 });
  }

  addCheck(
    "All required and sitemap routes return a non-error response",
    results.every((result) => result.ok),
    { tested: results.length, failures: results.filter((result) => !result.ok) }
  );
  addCheck("Production sitemap is available", sitemapResponse.status() === 200, {
    status: sitemapResponse.status(),
    discoveredRoutes: sitemapRoutes.length,
  });
}

function getEntryLabel(fields) {
  return String(
    fields.name || fields.title || fields.label || fields.slug || fields.internalName || ""
  ).trim();
}

function getAssetIds(value) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values.map((item) => item?.sys?.id).filter(Boolean);
}

async function checkContentfulIndependence() {
  const space = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
  const accessToken =
    process.env.CONTENTFUL_DELIVERY_TOKEN || process.env.NEXT_PUBLIC_CONTENTFUL_DELIVERY_TOKEN;
  const environment =
    process.env.Contentful_environment || process.env.CONTENTFUL_ENVIRONMENT || "master";

  if (!space || !accessToken) {
    addCheck(
      "Contentful delivery configuration is available",
      false,
      { reason: "Delivery credentials are missing from the QA environment." }
    );
    return;
  }

  const client = createClient({ space, accessToken, environment });
  const categories = await client.getEntries({ content_type: "recipeCategory", limit: 100 });
  const categoryMap = new Map(
    categories.items.map((entry) => [getEntryLabel(entry.fields).toLowerCase(), entry])
  );
  const breakfast = [...categoryMap.entries()].find(([label]) => label.includes("breakfast"))?.[1];
  const dessert = [...categoryMap.entries()].find(([label]) => label.includes("dessert"))?.[1];
  const breakfastIds = getAssetIds(breakfast?.fields.image || breakfast?.fields.imageAsset);
  const dessertIds = getAssetIds(dessert?.fields.image || dessert?.fields.imageAsset);
  const categoriesIndependent =
    breakfastIds.length > 0 &&
    dessertIds.length > 0 &&
    !breakfastIds.some((id) => dessertIds.includes(id));

  addCheck("Breakfast and Dessert use independent published Contentful assets", categoriesIndependent, {
    breakfastFound: Boolean(breakfast),
    dessertFound: Boolean(dessert),
    breakfastAssetCount: breakfastIds.length,
    dessertAssetCount: dessertIds.length,
    sameAsset: breakfastIds.some((id) => dessertIds.includes(id)),
  });

  const services = await client.getEntries({ content_type: "service", limit: 100 });
  const expectedSlugs = ["private", "catering", "cooking-classes"];
  const secondaryByService = {};
  for (const slug of expectedSlugs) {
    const entry = services.items.find((item) => String(item.fields.slug || "") === slug);
    secondaryByService[slug] = getAssetIds(entry?.fields.galleryImages || entry?.fields.subImages);
  }
  const allSecondaryIds = Object.values(secondaryByService).flat();
  const uniqueSecondaryIds = new Set(allSecondaryIds);
  const allHaveImages = expectedSlugs.every((slug) => secondaryByService[slug].length > 0);
  const noOverlap = uniqueSecondaryIds.size === allSecondaryIds.length;

  addCheck(
    "Private Chef, Catering, and Cooking Classes use independent secondary assets",
    allHaveImages && noOverlap,
    {
      counts: Object.fromEntries(
        expectedSlugs.map((slug) => [slug, secondaryByService[slug].length])
      ),
      totalAssets: allSecondaryIds.length,
      uniqueAssets: uniqueSecondaryIds.size,
    }
  );
}

async function scrollPage(page) {
  await page.evaluate(async () => {
    const height = document.documentElement.scrollHeight;
    for (let y = 0; y < height; y += Math.max(window.innerHeight * 0.8, 400)) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(250);
}

async function inspectBrowserPage(browser, viewportName, viewport, route) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    window.sessionStorage.setItem("waistlessfoods-site-unlocked", "true");
  });
  const page = await context.newPage();
  const runtimeErrors = [];
  const failedRequests = [];
  const badResponses = [];

  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("requestfailed", (req) => {
    const url = req.url();
    if (!url.includes("google-analytics.com") && !url.includes("googletagmanager.com")) {
      failedRequests.push({ url, reason: req.failure()?.errorText });
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      const url = response.url();
      if (!url.includes("google-analytics.com") && !url.includes("googletagmanager.com")) {
        badResponses.push({ url, status: response.status() });
      }
    }
  });

  const response = await page.goto(`${BASE_URL}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });
  await page.waitForTimeout(800);
  await scrollPage(page);

  const diagnostics = await page.evaluate(() => {
    const brokenImages = [...document.images]
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src)
      .slice(0, 10);
    return {
      title: document.title,
      h1: document.querySelector("h1")?.textContent?.trim() || "",
      horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
      brokenImages,
    };
  });

  const fileName = `${viewportName}-${route === "/" ? "home" : route.slice(1).replaceAll("/", "-")}.png`;
  await page.screenshot({ path: path.join(screenshotDirectory, fileName), fullPage: false });

  const result = {
    viewport: viewportName,
    route,
    status: response?.status() || 0,
    ...diagnostics,
    runtimeErrors,
    failedRequests: failedRequests.slice(0, 10),
    badResponses: badResponses.slice(0, 10),
  };
  report.browser.push(result);

  await context.close();
}

async function checkResponsiveBrowser() {
  const browser = await chromium.launch({ headless: true });
  try {
    const matrix = {
      desktop: {
        viewport: { width: 1440, height: 1000 },
        routes: ["/", "/about", "/services/private", "/services/catering", "/services/cooking-classes", "/recipes", "/shop", "/signin", "/signup"],
      },
      tablet: {
        viewport: { width: 1024, height: 1366 },
        routes: ["/", "/about", "/services/private", "/recipes", "/signin", "/signup"],
      },
      mobile: {
        viewport: { width: 390, height: 844 },
        routes: ["/", "/about", "/services/private", "/recipes", "/shop", "/signin", "/signup"],
      },
    };

    for (const [viewportName, configuration] of Object.entries(matrix)) {
      for (const route of configuration.routes) {
        await inspectBrowserPage(browser, viewportName, configuration.viewport, route);
      }
    }

    const pageResultsPass = report.browser.every(
      (item) =>
        item.status < 400 &&
        item.horizontalOverflow <= 1 &&
        item.brokenImages.length === 0 &&
        item.runtimeErrors.length === 0 &&
        item.badResponses.length === 0
    );
    addCheck("Responsive browser matrix has no page, overflow, image, or runtime failures", pageResultsPass, {
      pagesTested: report.browser.length,
      failures: report.browser.filter(
        (item) =>
          item.status >= 400 ||
          item.horizontalOverflow > 1 ||
          item.brokenImages.length > 0 ||
          item.runtimeErrors.length > 0 ||
          item.badResponses.length > 0
      ),
    });

    const layoutContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await layoutContext.addInitScript(() => {
      window.sessionStorage.setItem("waistlessfoods-site-unlocked", "true");
    });
    const layoutPage = await layoutContext.newPage();
    await layoutPage.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    const desktopPortrait = layoutPage.locator('img[alt="Chef Amber"]').first();
    const desktopHeading = layoutPage.getByRole("heading", { name: /message from the chef/i });
    await desktopPortrait.scrollIntoViewIfNeeded();
    await desktopPortrait.waitFor({ state: "visible", timeout: 10_000 });
    const [desktopPortraitBox, desktopHeadingBox] = await Promise.all([
      desktopPortrait.boundingBox(),
      desktopHeading.boundingBox(),
    ]);
    addCheck(
      "Homepage chef portrait appears left of the message on desktop",
      Boolean(desktopPortraitBox && desktopHeadingBox && desktopPortraitBox.x < desktopHeadingBox.x),
      { portraitFound: Boolean(desktopPortraitBox), headingFound: Boolean(desktopHeadingBox) }
    );

    await layoutContext.close();
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await mobileContext.addInitScript(() => {
      window.sessionStorage.setItem("waistlessfoods-site-unlocked", "true");
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    const mobilePortrait = mobilePage.locator('img[alt="Chef Amber"]').first();
    await mobilePortrait.scrollIntoViewIfNeeded();
    await mobilePortrait.waitFor({ state: "visible", timeout: 10_000 });
    const mobilePortraitBox = await mobilePortrait.boundingBox();
    const mobileHeadingBox = await mobilePage
      .getByRole("heading", { name: /message from the chef/i })
      .boundingBox();
    addCheck(
      "Homepage chef portrait appears before the message on mobile",
      Boolean(mobilePortraitBox && mobileHeadingBox && mobilePortraitBox.y < mobileHeadingBox.y),
      { portraitFound: Boolean(mobilePortraitBox), headingFound: Boolean(mobileHeadingBox) }
    );
    await mobileContext.close();

    const stickyContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await stickyContext.addInitScript(() => {
      window.sessionStorage.setItem("waistlessfoods-site-unlocked", "true");
    });
    const stickyPage = await stickyContext.newPage();
    await stickyPage.goto(`${BASE_URL}/about`, { waitUntil: "domcontentloaded" });
    await stickyPage.evaluate(() => window.scrollTo(0, Math.min(1400, document.body.scrollHeight / 2)));
    await stickyPage.waitForTimeout(300);
    const stickyMetrics = await stickyPage.evaluate(() => {
      const header = document.querySelector("header");
      const portrait = document.querySelector(".about-sticky-portrait");
      return {
        headerTop: header?.getBoundingClientRect().top ?? null,
        headerBottom: header?.getBoundingClientRect().bottom ?? null,
        portraitTop: portrait?.getBoundingClientRect().top ?? null,
      };
    });
    addCheck(
      "About-page sticky portrait clears the measured sticky header",
      stickyMetrics.headerTop !== null &&
        Math.abs(stickyMetrics.headerTop) <= 1 &&
        stickyMetrics.portraitTop !== null &&
        stickyMetrics.headerBottom !== null &&
        stickyMetrics.portraitTop >= stickyMetrics.headerBottom,
      stickyMetrics
    );
    await stickyContext.close();
  } finally {
    await browser.close();
  }
}

async function checkReviewLifecycle(api, sql) {
  const email = `qa-review-${runId.slice(-12)}@example.com`.toLowerCase();
  const name = `Production QA ${runId.slice(-6)}`;
  const reviewText = `Production QA moderation lifecycle ${runId}. This record must never remain after the test.`;
  let reviewId = null;
  let admin = null;

  try {
    const invalidResponse = await api.post("/api/reviews", {
      data: { serviceSlug: "private", name: "Q", email: "invalid", rating: 9, reviewText: "short" },
    });
    addCheck("Review endpoint rejects invalid input", invalidResponse.status() === 400, {
      status: invalidResponse.status(),
    });

    const submission = await api.post("/api/reviews", {
      data: { serviceSlug: "private", name, email, rating: 5, reviewText },
    });
    addCheck("Review endpoint accepts a valid submission as pending", submission.status() === 201, {
      status: submission.status(),
      email: maskEmail(email),
    });

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) throw new Error("ADMIN_PASSWORD is missing from the QA environment.");
    admin = await request.newContext({ baseURL: BASE_URL });
    try {
      const login = await admin.post("/api/admin/verify", { data: { password: adminPassword } });
      addCheck("Production review administrator login works", login.status() === 200, {
        status: login.status(),
      });

      let listing = null;
      let listingBody = null;
      let review = null;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        listing = await admin.post("/api/admin/reviews");
        listingBody = await responseJson(listing);
        review = listingBody?.reviews?.find((item) => item.email === email);
        if (review) break;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      reviewId = review?.id || null;
      addCheck("Submitted review is stored as pending in moderation", review?.status === "pending", {
        listingStatus: listing?.status() || null,
        listingError: listingBody?.error || null,
        reviewCount: Array.isArray(listingBody?.reviews) ? listingBody.reviews.length : null,
        found: Boolean(review),
        status: review?.status || null,
      });

      const pendingPage = await api.get("/services/private");
      const pendingHtml = await pendingPage.text();
      addCheck("Pending review is hidden from the public service page", !pendingHtml.includes(runId), {});

      if (!reviewId) return;
      const approval = await admin.patch("/api/admin/reviews", {
        data: { reviewId, status: "approved" },
      });
      addCheck("Administrator can approve a pending review", approval.status() === 200, {
        status: approval.status(),
      });

      const approvedPage = await api.get(`/services/private?qa=${Date.now()}`);
      const approvedHtml = await approvedPage.text();
      addCheck("Approved review appears publicly after revalidation", approvedHtml.includes(runId), {});

      const returnToPending = await admin.patch("/api/admin/reviews", {
        data: { reviewId, status: "pending" },
      });
      const hiddenAgainPage = await api.get(`/services/private?qa=${Date.now() + 1}`);
      const hiddenAgainHtml = await hiddenAgainPage.text();
      addCheck(
        "Administrator can return an approved review to pending and hide it",
        returnToPending.status() === 200 && !hiddenAgainHtml.includes(runId),
        { status: returnToPending.status() }
      );

      const deletion = await admin.delete("/api/admin/reviews", { data: { reviewId } });
      addCheck("Administrator can permanently delete a review", deletion.status() === 200, {
        status: deletion.status(),
      });
      reviewId = null;
    } finally {
      await admin.dispose();
      admin = null;
    }
  } finally {
    if (admin) {
      try {
        const listing = await admin.post("/api/admin/reviews");
        const listingBody = await responseJson(listing);
        const staleReviews = (listingBody?.reviews || []).filter((item) => item.email === email);
        for (const review of staleReviews) {
          await admin.delete("/api/admin/reviews", { data: { reviewId: review.id } });
        }
      } finally {
        await admin.dispose();
      }
    }
    await sql`delete from service_reviews where email = ${email}`;
    await sql`delete from rate_limit_buckets where key = ${`service_reviews:email:${email}`}`;
  }
}

async function checkNewsletterLifecycle(api, sql) {
  const email = qaInboxAddress();
  let subscriberId = null;
  try {
    const invalid = await api.post("/api/newsletter", { data: { email: "not-an-email" } });
    addCheck("Newsletter endpoint rejects an invalid email", invalid.status() === 400, {
      status: invalid.status(),
    });

    const subscription = await api.post("/api/newsletter", { data: { email } });
    const subscriptionBody = await responseJson(subscription);
    subscriberId = subscriptionBody?.data?.id || null;
    addCheck("Newsletter endpoint accepts a new subscriber", subscription.status() === 201 && Boolean(subscriberId), {
      status: subscription.status(),
      email: maskEmail(email),
      subscriberCreated: Boolean(subscriberId),
    });

    const duplicate = await api.post("/api/newsletter", { data: { email } });
    addCheck("Duplicate active subscription is handled without a second record", duplicate.status() === 200, {
      status: duplicate.status(),
    });

    if (!subscriberId) throw new Error("Newsletter QA did not receive a subscriber ID.");
    const invalidToken = await api.post("/api/newsletter/unsubscribe", {
      form: { subscriber: String(subscriberId), token: "0".repeat(64) },
      maxRedirects: 0,
    });
    addCheck(
      "Unsubscribe endpoint rejects an invalid signed token",
      invalidToken.status() === 303 && invalidToken.headers().location?.includes("status=invalid"),
      { status: invalidToken.status(), location: invalidToken.headers().location || null }
    );

    const secret =
      process.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
      process.env.ADMIN_SESSION_SECRET ||
      process.env.ADMIN_PASSWORD;
    if (!secret) throw new Error("No newsletter unsubscribe signing secret is available.");
    const token = createHmac("sha256", secret)
      .update(`${subscriberId}:${email.trim().toLowerCase()}`)
      .digest("hex");
    const unsubscribe = await api.post("/api/newsletter/unsubscribe", {
      form: { subscriber: String(subscriberId), token },
      maxRedirects: 0,
    });
    const [subscriber] = await sql`select active, unsubscribed_at from subscribers where id = ${subscriberId}`;
    addCheck(
      "Signed unsubscribe link deactivates the subscriber",
      unsubscribe.status() === 303 &&
        unsubscribe.headers().location?.includes("status=success") &&
        subscriber?.active === false &&
        Boolean(subscriber?.unsubscribed_at),
      { status: unsubscribe.status(), databaseActive: subscriber?.active ?? null }
    );

    report.notes.push(
      "The live newsletter endpoint accepted the QA mailbox and attempted the branded welcome email. The HTTP response cannot prove inbox placement because email delivery errors are logged server-side without failing subscription creation."
    );
  } finally {
    await sql`delete from subscribers where email = ${email}`;
    await sql`delete from rate_limit_buckets where key = ${`newsletter:email:${email}`}`;
  }
}

async function main() {
  await mkdir(screenshotDirectory, { recursive: true });
  const api = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { "x-qa-run": runId } });
  const sql = process.env.DATABASE_URL
    ? postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 15 })
    : null;

  try {
    const runStep = async (name, task) => {
      try {
        await task();
      } catch (error) {
        addCheck(`${name} completed without an unhandled error`, false, {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    };

    if (QA_SCOPE === "all" || QA_SCOPE === "routes") {
      await runStep("Route smoke tests", () => checkRouteResponses(api));
    }
    if (QA_SCOPE === "all" || QA_SCOPE === "contentful") {
      await runStep("Contentful asset checks", checkContentfulIndependence);
    }
    if (QA_SCOPE === "all" || QA_SCOPE === "browser") {
      await runStep("Responsive browser checks", checkResponsiveBrowser);
    }

    if ((QA_SCOPE === "all" || QA_SCOPE === "lifecycle") && !sql) {
      addCheck("Database-backed QA can run", false, { reason: "DATABASE_URL is missing." });
    } else if (QA_SCOPE === "all" || QA_SCOPE === "lifecycle") {
      await runStep("Review lifecycle", () => checkReviewLifecycle(api, sql));
      await runStep("Newsletter lifecycle", () => checkNewsletterLifecycle(api, sql));
    }
  } catch (error) {
    addCheck("QA runner completed without an unhandled error", false, {
      message: error instanceof Error ? error.message : String(error),
    });
  } finally {
    report.finishedAt = new Date().toISOString();
    if (sql) await sql.end({ timeout: 5 });
    await api.dispose();
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  process.stdout.write(
    `${JSON.stringify({ reportPath, summary: report.summary, checks: report.checks.map(({ name, passed, severity }) => ({ name, passed, severity })) }, null, 2)}\n`
  );
  process.exitCode = report.summary.failed > 0 ? 1 : 0;
}

await main();
