
import axios from 'axios';

async function testDuplicateSlug() {
  try {
    const loginRes = await axios.post('http://localhost:3001/v1/auth/login', {
      email: 'admin@navacle.com',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    
    console.log('Testing duplicate slug save...');
    try {
      const res = await axios.post('http://localhost:3001/v1/reports', {
        name: 'Duplicate Report',
        slug: 'student-enrollment-2025', 
        database: 'erp',
        format: 'xlsx',
        status: 'active'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('UNEXPECTED SUCCESS:', res.status);
    } catch (e: any) {
      console.log('Caught Expected Error:', e.response?.status);
      console.log('Response Data:', JSON.stringify(e.response?.data));
    }
    
  } catch (error: any) {
    console.error('Outer Test failed:', error.message);
  }
}

testDuplicateSlug();
