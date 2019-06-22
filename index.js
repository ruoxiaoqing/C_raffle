"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const raffle_1 = __importDefault(require("./raffle"));
const plugin_1 = __importStar(require("../../plugin"));
class Raffle extends plugin_1.default {
    constructor() {
        super();
        this.name = '抽奖插件';
        this.description = '自动参与抽奖';
        this.version = '0.0.2';
        this.author = 'lzghzr';
        this._raffle = false;
        this._raffleBanList = new Map();
    }
    async load({ defaultOptions, whiteList }) {
        defaultOptions.config['raffleDelay'] = 0;
        defaultOptions.info['raffleDelay'] = {
            description: '抽奖延时',
            tip: '活动抽奖, 小电视抽奖的延时, ms',
            type: 'number'
        };
        whiteList.add('raffleDelay');
        defaultOptions.config['rafflePause'] = [3, 9];
        defaultOptions.info['rafflePause'] = {
            description: '抽奖暂停',
            tip: '在此时间段内不参与抽奖, 24时制, 以\",\"分隔, 只有一个时间时不启用',
            type: 'numberArray'
        };
        whiteList.add('rafflePause');
        defaultOptions.config['droprate'] = 0;
        defaultOptions.info['droprate'] = {
            description: '丢弃概率',
            tip: '就是每个用户多少概率漏掉1个奖啦，范围0~100',
            type: 'number'
        };
        defaultOptions.config['raffleBan'] = false;
        defaultOptions.info['raffleBan'] = {
            description: '被封停止',
            tip: '检测到被封以后停止抽奖',
            type: 'boolean'
        };
        whiteList.add('raffleBan');
        whiteList.add('smallTV');
        defaultOptions.newUserData['raffle'] = false;
        defaultOptions.info['raffle'] = {
            description: 'raffle类抽奖',
            tip: '自动参与raffle类抽奖',
            type: 'boolean'
        };
        whiteList.add('raffle');
        defaultOptions.newUserData['lottery'] = false;
        defaultOptions.info['lottery'] = {
            description: 'lottery类抽奖',
            tip: '自动参与lottery类抽奖',
            type: 'boolean'
        };
        whiteList.add('lottery');
        defaultOptions.newUserData['pklottery'] = false;
        defaultOptions.info['pklottery'] = {
            description: '大乱斗抽奖',
            tip: '自动参与大乱斗抽奖',
            type: 'boolean'
        };
        whiteList.add('pklottery');
        defaultOptions.newUserData['beatStorm'] = false;
        defaultOptions.info['beatStorm'] = {
            description: '节奏风暴',
            tip: '自动参与节奏风暴',
            type: 'boolean'
        };
        whiteList.add('beatStorm');
        this.loaded = true;
    }
    async start({ options }) {
        const csttime = Date.now() + 8 * 60 * 60 * 1000;
        const cst = new Date(csttime);
        const cstHour = cst.getUTCHours();
        const rafflePause = options.config['rafflePause'];
        this._raffle = this._isRafflePause(cstHour, rafflePause);
    }
    async loop({ cstMin, cstHour, options }) {
        if (cstMin === 0 && cstHour % 10 === 0)
            this._raffleBanList.clear();
        const rafflePause = options.config['rafflePause'];
        this._raffle = this._isRafflePause(cstHour, rafflePause);
    }
    async msg({ message, options, users }) {
        if (!this._raffle)
            return;
        users.forEach(async (user, uid) => {
            if (user.captchaJPEG !== '' || !user.userData[message.cmd] || (options.config['raffleBan'] && this._raffleBanList.get(uid)))
                return;
            const droprate = options.config['droprate'];
            if (droprate !== 0 && Math.random() < droprate / 100)
                plugin_1.tools.Log(user.nickname, '丢弃抽奖', message.id);
            else {
                const raffleDelay = options.config['raffleDelay'];
                if (raffleDelay !== 0)
                    await plugin_1.tools.Sleep(raffleDelay);
                if (message.time_wait !== undefined)
                    await plugin_1.tools.Sleep(message.time_wait * 1000);
                if (options.config['raffleBan'] && this._raffleBanList.get(uid))
                    return;
                const raffleBan = await new raffle_1.default(message, user, options).Start();
                if (raffleBan === 'raffleBan')
                    this._raffleBanList.set(uid, true);
            }
        });
    }
    _isRafflePause(cstHour, rafflePause) {
        if (rafflePause.length > 1) {
            const start = rafflePause[0];
            const end = rafflePause[1];
            if (start > end && (cstHour >= start || cstHour < end) || (cstHour >= start && cstHour < end))
                return false;
            return true;
        }
        return true;
    }
}
exports.default = new Raffle();
