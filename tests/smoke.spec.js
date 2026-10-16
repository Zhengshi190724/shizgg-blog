import { expect, test } from '@playwright/test';

const systemVerilogOverviewRoute = '/posts/systemverilog-sv章节学习笔记-sv学习1-概述/';

const publicRoutes = [
  '/',
  '/posts/',
  '/archive/',
  '/about/',
  '/maps/systemverilog/',
  '/categories/learning/',
  '/categories/learning/aat/',
  '/categories/technology/systemverilog/',
  '/posts/aat-关键词-因果/',
  systemVerilogOverviewRoute,
  '/posts/markdown_note/',
];

for (const route of publicRoutes) {
  test(`${route} renders without browser errors or horizontal overflow`, async ({ page }) => {
    const browserErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text());
    });
    page.on('pageerror', (error) => browserErrors.push(error.message));

    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBe(true);
    await expect(page.locator('#root')).toBeVisible();
    expect(browserErrors).toEqual([]);

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(hasOverflow).toBe(false);
  });
}

test('article route exposes canonical and social metadata', async ({ page }) => {
  await page.goto('/posts/markdown_note/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Markdown 实用教程/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/posts\/markdown_note\/$/);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/social-card\.png$/);
  await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute('content', '2026-07-13');
});

test('homepage presents the updated identity and animated welcome message', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('link', { name: 'SZ Blog 首页' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '欢迎来到我的空间！' })).toBeVisible();
  await expect(page.getByText('个人Blog · 2026')).toBeVisible();
  await expect(page.getByText('SHANNXI · CN')).toBeVisible();
  await expect(page.locator('.typewriter__visual')).toHaveText(/感谢你的访问！/, { timeout: 3000 });
});

test('homepage shows a complete static welcome message when motion is reduced', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.typewriter__visual')).toHaveText('感谢你的访问！');
  await expect(page.locator('.typewriter__caret')).toBeHidden();
});

test('article body and full-text search load Markdown on demand', async ({ page }) => {
  await page.goto(systemVerilogOverviewRoute, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.post-body')).toContainText('进程间的通信机制', { timeout: 5000 });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '搜索文章' }).click();
  await page.getByPlaceholder('搜索文章、标签或正文…').fill('semaphore');
  await expect(page.locator('.search-results')).toContainText('SystemVerilog 学习笔记（一）：概述', { timeout: 5000 });
});

test('Mermaid code blocks render as responsive diagrams and follow the site theme', async ({ page }) => {
  await page.goto(systemVerilogOverviewRoute, { waitUntil: 'domcontentloaded' });

  const diagram = page.locator('.mermaid-diagram').first();
  await expect(diagram.locator('svg')).toBeVisible({ timeout: 10000 });
  await expect(diagram).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('pre code.language-mermaid')).toHaveCount(0);

  await page.getByRole('button', { name: '切换至浅色模式' }).click();
  await expect(diagram).toHaveAttribute('data-theme', 'light');
  await expect(diagram.locator('svg')).toBeVisible({ timeout: 10000 });
});

test('safe inline font colors render without exposing raw HTML', async ({ page }) => {
  await page.goto('/posts/aat-关键词-并列/', { waitUntil: 'domcontentloaded' });

  const emphasis = page.getByText('正确选项——对文段全面概括或提取共性', { exact: true });
  await expect(emphasis).toBeVisible();
  await expect(emphasis).toHaveClass(/markdown-text-color--red/);
  await expect(page.locator('.post-body')).not.toContainText('<font color=');
  await expect(emphasis).toHaveCSS('color', 'rgb(255, 77, 79)');
});

test('article media is responsive, stable, and zoomable', async ({ page }) => {
  await page.goto(systemVerilogOverviewRoute, { waitUntil: 'domcontentloaded' });
  const media = page.locator('.article-media').first();
  const image = media.locator('img');

  await expect(media).toBeVisible({ timeout: 5000 });
  await expect(image).toHaveAttribute('loading', 'lazy');
  await expect(image).toHaveAttribute('width', '632');
  await expect(image).toHaveAttribute('height', '360');
  await expect(media.locator('source[type="image/avif"]')).toHaveAttribute('srcset', /480w\.avif 480w/);
  await expect(media.locator('source[type="image/webp"]')).toHaveAttribute('srcset', /480w\.webp 480w/);
  await expect(media.locator('figcaption')).toHaveText('整体验证层级图');

  await media.locator('.article-media__trigger').click();
  await expect(page.getByRole('dialog', { name: '整体验证层级图' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '整体验证层级图' })).toBeHidden();
});

test('protocol article images load from published assets', async ({ page }) => {
  const articles = [
    ['/posts/ic-fpga-ic笔面试之各种协议-code-i2c-code/', 4],
    ['/posts/ic-fpga-ic笔面试之各种协议-code-spi-code/', 6],
    ['/posts/ic-fpga-ic笔面试之各种协议-code-uart-code/', 3],
    ['/posts/ic-fpga-ic笔面试之各种协议-ic笔面试之串行协议/', 8],
  ];

  for (const [route, expectedImages] of articles) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const images = page.locator('.post-body .article-media img');
    await expect(images).toHaveCount(expectedImages);

    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
    }
  }
});

test('ambient media uses the local poster when motion is reduced', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.ambient-media video')).toHaveCount(0);
  const background = await page.locator('.ambient-media').evaluate((element) => getComputedStyle(element).backgroundImage);
  expect(background).toContain('ambient-poster.jpg');
});

test('series progress and related ranking connect ordered posts', async ({ page }) => {
  await page.goto('/posts/markdown_note/', { waitUntil: 'domcontentloaded' });
  const series = page.getByRole('navigation', { name: '系列：Markdown 写作与发布' });

  await expect(series).toContainText('1 / 2');
  await expect(series.getByRole('link', { name: /Markdown 实用教程/ })).toHaveAttribute('aria-current', 'page');
  await expect(series.getByRole('link', { name: /如何一键创建和发布 Markdown 文章/ })).toBeVisible();
  await expect(page.locator('.related-posts__list a').first()).toContainText('如何一键创建和发布 Markdown 文章');
});

test('posts page omits learning maps while direct content-map routes remain available', async ({ page }) => {
  await page.goto('/posts/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Learning maps')).toHaveCount(0);
  await expect(page.locator('a[href="/maps/systemverilog/"]')).toHaveCount(0);

  await page.goto('/maps/systemverilog/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'SystemVerilog' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '语言基础' })).toBeVisible();
  await expect(page.locator(`main a[href="${systemVerilogOverviewRoute}"]`).first()).toBeVisible();
});

test('article navigation shows only ordered top-level categories', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const articleMenu = page.locator('.header-nav .nav-group').filter({ hasText: '文章' });
  await expect(articleMenu.locator('.nav-dropdown a')).toHaveText([
    '技术',
    '生活',
    '娱乐',
    '学习',
    '杂项',
  ]);

  await expect(articleMenu.locator('a', { hasText: 'SystemVerilog' })).toHaveCount(0);
  await expect(articleMenu.locator('a', { hasText: 'AAT' })).toHaveCount(0);

  await page.goto('/categories/technology/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('navigation', { name: '技术细分类' }).getByRole('link', { name: 'SystemVerilog' })).toBeVisible();

  await page.goto('/categories/learning/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('navigation', { name: '学习细分类' }).getByRole('link', { name: 'AAT' })).toBeVisible();

  await page.goto('/categories/technology/systemverilog/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'SystemVerilog' })).toBeVisible();
  await expect(page.locator(`.post-card-link[href="${systemVerilogOverviewRoute}"]`)).toBeVisible();
});

test('nested AAT and SystemVerilog notes appear in their folder-backed subcategories', async ({ page }) => {
  await page.goto('/categories/learning/aat/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'AAT' })).toBeVisible();
  await expect(page.getByRole('link', { name: '行测言语：因果关系', exact: true })).toBeVisible();

  await page.goto('/categories/technology/systemverilog/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('link', { name: 'SystemVerilog：event 与 mailbox', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'SystemVerilog 学习笔记（二）：数据类型', exact: true })).toBeVisible();
});

test('local reading history migrates legacy data and records zero-result searches', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('shane-blog-analytics-v1', JSON.stringify({
      pageViews: { '/legacy/': 2 },
      completedArticles: {},
      searches: 3,
      totalViews: 2,
    }));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });

  const migrated = await page.evaluate(() => window.blogReadingHistory.snapshot());
  expect(migrated.pageViews['/legacy/']).toBe(2);
  expect(migrated.legacySearchCount).toBe(3);

  await page.getByRole('button', { name: '搜索文章' }).click();
  await page.getByPlaceholder('搜索文章、标签或正文…').fill('绝对不存在的搜索词 xyz');
  await expect(page.locator('.search-empty')).toBeVisible({ timeout: 5000 });
  await expect.poll(async () => page.evaluate(() => (
    window.blogReadingHistory.snapshot().searchQueries.at(-1)?.resultCount
  ))).toBe(0);
});

test('article exposes copy-link and system-share actions', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (value) => { window.__copiedUrl = value; } },
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data) => { window.__sharedData = data; },
    });
  });
  await page.goto('/posts/markdown_note/', { waitUntil: 'domcontentloaded' });

  const actions = page.getByRole('group', { name: '文章分享操作' });
  await actions.getByRole('button', { name: '复制链接' }).click();
  await expect(actions.getByRole('status')).toHaveText('链接已复制');
  await expect.poll(() => page.evaluate(() => window.__copiedUrl)).toMatch(/\/posts\/markdown_note\/$/);

  await actions.getByRole('button', { name: '分享' }).click();
  await expect.poll(() => page.evaluate(() => window.__sharedData?.title)).toContain('Markdown 实用教程');
});
