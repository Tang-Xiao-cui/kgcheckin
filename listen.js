import {close_api, delay, send, startService} from "./utils/utils.js";
import fs from "fs";
async function main() {
    let users;
    const usersConfig = process.env.USERS;
    if (usersConfig) {
        users = JSON.parse(usersConfig);
    }else {
        if (!fs.existsSync('./login_res.json')) {
            throw new Error("缺少 USERS 配置！请检查");
        }
        const fileContent = fs.readFileSync('./qr_res.json', 'utf8');
        users = JSON.parse(fileContent);
    }

    if (!Array.isArray(users) || users.length === 0) {
        throw new Error("USERS 配置必须是一个非空数组");
    }
    const api = startService();
    await delay(2000);
    try {
        for (const [index, user] of users.entries()) {
            const t = user.token;
            const uid = user.userid;

            if (!t || !uid) {
                throw new Error("参数错误！请检查")
            }

            console.log(`\n开始处理第 ${index + 1} 个用户 (UID: ${uid})`);

            const today = new Date();
            // 服务器时间比国内慢8小时
            today.setTime(today.getTime() + 8 * 60 * 60 * 1000);
            //日期
            let DD = String(today.getDate()).padStart(2, '0');
            let MM = String(today.getMonth() + 1).padStart(2, '0');
            let yyyy = today.getFullYear();
            let date = yyyy + '-' + MM + '-' + DD;

            let headers = {'cookie': 'token=' + t + '; userid=' + uid};


            // 开始听歌
            console.log(`开始听歌签到`);
            // 听歌获取vip
            let cr = await send("/youth/listen/song", "GET", headers);

            if (cr.status === 1) {
                console.log("听歌成功");
            } else {
                console.log("响应内容");
                console.dir(cr, {depth: null});
                console.error("听歌签到失败：" + cr.error_code);
                throw new Error("听歌签到失败")
            }

            let vip_details = await send("/user/vip/detail", "GET", headers);
            if (vip_details.status === 1) {
                console.log(`今天是：${date}`);
                console.log(`VIP到期时间：${vip_details.data.busi_vip[0].vip_end_time}`);
            } else {
                console.log("响应内容");
                console.dir(vip_details, {depth: null});
                console.error("获取 VIP 详情失败");
                throw new Error("获取 VIP 详情失败")
            }
        }
    } finally {
        close_api(api);
    }

    if (api.killed) {
        // 强制关闭进程
        process.exit(0);
    }
}

main()
