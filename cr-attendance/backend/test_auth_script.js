const fetch = require('node-fetch'); // Might need to install if not present, but let's try assuming internal fetch or use http
const http = require('http');

const post = (path, data) => {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: 5000,
            path: '/api/auth' + path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });

        req.on('error', reject);
        req.write(JSON.stringify(data));
        req.end();
    });
};

async function test() {
    const email = `test_${Date.now()}@example.com`;
    const password = 'password123';

    console.log(`Testing with ${email}...`);

    try {
        // 1. Register
        console.log('1. Registering...');
        const regRes = await post('/register', { email, password });
        console.log('Register Response:', regRes);

        // 2. Login
        console.log('2. Logging in...');
        const loginRes = await post('/login', { email, password });
        console.log('Login Response:', loginRes);

        if (loginRes.status === 200 && loginRes.body.token) {
            console.log('✅ TEST PASSED');
        } else {
            console.log('❌ TEST FAILED');
        }
    } catch (err) {
        console.error('Test Script Error:', err);
    }
}

test();
