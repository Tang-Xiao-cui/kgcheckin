import {close_api, delay, send, startService} from "./utils/utils.js";
import fs from "fs";

async function login() {
    const KEYS = process.env.KEYS;

    if (!KEYS) {
        throw new Error("参数错误！请检查");
    }

    // 启动服务
    const api = startService();
    await delay(2000);
    const loginResults = [];

    try {
        let keyArr = JSON.parse(KEYS);
        if (!Array.isArray(keyArr) || keyArr.length === 0) {
            throw new Error("KEYS 配置必须是一个非空数组");
        }

        for (const [index, temp] of keyArr.entries()) {
            if (temp.phone && temp.code) {
                // 手机号登录逻辑
                const phone = temp.phone;
                const code = temp.code;
                console.log(`\n开始处理第 ${index + 1} 个用户 (手机号: ${phone})`);
                const result = await send(`/login/cellphone?mobile=${phone}&code=${code}`, "GET", {});
                if (result.status === 1) {
                    console.log(`第 ${index + 1} 个用户登录成功！`);
                    loginResults.push({
                        token: result.data.token,
                        userid: result.data.userid
                    });
                } else if (result.error_code === 34175) {
                    console.log(`第 ${index + 1} 个暂不支持多账号绑定手机登录`);
                } else {
                    console.log(`第 ${index + 1} 个暂不支持多账号绑定手机登录`);
                    console.log("响应内容");
                    console.dir(result, {depth: null});
                }
            } else if (temp.qrcode) {
                // 二维码登录逻辑
                const key = temp.qrcode;
                console.log(`\n开始处理第 ${index + 1} 个用户 (key: ${key})`);
                const res = await send(`/login/qr/check?key=${key}`, "GET", {});
                switch (res?.data?.status) {
                    case 0:
                        console.log("二维码已过期");
                        break;
                    case 1:
                        console.log("未扫描二维码");
                        break;
                    case 2:
                        console.log("二维码未确认，点击登录后重试");
                        break;
                    case 4:
                        console.log(`第 ${index + 1} 个用户登录成功！`);
                        loginResults.push({
                            token: res.data.token,
                            userid: res.data.userid
                        });
                        break;
                    default:
                        console.log("响应信息");
                        console.dir(res, {depth: null});
                }
            } else {
                console.log(`第 ${index + 1} 个用户配置无效，跳过处理`);
            }
        }

        fs.writeFileSync('./login_res.json', JSON.stringify(loginResults, null, 0));
        console.log("用户列表" + JSON.stringify(loginResults, null, 2));
    } finally {
        close_api(api);
    }

    if (api.killed) {
        // 强制关闭进程
        process.exit(0);
    }
}

login();
