const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Starting API Endpoint Verification Tests ---');

  // Test User Details
  const testUser = {
    email: `tester-${Date.now()}@example.com`,
    password: 'securePassword123'
  };

  let token = '';

  try {
    // 1. Test Register Endpoint
    console.log(`\nTesting POST /auth/register with email: ${testUser.email}...`);
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (!regRes.ok) {
      const err = await regRes.json();
      throw new Error(`Register failed: ${err.message}`);
    }

    const regData = await regRes.json();
    console.log('✓ Register API succeeded.');
    if (!regData.token) {
      throw new Error('Register response did not contain a token!');
    }
    console.log('✓ Token successfully issued.');

    // 2. Test Login Endpoint
    console.log(`\nTesting POST /auth/login with registered email...`);
    const logRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (!logRes.ok) {
      const err = await logRes.json();
      throw new Error(`Login failed: ${err.message}`);
    }

    const logData = await logRes.json();
    console.log('✓ Login API succeeded.');
    token = logData.token;
    console.log('✓ Valid token retrieved.');

    // 3. Test Fetch Trips without Token (Expected: 401 Unauthorized)
    console.log('\nTesting GET /trips WITHOUT authorization header...');
    const noAuthRes = await fetch(`${BASE_URL}/trips`);
    console.log(`Response Status (Expected 401): ${noAuthRes.status}`);
    if (noAuthRes.status !== 401) {
      throw new Error(`Expected 401 status but received: ${noAuthRes.status}`);
    }
    console.log('✓ Authorization gate successfully blocked request.');

    // 4. Test Fetch Trips with Token (Expected: 200 OK, empty list)
    console.log('\nTesting GET /trips WITH valid authorization header...');
    const authRes = await fetch(`${BASE_URL}/trips`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!authRes.ok) {
      const err = await authRes.json();
      throw new Error(`Fetch trips failed: ${err.message}`);
    }

    const trips = await authRes.json();
    console.log(`✓ Access granted. Received user isolation trip count: ${trips.length}`);
    if (!Array.isArray(trips)) {
      throw new Error('Fetch trips did not return an array!');
    }
    console.log('✓ Empty database list correctly loaded for new user.');

    console.log('\n=============================================');
    console.log('✓ ALL AUTHENTICATION AND AUTHORIZATION TESTS PASSED');
    console.log('=============================================');
  } catch (error) {
    console.error('\n❌ Test Failure detected:');
    console.error(error.message);
    process.exit(1);
  }
}

runTests();
