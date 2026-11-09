import { expect, test, type Page } from '@playwright/test';

async function act(page: Page, label: string) {
  await page.getByRole('button', { name: label, exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Confirm action', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

test('operator invitation, customer choice, missing-data failure and verified replay', async ({
  browser,
}) => {
  const operatorContext = await browser.newContext();
  const customerContext = await browser.newContext();
  const monthlyContext = await browser.newContext();
  const operator = await operatorContext.newPage();
  const customer = await customerContext.newPage();
  const monthly = await monthlyContext.newPage();
  const base =
    test.info().project.use.baseURL ??
    process.env.PLAYWRIGHT_TEST_BASE_URL ??
    'http://localhost:3000';
  try {
    await operator.goto(`${base}/lanka`);
    await operator.getByRole('button', { name: 'Enter operator sandbox', exact: true }).click();
    await expect(
      operator.getByRole('heading', { name: 'An informed view. A traceable decision.' })
    ).toBeVisible();
    await act(operator, 'Review new demo cycle');
    await act(operator, 'Review invitation');
    await expect(operator.getByText('Invitation published', { exact: true })).toBeVisible();

    await customer.goto(`${base}/customer`);
    await customer.getByRole('button', { name: 'Enter interval customer', exact: true }).click();
    await expect(customer.getByText('DEMO-A', { exact: true })).toBeVisible();
    expect((await customerContext.request.get(`${base}/api/lanka?account=DEMO-B`)).status()).toBe(
      403
    );
    expect(
      (
        await customerContext.request.post(`${base}/api/lanka`, {
          headers: { origin: base },
          data: { action: 'publish', version: 0 },
        })
      ).status()
    ).toBe(403);
    await act(customer, 'Review acceptance');
    await expect(
      customer.getByText('Customer accepted · not yet verified', { exact: true })
    ).toBeVisible();
    await operator.reload();
    await act(operator, 'Review missing-interval test');
    await act(operator, 'Review replay verification');
    await expect(
      operator.getByRole('alert').filter({ hasText: 'Verification blocked' })
    ).toBeVisible();
    await act(operator, 'Review interval restoration');
    await act(operator, 'Review replay verification');
    await expect(operator.getByText('Synthetic replay verified', { exact: true })).toBeVisible();
    await expect(operator.getByText('Net across measured window', { exact: true })).toBeVisible();
    await operator.reload();
    await expect(operator.getByText('Synthetic replay verified', { exact: true })).toBeVisible();

    await monthly.goto(`${base}/customer`);
    await monthly.getByRole('button', { name: 'Enter monthly-only customer', exact: true }).click();
    await expect(monthly.getByText('DEMO-B', { exact: true })).toBeVisible();
    await expect(monthly.getByText('Monthly only', { exact: true })).toBeVisible();
    await expect(
      monthly.getByRole('button', { name: 'Review acceptance', exact: true })
    ).toHaveCount(0);
    await expect(monthly.getByText('Net across measured window', { exact: true })).toHaveCount(0);
    expect((await monthlyContext.request.get(`${base}/api/lanka?account=DEMO-A`)).status()).toBe(
      403
    );

    await customer.reload();
    await expect(customer.getByText('Synthetic replay verified', { exact: true })).toBeVisible();
  } finally {
    await operatorContext.close();
    await customerContext.close();
    await monthlyContext.close();
  }
});

test('operator and customer layouts support mobile, themes and keyboard cancellation', async ({
  page,
}) => {
  await page.goto('/lanka');
  await page.getByRole('button', { name: 'Enter operator sandbox', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'An informed view. A traceable decision.' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Review new demo cycle', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    await expect(
      page.getByRole('heading', { name: 'An informed view. A traceable decision.' })
    ).toBeVisible();
    expect(
      await page.locator('main').evaluate((main) => main.scrollWidth <= main.clientWidth + 1)
    ).toBe(true);
    for (const theme of ['dark', 'light']) {
      if (
        await page
          .locator('html')
          .evaluate((html, target) => !html.classList.contains(target), theme)
      ) {
        await page.getByRole('button', { name: 'Change theme' }).click();
      }
      await page.locator('main').evaluate((main) => {
        main.scrollTop = 0;
      });
      await page.screenshot({ path: `../../design/shots/lanka-${width}-${theme}.png` });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Switch demo persona' }).click();
  await page.getByRole('button', { name: 'Enter interval customer', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Your electricity, with context.' })
  ).toBeVisible();
  expect(
    await page.locator('main').evaluate((main) => main.scrollWidth <= main.clientWidth + 1)
  ).toBe(true);
  await page.screenshot({ path: '../../design/shots/customer-390-light.png' });
});
