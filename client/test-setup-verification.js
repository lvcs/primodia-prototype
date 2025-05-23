#!/usr/bin/env node

console.log('🧪 Testing Setup Verification\n');

const { execSync } = require('child_process');

function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log('✅ Success\n');
    return true;
  } catch (error) {
    console.log('❌ Failed');
    console.log(error.message);
    console.log('');
    return false;
  }
}

async function main() {
  const tests = [
    ['npm run lint', 'Running ESLint'],
    ['npm run test -- --run', 'Running unit tests'],
    ['npm run test:coverage -- --run', 'Running tests with coverage'],
    ['npm run build', 'Building application'],
  ];

  let passed = 0;
  let total = tests.length;

  for (const [command, description] of tests) {
    if (runCommand(command, description)) {
      passed++;
    }
  }

  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Your testing setup is ready.');
  } else {
    console.log('⚠️  Some tests failed. Please check the output above.');
    process.exit(1);
  }
}

main().catch(console.error); 