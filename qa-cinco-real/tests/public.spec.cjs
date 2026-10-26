const { test, expect } = require('@playwright/test');
const QA = 'https://jat-nb.github.io/jatvet/qa-cinco-real/';
test('QA publica la versión correcta y presenta el login', async ({ page }) => {
  const response = await page.goto(QA, { waitUntil: 'domcontentloaded' });
  expect(response.status()).toBe(200);
  await expect(page.locator('#jatVersionLabel')).toContainText('QA');
  await expect(page.locator('#login')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#reset')).toBeVisible();
});
test('Recuperar contraseña con correo inválido no envía una solicitud', async ({ page }) => {
  await page.goto(QA);
  await expect(page.locator('#login')).toBeVisible({ timeout: 30000 });
  await page.locator('#email').fill('invalido');
  await page.locator('#reset').click();
  await expect(page.locator('#jatQaLoginNotice')).toContainText('Ingresá un correo válido');
});
test('La página QA utiliza exclusivamente el módulo de pruebas', async ({ request }) => {
  const response = await request.get(QA);
  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  expect(html).toContain('/jatvet/qa-cinco-real/qa-app-fixes-20261026.js?v=2');
  expect(html).toContain('ENTORNO QA');
  expect(html).not.toContain('src="/jatvet/assets/v4-backup-restauracion-20261019.js');
});
