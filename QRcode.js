import { close_api, delay, send, startService } from "./utils/utils.js";

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
      let result = await send(`/login/qr/key?timestamp=${Date.now()}`, "GET", {})
      if (result.status === 1) {
        loginResults.push({
          BM: result.data.qrcode,
          IMG: result.data.qrcode_img
        });
        keyResults.push({
          BM: result.data.qrcode
        });
      } else {
        console.log("响应内容")
        console.dir(result, { depth: null })
        throw new Error("请求失败！请检查")
      }
      await delay(1000)
    }
    console.log("用户列表"+JSON.stringify(keyResults, null, 0));
    loginResults.forEach((item, index) => {
      console.log(`User ${index} BM: ${item.BM} IMG: ${item.IMG}`);
    });
  } finally {
    close_api(api)
  }

  if (api.killed) {
    // 强制关闭进程
    // 必须强制关闭，不然action不会停止
    process.exit(0)
  }
}

qrcode()
