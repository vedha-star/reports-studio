
import axios from 'axios';

async function test() {
  const url = 'https://query.navacle.com/api/v1/dynamic-rest/search/my-enquiries';
  const user = 'admin';
  const pass = 'admin123';
  
  try {
    console.log('Fetching without limit...');
    const res1 = await axios.post(url, { tenantId: '1' }, {
      auth: { username: user, password: pass },
      headers: { 'x-db-identifier': 'erp' }
    });
    console.log('Count without limit:', Array.isArray(res1.data?.data) ? res1.data.data.length : 'not an array');

    console.log('Fetching with limit 500...');
    const res2 = await axios.post(url, { tenantId: '1', limit: 500 }, {
      auth: { username: user, password: pass },
      headers: { 'x-db-identifier': 'erp' }
    });
    console.log('Count with limit 500:', Array.isArray(res2.data?.data) ? res2.data.data.length : 'not an array');
  } catch (e: any) {
    console.error('Error:', e.message);
    if (e.response) console.log('Response status:', e.response.status);
  }
}

test();
