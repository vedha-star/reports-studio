
import axios from 'axios';

async function test() {
  const url = 'https://query.navacle.com/api/v1/dynamic-rest/search/students-list';
  const user = 'admin';
  const pass = 'admin123';
  
  try {
    console.log('Fetching students-list with pageSize 2000...');
    const res = await axios.post(url, { tenantId: '1', pageSize: 2000 }, {
      auth: { username: user, password: pass },
      headers: { 'x-db-identifier': 'erp' }
    });
    
    console.log('Response Keys:', Object.keys(res.data));
    if (res.data.data) console.log('data length:', res.data.data.length);
    if (res.data.results) console.log('results length:', res.data.results.length);
    console.log('Raw data sample:', JSON.stringify(res.data).substring(0, 500));
    
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

test();
