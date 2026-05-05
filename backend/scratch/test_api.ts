
import axios from 'axios';

async function test500() {
  try {
    const loginRes = await axios.post('http://localhost:3001/v1/auth/login', {
      email: 'admin@navacle.com',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    
    // Try to execute each report
    const reportsRes = await axios.get('http://localhost:3001/v1/reports', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    for (const report of reportsRes.data) {
      console.log(`Executing ${report.name}...`);
      try {
        const res = await axios.post(`http://localhost:3001/v1/reports/${report.id}/execute`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`  Success: ${res.status}`);
      } catch (e: any) {
        console.log(`  FAILED: ${e.response?.status}`);
        console.log(`  Body:`, JSON.stringify(e.response?.data));
      }
    }
    
  } catch (error: any) {
    console.error('Test failed:', error.message);
  }
}

test500();
