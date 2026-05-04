
import axios from 'axios';

async function testLogin() {
  try {
    console.log('Testing login for admin@navacle.com...');
    const res = await axios.post('http://localhost:3001/v1/auth/login', {
      email: 'admin@navacle.com',
      password: 'admin123'
    });
    console.log('Login successful!');
    console.log('User:', res.data.user.email);
    console.log('Token length:', res.data.token.length);
  } catch (error: any) {
    console.error('Login failed:', error.response?.status, JSON.stringify(error.response?.data));
  }
}

testLogin();
