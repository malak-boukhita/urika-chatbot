const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const html = readFileSync(`${__dirname}/../frontend/index.html`, 'utf8');
const script = readFileSync(`${__dirname}/../frontend/script.js`, 'utf8');

function setup(t) {
  const dom = new JSDOM(html, { runScripts: 'outside-only', virtualConsole: new VirtualConsole() });
  t.after(() => dom.window.close());
  dom.window.eval(`${script}\nwindow.sendMessage = sendMessage;`);
  const { document } = dom.window;
  const el = selector => document.querySelector(selector);
  const escape = () => document.activeElement.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
    key: 'Escape', bubbles: true, cancelable: true,
  }));
  return { window: dom.window, document, el, escape };
}

for (const opener of ['#hero-button', '#chatbot-toggler']) {
  for (const close of ['button', 'Escape', 'toggle']) {
    test(`${opener} returns focus after ${close} closure`, async t => {
      const { document, el, escape } = setup(t);
      el(opener).click();
      assert.equal(document.activeElement, el('#message-input'));
      assert.equal(el('#chatbot-popup').getAttribute('role'), 'dialog');
      assert.equal(el('#chatbot-popup').getAttribute('aria-modal'), 'false');
      assert.equal(el(`#${el('#chatbot-popup').getAttribute('aria-labelledby')}`).textContent, 'Assistant URIKA CLOUD');
      for (const selector of ['#hero-button', '#chatbot-toggler']) {
        assert.equal(el(selector).getAttribute('aria-expanded'), 'true');
        assert.equal(el(selector).getAttribute('aria-controls'), 'chatbot-popup');
        assert.equal(el(selector).getAttribute('aria-haspopup'), 'dialog');
      }
      if (close === 'Escape') escape();
      else el(close === 'button' ? '#close-chatbot' : '#chatbot-toggler').click();
      assert.equal(document.activeElement, el(opener));
      assert.equal(el('#chatbot-popup').getAttribute('aria-hidden'), 'true');
      assert.equal(el('#chatbot-popup').inert, true);
      for (const selector of ['#hero-button', '#chatbot-toggler']) {
        assert.equal(el(selector).getAttribute('aria-expanded'), 'false');
      }
      await new Promise(resolve => setTimeout(resolve, 250));
      assert.equal(document.activeElement, el(opener));
    });
  }
}

for (const outcome of ['success', 'failure']) {
  test(`pending ${outcome} cannot move focus back into a closed popup`, async t => {
    const { window, document, el, escape } = setup(t);
    let finish;
    window.fetch = () => new Promise(resolve => { finish = resolve; });
    el('#hero-button').click();
    const reply = window.sendMessage('Bonjour');
    assert.equal(el('#message-input').disabled, true);
    assert.equal(document.activeElement, el('#close-chatbot'));
    escape();
    finish({ ok: outcome === 'success', status: 500, json: async () => ({ answer: 'Réponse' }) });
    await reply;
    assert.equal(document.activeElement, el('#hero-button'));
    assert.equal(el('#message-input').disabled, false);
    assert.equal(el('.user-message .message-content').textContent, 'Bonjour');
    assert.ok(el(outcome === 'success' ? '.bot-message:last-child' : '.error-message'));
  });
}

test('suggestions preserve the opener; reopening during loading focuses close', async t => {
  const { window, document, el, escape } = setup(t);
  let finish;
  window.fetch = () => new Promise(resolve => { finish = resolve; });
  el('#hero-button').click();
  el('.suggestion-button').focus();
  el('.suggestion-button').click();
  escape();
  assert.equal(document.activeElement, el('#hero-button'));
  el('#chatbot-toggler').click();
  assert.equal(document.activeElement, el('#close-chatbot'));
  escape();
  finish({ ok: true, json: async () => ({ answer: 'Réponse' }) });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(document.activeElement, el('#chatbot-toggler'));
});

test('reply preserves outside focus, and Escape outside leaves the non-modal popup open', async t => {
  const { window, document, el, escape } = setup(t);
  let finish;
  window.fetch = () => new Promise(resolve => { finish = resolve; });
  el('#hero-button').click();
  const reply = window.sendMessage('Bonjour');
  el('#hero-button').focus();
  escape();
  assert.equal(el('#chatbot-popup').getAttribute('aria-hidden'), 'false');
  finish({ ok: true, json: async () => ({ answer: 'Réponse' }) });
  await reply;
  assert.equal(document.activeElement, el('#hero-button'));
});

test('normal reply returns focus to input; removed opener falls back to toggler', async t => {
  const { window, document, el, escape } = setup(t);
  window.fetch = async () => ({ ok: true, json: async () => ({ answer: 'Réponse' }) });
  el('#hero-button').click();
  await window.sendMessage('Bonjour');
  assert.equal(document.activeElement, el('#message-input'));
  el('#hero-button').remove();
  escape();
  assert.equal(document.activeElement, el('#chatbot-toggler'));
});
