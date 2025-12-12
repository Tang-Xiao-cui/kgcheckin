import { close_api, delay, send, startService } from "./utils/utils.js";

async function login() {

  const phone = process.env.PHONE
  const code = process.env.CODE
  const KEYS = process.env.KEYS
  let qrLogin = true
  //[{ "key": "478961421"}, { "key": "567529612"}]
  // 没有二维码则不使用二维码登录
  if (!KEYS) {
    qrLogin = false
  }
  // 不使用二维码登录并且没有手机号或验证码
  if (!qrLogin && (!phone || !code)) {
    throw new Error("参数错误！请检查")
  }
  // 启动服务
  const api = startService()
  await delay(2000)

  try {
    if (qrLogin) {

      let keyArr;
      try {
        keyArr = JSON.parse(KEYS);
      } catch (e) {
        throw new Error("KEYS 配置解析失败，请确保是有效的 JSON 格式");
      }

      if (!Array.isArray(keyArr) || keyArr.length === 0) {
        throw new Error("KEYS 配置必须是一个非空数组");
      }
      const loginResults = [];
      for (const [index, temp] of keyArr.entries()) {
        const key = temp.BM;
        console.log(`\n开始处理第 ${index + 1} 个用户 (key: ${key})`);
        const res = await send(`/login/qr/check?key=${key}`, "GET", {})
        switch (res?.data?.status) {
          case 0:
            console.log("二维码已过期")
            break;

          case 1:
            console.log("未扫描二维码")
            break;

          case 2:
            console.log("二维码未确认，点击登录后重试")
            break;

          case 4:
            console.log("登录成功！")
            loginResults.push({
              token: res.data.token,
              userid: res.data.userid
            });
            break;
          default:
            console.log("响应信息")
            console.dir(res, { depth: null })
            throw new Error("登录失败")
        }
      }
      console.log("用户列表"+JSON.stringify(loginResults, null, 2));

    } else {
      // 手机号登录请求
      const result = await send(`/login/cellphone?mobile=${phone}&code=${code}`, "GET", {})
      if (result.status === 1) {
        console.log("登录成功！")
        console.log("第一行是token,第二行是userid")
        console.log(result.data.token)
        console.log(result.data.userid)
      } else if (result.error_code === 34175) {
        throw new Error("暂不支持多账号绑定手机登录")
      } else {
        console.log("响应内容")
        console.dir(result, { depth: null })
        throw new Error("登录失败！请检查")
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
