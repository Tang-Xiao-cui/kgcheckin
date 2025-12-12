import { close_api, delay, send, startService } from "./utils/utils.js";
import fs from "fs";
import path from "path";
async function qrcode() {
  let userSize = process.env.SIZE
  if (!userSize) {
    userSize = 3
  }
  // 启动服务
  let api = startService()
  await delay(2000)

  try {
    // 登录请求
    const loginResults = [];
    const keyResults = [];
    for (let i = 0; i < userSize; i++) {
      let result = await send(`/login/qr/key`, "GET", {})
      if (result.status === 1) {
        loginResults.push({
          KEY: result.data.qrcode,
          qrcodeImg: result.data.qrcode_img
        });
        keyResults.push({
          KEY: result.data.qrcode
        });
      } else {
        console.log("响应内容")
        console.dir(result, { depth: null })
        throw new Error("请求失败！请检查")
      }
    }
    console.log("用户列表"+JSON.stringify(keyResults, null, 2));
    console.log("用户列表"+JSON.stringify(loginResults, null, 2));
    // 生成二维码HTML文件
    try {
      const htmlFilePath = generateQRCodeHTML(loginResults);
      console.log("用户列表已生成，点击下方链接查看二维码:");
      console.log(`file://${path.resolve(htmlFilePath)}`);
    }catch (e){
      console.log("用户列表已生成生成失败！");
      console.error(e)
    }

  } finally {
    close_api(api)
  }

  if (api.killed) {
    // 强制关闭进程
    // 必须强制关闭，不然action不会停止
    process.exit(0)
  }
}
function generateQRCodeHTML(loginResults) {
  let htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>用户二维码</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .user-card { 
            border: 1px solid #ddd; 
            margin: 15px 0; 
            padding: 15px; 
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .qrcode-img { max-width: 200px; height: auto; }
        .key { 
            background-color: #f5f5f5; 
            padding: 8px; 
            border-radius: 4px; 
            word-break: break-all;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <h1>用户二维码列表</h1>`;

  loginResults.forEach((user, index) => {
    htmlContent += `    <div class="user-card">
        <h3>用户 ${index + 1}</h3>
        <img src="${user.qrcodeImg}" class="qrcode-img" alt="QR Code for user ${index + 1}">
        <p><strong>KEY:</strong></p>
        <div class="key">${user.KEY}</div>
    </div>`;
  });

  htmlContent += `</body>
</html>`;

  const filePath = './qrcodes.html';
  fs.writeFileSync(path.resolve(filePath), htmlContent);
  return filePath;
}

qrcode()
