#!/usr/bin/env node

/**
 * API Testing Script - Test all endpoints
 * Run: node scripts/test-api.js
 */

const http = require('http');

const baseUrl = 'http://localhost:3001';

function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          data: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('API Testing Suite - Foodosys');
  console.log('='.repeat(70) + '\n');

  const tests = [
    {
      name: 'Fetch All Restaurants',
      method: 'GET',
      path: '/api/restaurants',
      expectedStatus: 200
    },
    {
      name: 'Fetch Menus - Magna',
      method: 'GET',
      path: '/api/restaurants/magna/menus',
      expectedStatus: 200
    },
    {
      name: 'Fetch Menus - Fiesta',
      method: 'GET',
      path: '/api/restaurants/fiesta/menus',
      expectedStatus: 200
    },
    {
      name: 'Fetch Menus - Invalid Slug',
      method: 'GET',
      path: '/api/restaurants/invalid/menus',
      expectedStatus: 404
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n📝 ${test.name}`);
      console.log('─'.repeat(70));
      console.log(`Request: ${test.method} ${test.path}`);
      
      const response = await makeRequest(test.method, test.path);
      
      const statusOk = response.status === test.expectedStatus;
      const statusIcon = statusOk ? '✅' : '❌';
      
      console.log(`Status: ${statusIcon} ${response.status} ${response.statusText}`);
      console.log(`Expected: ${test.expectedStatus}`);
      
      if (response.data) {
        if (test.path.includes('restaurants') && !test.path.includes('menus')) {
          console.log(`Restaurants: ${response.data.restaurants?.length || 0}`);
          if (response.data.restaurants?.length > 0) {
            console.log('Sample:');
            response.data.restaurants.slice(0, 2).forEach(r => {
              console.log(`  - ${r.name} (${r.slug})`);
            });
          }
        } else if (test.path.includes('menus')) {
          console.log(`Menus: ${response.data.menus?.length || 0}`);
          if (response.data.menus?.length > 0) {
            console.log('Sample:');
            response.data.menus.slice(0, 2).forEach(m => {
              console.log(`  - ${m.id.substring(0, 8)}... (${m.status})`);
            });
          }
        } else if (response.data.error) {
          console.log(`Error: ${response.data.error}`);
          if (response.data.details) {
            console.log(`Details: ${JSON.stringify(response.data.details, null, 2)}`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('Testing Complete');
  console.log('='.repeat(70) + '\n');

  console.log('💡 Tips:');
  console.log('  1. Check server terminal for [API] logs');
  console.log('  2. Open http://localhost:3001 in browser');
  console.log('  3. Open DevTools console (F12) to see client logs');
  console.log('  4. Try clicking on a restaurant to see menus API in action\n');
}

runTests().catch(console.error);
