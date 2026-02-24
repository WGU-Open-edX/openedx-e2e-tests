import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://studio.local.openedx.io:8001/');
  await page.getByRole('textbox', { name: 'Username or email' }).click();
  await page.getByRole('textbox', { name: 'Username or email' }).fill('jesus.balderrama.wgu@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Studio home' })).toBeVisible();

  await page.getByRole('button', { name: 'New course' }).click();
  await page.getByRole('textbox', { name: 'Course name' }).click();
  await page.getByRole('textbox', { name: 'Course name' }).fill('New Course4');
  await page.getByTestId('formControl').click();
  await page.getByTestId('formControl').fill('Test');

  await page.getByRole('textbox', { name: 'Course number' }).click();
  await page.getByRole('textbox', { name: 'Course number' }).fill('4');
  await page.getByRole('textbox', { name: 'Course run' }).click();
  await page.getByRole('textbox', { name: 'Course run' }).fill('2026_T1');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByTestId('course-lock-up-block')).toContainText('New Course4');
});
