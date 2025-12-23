import { spawn, exec } from 'child_process'

function delay(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

// 运行api服务
async function startService() {
  const api = spawn("npm", ["run", "apiService"]);

  api.stdout.on('data', data => {
    console.log(`${data}`);
  });

  api.on('close', code => {
    console.log(`子进程退出，退出码: ${code}`);
  });

  api.stderr.on('data', data => {
    console.log("服务启动失败:", data.toString());
  });

  // 等待服务启动
  await delay(2000);
  return api;
}

// 关闭api服务
function close_api(api) {
  if (!api.killed) {
    api.kill('SIGTERM');
  }
  return delay(3000);
}
// 杀死占用指定端口的进程
async function killPort(port) {
  return new Promise((resolve, reject) => {
    exec(`lsof -ti:${port} | xargs -r kill -9`, (error, stdout, stderr) => {
      if (error) {
        console.log(`清理端口 ${port} 时出错:`, error.message);
      } else {
        console.log(`已清理端口 ${port} 的占用`);
      }
      // 给系统时间释放端口
      setTimeout(resolve, 1000);
    });
  });
}

// 发送请求
async function send(path, method, headers) {
  const result = await fetch("http://localhost:3000" + path, {
    method: method,
    headers: headers
  }).then(r => r.json())
  // console.log(result)
  return result
}

export { delay, startService, close_api, send, killPort }
