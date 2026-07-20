import http from 'http';

const loginData = JSON.stringify({
  email: 'admin@lancerpro.com',
  password: 'admin'
});

const loginOptions = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const req = http.request(loginOptions, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const data = JSON.parse(body);
    const token = data.token;
    
    const getOptions = {
      hostname: 'localhost',
      port: 8080,
      path: '/api/admin/audit-logs',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    };
    
    const getReq = http.request(getOptions, (res2) => {
      let body2 = '';
      res2.on('data', chunk => body2 += chunk);
      res2.on('end', () => {
        console.log(body2.substring(0, 1000));
      });
    });
    getReq.end();
  });
});

req.on('error', e => console.error(e));
req.write(loginData);
req.end();
