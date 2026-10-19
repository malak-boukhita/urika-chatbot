const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const { chromium } = require('playwright');

let browser;
before(async () => { browser = await chromium.launch({ headless: true }); });
after(async () => { await browser?.close(); });

async function setup(t) {
  const page = await browser.newPage();
  t.after(() => page.close());
  // Serve the real frontend, with no backend or external font dependency.
  await page.route('https://chatbot.test/**', async route => {
    const filename = new URL(route.request().url()).pathname.slice(1) || 'index.html';
    const contentType = filename.endsWith('.js') ? 'text/javascript'
      : filename.endsWith('.css') ? 'text/css' : 'text/html';
    await route.fulfill({ body: await readFile(`${__dirname}/../frontend/${filename}`), contentType });
  });
  await page.route('https://cdnjs.cloudflare.com/**', route => route.abort());
  await page.goto('https://chatbot.test/');
  return page;
}

async function focused(page, selector) {
  assert.equal(await page.locator(selector).evaluate(el => el === document.activeElement), true,
    `Expected focus on ${selector}`);
}

for (const opener of ['#hero-button', '#chatbot-toggler']) {
  for (const close of ['button', 'Escape', 'toggle']) {
    test(`${opener}: keyboard open and ${close} close restore focus`, async t => {
      const page = await setup(t);
      await page.locator(opener).focus();
      await page.keyboard.press('Enter');
      await focused(page, '#message-input');
      assert.equal(await page.getByRole('dialog', { name: 'Assistant URIKA CLOUD' }).count(), 1);
      for (const trigger of ['#hero-button', '#chatbot-toggler']) {
        assert.equal(await page.locator(trigger).getAttribute('aria-expanded'), 'true');
        assert.equal(await page.locator(trigger).getAttribute('aria-controls'), 'chatbot-popup');
        assert.equal(await page.locator(trigger).getAttribute('aria-haspopup'), 'dialog');
      }
      if (close === 'Escape') await page.keyboard.press('Escape');
      else {
        await page.locator(close === 'button' ? '#close-chatbot' : '#chatbot-toggler').focus();
        await page.keyboard.press('Space');
      }
      await focused(page, opener);
      assert.equal(await page.getByRole('dialog').count(), 0);
      assert.equal(await page.locator('#chatbot-popup').evaluate(el => el.inert), true);
      for (const trigger of ['#hero-button', '#chatbot-toggler']) {
        assert.equal(await page.locator(trigger).getAttribute('aria-expanded'), 'false');
      }
      // Wait beyond the old animation timer to detect stale focus callbacks.
      await page.waitForTimeout(300);
      await focused(page, opener);
      await page.locator('#message-input').evaluate(el => el.focus());
      await focused(page, opener);
    });
  }
}

test('non-modal Tab and Shift+Tab navigation, including the closed popup', async t => {
  const page = await setup(t);
  await page.locator('#hero-button').focus();
  await page.keyboard.press('Tab');
  await focused(page, '#chatbot-toggler');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Shift+Tab');
  await focused(page, '.suggestion-button:last-child');
  await page.keyboard.press('Tab');
  await focused(page, '#message-input');
  await page.keyboard.press('Tab');
  await focused(page, '#send-message');
  await page.locator('#close-chatbot').focus();
  await page.keyboard.press('Shift+Tab');
  await focused(page, '#chatbot-toggler');
  // Escape outside a non-modal dialog leaves it open.
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 1);
  await page.keyboard.press('Tab');
  await focused(page, '#close-chatbot');
  await page.keyboard.press('Escape');
  await focused(page, '#chatbot-toggler');
});

for (const outcome of ['success', 'failure']) {
  test(`pending ${outcome}: Escape closes and response cannot steal focus`, async t => {
    const page = await setup(t);
    let finish;
    const pending = new Promise(resolve => { finish = resolve; });
    await page.route('https://ais.urikacloud.com/chat', async route => {
      await pending;
      await route.fulfill({ status: outcome === 'success' ? 200 : 500,
        contentType: 'application/json', body: JSON.stringify({ answer: 'Réponse test' }) });
    });
    await page.locator('#hero-button').click();
    await page.locator('#message-input').fill('Bonjour');
    await page.keyboard.press('Enter');
    await focused(page, '#close-chatbot');
    await page.keyboard.press('Escape');
    await focused(page, '#hero-button');
    finish();
    await page.waitForFunction(() => !document.querySelector('#message-input').disabled);
    await focused(page, '#hero-button');
    assert.equal(await page.locator('.user-message').count(), 1);
    assert.equal(await page.locator(outcome === 'success' ? '.bot-message:last-child' : '.error-message').count(), 1);
  });
}

test('suggestions and reopening during a request preserve the correct opener', async t => {
  const page = await setup(t);
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  await page.route('https://ais.urikacloud.com/chat', async route => {
    await pending;
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ answer: 'Réponse test' }) });
  });
  await page.locator('#hero-button').click();
  await page.locator('.suggestion-button').first().click();
  await page.keyboard.press('Escape');
  await focused(page, '#hero-button');
  await page.locator('#chatbot-toggler').click();
  await focused(page, '#close-chatbot');
  await page.keyboard.press('Escape');
  await focused(page, '#chatbot-toggler');
  finish();
  await page.waitForFunction(() => !document.querySelector('#message-input').disabled);
  await focused(page, '#chatbot-toggler');
});

test('response respects focus moved outside the chat; Shift+Enter inserts a newline', async t => {
  const page = await setup(t);
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  await page.route('https://ais.urikacloud.com/chat', async route => {
    await pending;
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ answer: 'Réponse test' }) });
  });
  await page.locator('#hero-button').click();
  await page.locator('#message-input').fill('Bonjour');
  await page.keyboard.press('Shift+Enter');
  assert.equal(await page.locator('#message-input').inputValue(), 'Bonjour\n');
  assert.equal(await page.locator('.user-message').count(), 0);
  await page.keyboard.press('Enter');
  await page.locator('#hero-button').focus();
  finish();
  await page.waitForFunction(() => !document.querySelector('#message-input').disabled);
  await focused(page, '#hero-button');
  assert.equal(await page.getByRole('dialog').count(), 1);
});


test('a normal reply restores input focus and retains returned source links', async t => {
  const page = await setup(t);
  await page.route('https://ais.urikacloud.com/chat', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ answer: 'Réponse test', sources: [{ title: 'URIKA', url: 'https://urikacloud.com/' }] }),
  }));
  await page.locator('#hero-button').click();
  await page.locator('#message-input').fill('Bonjour');
  await page.locator('#send-message').click();
  await page.waitForFunction(() => !document.querySelector('#message-input').disabled);
  await focused(page, '#message-input');
  assert.equal(await page.locator('.message-sources a').getAttribute('href'), 'https://urikacloud.com/');
  await page.keyboard.press('Escape');
  await focused(page, '#hero-button');
});

test('if the opener is removed, closing falls back to the floating button', async t => {
  const page = await setup(t);
  await page.locator('#hero-button').click();
  await page.locator('#hero-button').evaluate(el => el.remove());
  await page.keyboard.press('Escape');
  await focused(page, '#chatbot-toggler');
});
