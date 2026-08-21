import { expect, test } from '@playwright/test'

test('serves deep content URLs from static files', async ({ page }) => {
	const response = await page.goto('/posts/hello-static-sites')
	expect(response?.status()).toBe(200)
	await expect(page.getByRole('heading', { level: 1 })).toContainText(
		'Static pages',
	)
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		'href',
		'https://example.com/posts/hello-static-sites',
	)
})

test('hydrates navigation between generated pages', async ({ page }) => {
	await page.goto('/posts')
	await page.getByRole('link', { name: 'Next' }).click()
	await expect(page).toHaveURL('/posts/page/2')
	await expect(page.getByText('Page 2')).toBeVisible()
})

test('serves the generated 404 document with a 404 status', async ({
	page,
}) => {
	const response = await page.goto('/missing-page')
	expect(response?.status()).toBe(404)
	await expect(
		page.getByRole('heading', { name: 'Page not found' }),
	).toBeVisible()
})
