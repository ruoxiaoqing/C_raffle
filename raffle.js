"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_1 = require("../../plugin");
class Raffle {
    constructor(raffleMessage, user, options) {
        this._raffleMessage = raffleMessage;
        this._user = user;
        this._options = options;
    }
    async Start() {
        let raffleBan;
        switch (this._raffleMessage.cmd) {
            case 'raffle':
                raffleBan = await this._Raffle();
                break;
            case 'lottery':
                raffleBan = await this._Lottery();
                break;
            case 'pklottery':
                raffleBan = await this._PKLottery();
                break;
            case 'beatStorm':
                raffleBan = await this._BeatStorm();
                break;
        }
        return raffleBan;
    }
    async _Raffle() {
        const { id, roomID, title, type } = this._raffleMessage;
        const reward = {
            method: 'POST',
            uri: 'https://api.live.bilibili.com/gift/v4/smalltv/getAward',
            body: plugin_1.AppClient.signQueryBase(`${this._user.tokenQuery}&raffleId=${id}&roomid=${roomID}&type=${type}`),
            json: true,
            headers: this._user.headers
        };
        const raffleAward = await plugin_1.tools.XHR(reward, 'Android');
        if (raffleAward !== undefined && raffleAward.response.statusCode === 200) {
            if (raffleAward.body.code === 0) {
                const gift = raffleAward.body.data;
                if (gift.gift_num === 0)
                    plugin_1.tools.Log(this._user.nickname, title, id, raffleAward.body.msg);
                else {
                    const msg = `${this._user.nickname} ${title} ${id} 获得 ${gift.gift_num} 个${gift.gift_name}`;
                    plugin_1.tools.Log(msg);
                    if (gift.gift_name.includes('小电视'))
                        plugin_1.tools.emit('systemMSG', {
                            message: msg,
                            options: this._options,
                            user: this._user
                        });
                }
            }
            else {
                plugin_1.tools.Log(this._user.nickname, title, id, raffleAward.body);
                if (raffleAward.body.code === 400  || raffleAward.body.code === -403)
                    return 'raffleBan';
            }
        }
    }
    async _Lottery() {
        const { id, roomID, title, type } = this._raffleMessage;
        const reward = {
            method: 'POST',
            uri: 'https://api.live.bilibili.com/lottery/v2/Lottery/join',
            body: plugin_1.AppClient.signQueryBase(`${this._user.tokenQuery}&id=${id}&roomid=${roomID}&type=${type}`),
            json: true,
            headers: this._user.headers
        };
        const lotteryReward = await plugin_1.tools.XHR(reward, 'Android');
        if (lotteryReward !== undefined && lotteryReward.response.statusCode === 200) {
            if (lotteryReward.body.code === 0)
                plugin_1.tools.Log(this._user.nickname, title, id, lotteryReward.body.data.message);
            else {
                plugin_1.tools.Log(this._user.nickname, title, id, lotteryReward.body);
                if (lotteryReward.body.code === 400 || lotteryReward.body.code === -403)
                    return 'raffleBan';
            }
        }
    }
    async _PKLottery() {
        const { id, roomID, title } = this._raffleMessage;
        const reward = {
            method: 'POST',
            uri: 'https://api.live.bilibili.com/xlive/lottery-interface/v1/pk/join',
            body: plugin_1.AppClient.signQueryBase(`${this._user.tokenQuery}&id=${id}&roomid=${roomID}`),
            json: true,
            headers: this._user.headers
        };
        const pkLotteryReward = await plugin_1.tools.XHR(reward, 'Android');
        if (pkLotteryReward !== undefined && pkLotteryReward.response.statusCode === 200) {
            if (pkLotteryReward.body.code === 0)
                plugin_1.tools.Log(this._user.nickname, title, id, '获得', pkLotteryReward.body.data.award_text);
            else {
                plugin_1.tools.Log(this._user.nickname, title, id, pkLotteryReward.body);
                if (pkLotteryReward.body.code === 400 || pkLotteryReward.body.code === -403)
                    return 'raffleBan';
            }
        }
    }
    async _BeatStorm() {
        const { id, title } = this._raffleMessage;
        const join = {
            method: 'POST',
            uri: 'https://api.live.bilibili.com/lottery/v1/Storm/join',
            body: plugin_1.AppClient.signQuery(`${this._user.tokenQuery}&${plugin_1.AppClient.baseQuery}&id=${id}`),
            json: true,
            headers: this._user.headers
        };
        const joinStorm = await plugin_1.tools.XHR(join, 'Android');
        if (joinStorm !== undefined && joinStorm.response.statusCode === 200 && joinStorm.body !== undefined) {
            const content = joinStorm.body.data;
            if (content !== undefined && content.gift_num > 0)
                plugin_1.tools.Log(this._user.nickname, title, id, `${content.mobile_content} 获得 ${content.gift_num} 个${content.gift_name}`);
            else
                plugin_1.tools.Log(this._user.nickname, title, id, joinStorm.body);
        }
    }
}
exports.default = Raffle;
