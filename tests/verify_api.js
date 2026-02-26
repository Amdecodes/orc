import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3000';
let token = '';

async function testAuth() {
  console.log('Testing Auth...');
  const res = await axios.post(`${API_BASE}/auth/telegram`, {
    telegramId: '12345678',
    username: 'testuser'
  });
  console.log('Auth Success:', res.data);
  token = res.data.token;
  return res.data;
}

async function testMe() {
  console.log('Testing /auth/me...');
  const res = await axios.get(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Me Success:', res.data);
}

async function testCredits() {
  console.log('Testing /user/credits...');
  const res = await axios.get(`${API_BASE}/user/credits`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Credits:', res.data);
}

async function testJob() {
  console.log('Testing /jobs/generate...');
  const form = new FormData();
  // Using the files found in root for testing
  form.append('front', fs.createReadStream('front v3.0.png'));
  form.append('back', fs.createReadStream('back V3.0.png'));
  form.append('third', fs.createReadStream('front v3.0.png')); // duplicating for test

  const res = await axios.post(`${API_BASE}/jobs/generate`, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${token}`
    }
  });
  console.log('Job Result:', res.data);
}

async function runTests() {
  try {
    await testAuth();
    await testMe();
    await testCredits();
    try {
        await testJob();
    } catch (e) {
        console.log('Job failed (expected if logic incomplete):', e.response?.data || e.message);
    }
  } catch (err) {
    console.error('Test Failed:', err.response?.data || err.message);
  }
}

runTests();
