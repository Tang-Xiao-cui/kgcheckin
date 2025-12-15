import { close_api, delay, send, startService } from "./utils/utils.js";
import fs from "fs";
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
    const keyResults = [];
    const qrImg = [];
    for (let i = 0; i < userSize; i++) {
      let result = await send(`/login/qr/key?timestamp=${Date.now()}`, "GET", {})
      if (result.status === 1) {
        keyResults.push({
          qrcode: result.data.qrcode
        });
        qrImg.push({
          qrcode: result.data.qrcode,
          img: result.data.qrcode_img
        });
      } else {
        console.log("响应内容")
        console.dir(result, { depth: null })
        throw new Error("请求失败！请检查")
      }
      await delay(1000)
    }
    // 将结果写入文件以便后续工作流使用
    fs.writeFileSync('./qr-res.json', JSON.stringify(keyResults, null, 2));
    // 生成HTML文件用于显示二维码图片
    generateQRHtml(qrImg);
    console.log(JSON.stringify(keyResults, null, 0));
  } finally {
    close_api(api)
  }

  if (api.killed) {
    // 强制关闭进程
    // 必须强制关闭，不然action不会停止
    process.exit(0)
  }
}

function generateQRHtml(data) {
  let htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>二维码列表</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            display: flex;
            flex-wrap: wrap;
            gap: 200px;
        }
        .qrcode-item {
            background-color: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            width: 300px;
        }
        .qrcode-img {
            max-width: 100%;
            height: auto;
            margin-bottom: 10px;
        }
        .qrcode-key {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <h1>二维码列表</h1>
    <div class="container">
    `;

  data.forEach(item => {
    htmlContent += `        <div class="qrcode-item">
            <div class="qrcode-key">Key: ${item.qrcode}</div>
            <img src="${item.img}" alt="二维码" class="qrcode-img">
        </div>
        `;
  });

  htmlContent += `    </div>
</body>
</html>
    `;

  fs.writeFileSync('./qr-codes.html', htmlContent);
}

qrcode()
