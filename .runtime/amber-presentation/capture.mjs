import { createRequire } from 'node:module';
const require = createRequire('C:/Users/MSI/code/waistlessfoods/package.json');
require('dotenv').config({ quiet: true });
const { chromium } = require('@playwright/test');
const browser = await chromium.launch({ headless: true });
try {
 const page = await browser.newPage({ viewport: {width: 1400, height: 1000} });
 await page.goto((process.env.WALKTHROUGH_BASE_URL || 'https://www.waistlessfoods.com') + '/admin/walkthrough');
 await page.locator('#password').fill(process.env.ADMIN_PASSWORD);
 await page.getByRole('button', {name:'Access Admin'}).click();
 await page.getByRole('heading', {name:'Your website, step by step.', exact:true}).waitFor();
 await page.screenshot({path:'.runtime/amber-presentation/walkthrough.png'});
 console.log('Captured live guide without customer records.');
} finally {await browser.close();}
