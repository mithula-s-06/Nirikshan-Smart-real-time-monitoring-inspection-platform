const http = require('http');

function post(url, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let resp = '';
        res.on('data', (c) => (resp += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resp) });
          } catch (e) {
            resolve({ status: res.statusCode, text: resp });
          }
        });
      }
    );
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(data);
    req.end();
  });
}

function getAuth(url, token) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let resp = '';
        res.on('data', (c) => (resp += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resp) });
          } catch (e) {
            resolve({ status: res.statusCode, text: resp });
          }
        });
      }
    );
    req.on('error', (e) => resolve({ error: e.message }));
    req.end();
  });
}

async function testRbac() {
  console.log('=== TEST 1: NATIONAL HQ OFFICIAL AUTH & DATA SCOPE ===');
  const hqLogin = await post('http://127.0.0.1:5000/api/v1/auth/login', {
    email: 'dept.official1@nirikshan.gov.in',
    password: 'Password@123',
  });
  console.log('HQ Login status:', hqLogin.status);
  const hqToken = hqLogin.data?.data?.tokens?.accessToken;
  const hqMe = await getAuth('http://127.0.0.1:5000/api/v1/auth/me', hqToken);
  console.log('HQ Identity:', hqMe.data?.data?.user?.name, '| Scope:', hqMe.data?.data?.scope?.level);
  console.log('HQ Permissions count:', hqMe.data?.data?.permissions?.length);
  const hqProjects = await getAuth('http://127.0.0.1:5000/api/v1/projects', hqToken);
  console.log('HQ Sees Total Projects:', hqProjects.data?.data?.projects?.length);

  console.log('\n=== TEST 2: STATE OFFICIAL AUTH & DATA SCOPE (Tamil Nadu) ===');
  const tnLogin = await post('http://127.0.0.1:5000/api/v1/auth/login', {
    email: 'state.official.tn@nirikshan.gov.in',
    password: 'Password@123',
  });
  console.log('TN Login status:', tnLogin.status);
  const tnToken = tnLogin.data?.data?.tokens?.accessToken;
  const tnMe = await getAuth('http://127.0.0.1:5000/api/v1/auth/me', tnToken);
  console.log('TN Identity:', tnMe.data?.data?.user?.name, '| Scope:', tnMe.data?.data?.scope?.level, '| State:', tnMe.data?.data?.user?.state);
  const tnProjects = await getAuth('http://127.0.0.1:5000/api/v1/projects', tnToken);
  const statesSeenByTn = Array.from(new Set(tnProjects.data?.data?.projects?.map(p => p.state) || []));
  console.log('TN Sees Projects Count:', tnProjects.data?.data?.projects?.length, '| States in result:', statesSeenByTn);

  console.log('\n=== TEST 3: DISTRICT OFFICIAL AUTH & DATA SCOPE (Pune) ===');
  const puneLogin = await post('http://127.0.0.1:5000/api/v1/auth/login', {
    email: 'district.official.pune@nirikshan.gov.in',
    password: 'Password@123',
  });
  console.log('Pune Login status:', puneLogin.status);
  const puneToken = puneLogin.data?.data?.tokens?.accessToken;
  const puneMe = await getAuth('http://127.0.0.1:5000/api/v1/auth/me', puneToken);
  console.log('Pune Identity:', puneMe.data?.data?.user?.name, '| Scope:', puneMe.data?.data?.scope?.level, '| District:', puneMe.data?.data?.user?.district);
  const puneProjects = await getAuth('http://127.0.0.1:5000/api/v1/projects', puneToken);
  const districtsSeenByPune = Array.from(new Set(puneProjects.data?.data?.projects?.map(p => p.district) || []));
  console.log('Pune Sees Projects Count:', puneProjects.data?.data?.projects?.length, '| Districts in result:', districtsSeenByPune);

  console.log('\n=== TEST 4: FIELD INSPECTOR SCOPE (Assigned Work Only) ===');
  const inspLogin = await post('http://127.0.0.1:5000/api/v1/auth/login', {
    email: 'inspector1@nirikshan.gov.in',
    password: 'Password@123',
  });
  const inspToken = inspLogin.data?.data?.tokens?.accessToken;
  const inspMe = await getAuth('http://127.0.0.1:5000/api/v1/auth/me', inspToken);
  console.log('Inspector Identity:', inspMe.data?.data?.user?.name, '| Scope:', inspMe.data?.data?.scope?.level);
  const inspInspections = await getAuth('http://127.0.0.1:5000/api/v1/inspections', inspToken);
  console.log('Inspector Sees Assigned Inspections:', inspInspections.data?.data?.inspections?.length);

  console.log('\n=== TEST 5: ACTIVE SESSIONS TRACKING ===');
  const sessionsRes = await getAuth('http://127.0.0.1:5000/api/v1/auth/sessions', hqToken);
  console.log('HQ Active Sessions Count:', sessionsRes.data?.data?.length);
  console.log('Sample session:', sessionsRes.data?.data?.[0]?.deviceInfo, 'IP:', sessionsRes.data?.data?.[0]?.ipAddress);
}

testRbac();
