import {close_api, delay, send, startService} from "./utils/utils.js";

async function main() {
    let users;
    const usersConfig = process.env.USERS;
    if (usersConfig) {
        users = JSON.parse(usersConfig);
    } else {
        throw new Error("缺少 USERS 配置！请检查");
    }
    let api = null;
    let error = false;
    let error_msg = "";
    for (const [index, user] of users.entries()) {
        api = startService()
        await delay(2000);
        try {
            const t = user.token;
            const uid = user.userid;
            if (!t || !uid) {
                throw new Error("参数错误！请检查")
            }
            console.log(`\n开始处理第 ${index + 1} 个用户 (UID: ${uid})`);
            const today = new Date();
            // 服务器时间比国内慢8小时
            today.setTime(today.getTime() + 8 * 60 * 60 * 1000)
            //日期
            const DD = String(today.getDate()).padStart(2, '0'); // 获取日
            const MM = String(today.getMonth() + 1).padStart(2, '0'); //获取月份，1 月为 0
            const yyyy = today.getFullYear(); // 获取年份
            const date = yyyy + '-' + MM + '-' + DD

            const headers = {'cookie': 'token=' + t + '; userid=' + uid}
            // 刷新令牌
            const res = await send("/login/token", "GET", headers)
            if (res.status == 1) {
                console.log(`第 ${index + 1} 个用户` + "token刷新成功")
            } else {
                error = true;
                error_msg = "第 " + (index + 1) + " 个用户" + "token刷新失败"
                console.error(error_msg)
                console.error(`第 ${index + 1} 个用户` + "响应内容")
                console.dir(res, {depth: null})
            }
            // 开始签到
            for (let i = 1; i <= 3; i++) {
                console.log(`第 ${index + 1} 个用户` + `开始第${i}次签到`)
                // 签到获取vip
                const cr = await send("/youth/vip", "GET", headers)

                if (cr.status === 1) {
                    console.log(`第 ${index + 1} 个用户` + "签到成功")
                } else {
                    if ("30002" == cr.error_code) {
                        error_msg = `第 ${index + 1} 个用户` + cr.error_msg
                    } else {
                        error = true;
                        error_msg = `第 ${index + 1} 个用户签到失败` + cr.error_msg
                    }

                    console.error(error_msg)
                    console.error(`第 ${index + 1} 个用户` + "响应内容")
                    console.dir(cr, {depth: null})
                }
                if (i != 3) {
                    await delay(4 * 60 * 1000)
                }
            }

            const vip_details = await send("/user/vip/detail", "GET", headers)
            if (vip_details.status === 1) {
                console.log(`今天是：${date}`)
                console.log(`第 ${index + 1} 个用户` + `VIP到期时间：${vip_details.data.busi_vip[0].vip_end_time}`)
            } else {
                error = true;
                error_msg = `第 ${index + 1} 个用户` + "获取失败"
                console.error(error_msg)
                console.error(`第 ${index + 1} 个用户` + "响应内容")
                console.dir(vip_details, {depth: null})
            }
        } finally {
            close_api(api);
        }
    }
    if (error) {
        throw new Error(error_msg)
    }
    if (api.killed) {
        // 强制关闭进程
        process.exit(0);
    }
}

main()

