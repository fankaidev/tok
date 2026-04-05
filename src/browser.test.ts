import { Browser } from './browser';

async function test() {
  const browser = new Browser();

  // Test open and snapshot
  await browser.open('data:text/html,<h1>Hello</h1>');
  let tree = await browser.snapshot({ compact: true });
  console.log('Snapshot:', tree);
  if (!tree.includes('Hello')) throw new Error('Expected "Hello" in snapshot');

  // Test navigation info
  const url = await browser.getUrl();
  console.log('URL:', url);
  if (!url.includes('data:text/html')) throw new Error('Expected data URL');

  // Test form interaction
  await browser.open('data:text/html,<input id="email" placeholder="Email">');
  tree = await browser.snapshot({ interactive: true });
  console.log('Form snapshot:', tree);

  // Find the input ref from snapshot
  const match = tree.match(/ref=(e\d+)/);
  if (!match) throw new Error('Could not find input ref');
  const ref = match[1];

  await browser.fill(ref, 'test@example.com');
  const value = await browser.getText(ref);
  console.log('Input value:', value);

  // Test click
  await browser.open('data:text/html,<button id="btn">Click me</button>');
  tree = await browser.snapshot({ interactive: true });
  const btnMatch = tree.match(/ref=(e\d+)/);
  if (!btnMatch) throw new Error('Could not find button ref');
  await browser.click(btnMatch[1]);
  console.log('Click: OK');

  // Cleanup
  await browser.close();
  console.log('All tests passed!');
}

test().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
