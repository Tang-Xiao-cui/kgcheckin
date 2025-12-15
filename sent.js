import { close_api, delay, send, startService } from "./utils/utils.js";

async function login() {

  const phones = process.env.PHONES

  if (!phones) {
    throw new Error("参数错误！请检查")
  }
  // 启动服务
  const api = startService()
  await delay(2000)
  let phoneArr = JSON.parse(phones);
  console.log("开始发送验证码")
  try {
    for (const [index, temp] of phoneArr.entries()) {
      const phone = temp.phone;
      // 验证码请求
      const result = await send(`/captcha/sent?mobile=${phone}`, "GET", {})
      if (result.status === 1) {
        console.log(`第 ${index + 1} 个用户发送成功`)
      } else {
        console.log(`第 ${index + 1} 个用户发送失败`)
        console.log("响应内容")
        console.dir(result, {depth: null})
        // throw new Error("发送失败！请检查")
      }
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

login()
