import {close_api, delay, send, startService} from "./utils/utils.js";
import fs from "fs";
async function main() {
    let users;
    const usersConfig = process.env.USERS;
    if (usersConfig) {
        users = JSON.parse(usersConfig);
    }else {
        throw new Error("缺少 USERS 配置！请检查");
    }

    const api = startService();
    await delay(2000);
    let error = false;
    let error_msg = "";
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
                console.log(`第 ${index + 1} 个用户 (UID: ${uid})听歌成功`);
            } else {
                if ("130012" == cr.error_code) {
                    error_msg = `第 ${index + 1} 个用户 (UID: ${uid})今日已领取`;
                }else if ("20018" == cr.error_code || "51002" == cr.error_code){
                    error = true;
                    error_msg = `第 ${index + 1} 个用户 (UID: ${uid})未登录`;
                }else if ("30002" == cr.error_code){
                    error_msg = `第 ${index + 1} 个用户 (UID: ${uid})次数已用光`;
                }else {
                    error = true;
                    error_msg = `第 ${index + 1} 个用户 (UID: ${uid})未知错误`;
                }
                console.error(error_msg);
                console.log("响应内容");
                console.dir(cr, {depth: null});


            }

            let vip_details = await send("/user/vip/detail", "GET", headers);
            if (vip_details.status === 1) {
                console.log(`今天是：${date}`);
                console.log(`VIP到期时间：${vip_details.data.busi_vip[0].vip_end_time}`);
            } else {
                error = true;
                error_msg = `第 ${index + 1} 个用户 (UID: ${uid})获取 VIP 详情失败`;
                console.error(error_msg);
                console.log("响应内容");
                console.dir(vip_details, {depth: null});
            }
            await delay(4 * 60 * 1000)
        }
        if (error) {
            throw new Error(error_msg)
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
