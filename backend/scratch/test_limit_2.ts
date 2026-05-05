
import axios from 'axios';

async function test() {
  const url = 'https://query.navacle.com/api/v1/dynamic-rest/search/my-enquiries';
  const user = 'admin';
  const pass = 'admin123';
  
  try {
    console.log('Fetching with size 500...');
    const res = await axios.post(url, { tenantId: '1', size: 500 }, {
      auth: { username: user, password: pass },
      headers: { 'x-db-identifier': 'erp' }
    });
    console.log('Count with size 500:', Array.isArray(res.data?.data) ? res.data.data.length : 'not an array');
    
    console.log('Fetching with pageSize 500...');
    const res2 = await axios.post(url, { tenantId: '1', pageSize: 500 }, {
      auth: { username: user, password: pass },
      headers: { 'x-db-identifier': 'erp' }
    });
    console.log('Count with pageSize 500:', Array.isArray(res2.data?.data) ? res2.data.data.length : 'not an array');
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

test();
