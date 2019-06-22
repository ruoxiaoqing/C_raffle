import Lottery from './raffle'
import Plugin, { tools } from '../../plugin'

class Raffle extends Plugin {
  constructor() {
    super()
  }
  public name = '抽奖插件'
  public description = '自动参与抽奖'
  public version = '0.0.2'
  public author = 'lzghzr'
  /**
   * 是否开启抽奖
   *
   * @private
   * @memberof Raffle
   */
  private _raffle = false
  /**
   * 被封关闭抽奖
   *
   * @private
   * @type {Map<string,boolean>}
   * @memberof Raffle
   */
  private _raffleBanList: Map<string, boolean> = new Map()
  public async load({ defaultOptions, whiteList }: { defaultOptions: options, whiteList: Set<string> }) {
    // 抽奖延时
    defaultOptions.config['raffleDelay'] = 0
    defaultOptions.info['raffleDelay'] = {
      description: '抽奖延时',
      tip: '活动抽奖, 小电视抽奖的延时, ms',
      type: 'number'
    }
    whiteList.add('raffleDelay')
    // 抽奖暂停
    defaultOptions.config['rafflePause'] = [3, 9]
    defaultOptions.info['rafflePause'] = {
      description: '抽奖暂停',
      tip: '在此时间段内不参与抽奖, 24时制, 以\",\"分隔, 只有一个时间时不启用',
      type: 'numberArray'
    }
    whiteList.add('rafflePause')
    // 抽奖概率
    defaultOptions.config['droprate'] = 0
    defaultOptions.info['droprate'] = {
      description: '丢弃概率',
      tip: '就是每个用户多少概率漏掉1个奖啦，范围0~100',
      type: 'number'
    }
    // 被封停止
    defaultOptions.config['raffleBan'] = false
    defaultOptions.info['raffleBan'] = {
      description: '被封停止',
      tip: '检测到被封以后停止抽奖',
      type: 'boolean'
    }
    whiteList.add('raffleBan')
    whiteList.add('smallTV')
    // raffle类抽奖
    defaultOptions.newUserData['raffle'] = false
    defaultOptions.info['raffle'] = {
      description: 'raffle类抽奖',
      tip: '自动参与raffle类抽奖',
      type: 'boolean'
    }
    whiteList.add('raffle')
    // lottery类抽奖
    defaultOptions.newUserData['lottery'] = false
    defaultOptions.info['lottery'] = {
      description: 'lottery类抽奖',
      tip: '自动参与lottery类抽奖',
      type: 'boolean'
    }
    whiteList.add('lottery')
    // 大乱斗抽奖
    defaultOptions.newUserData['pklottery'] = false
    defaultOptions.info['pklottery'] = {
      description: '大乱斗抽奖',
      tip: '自动参与大乱斗抽奖',
      type: 'boolean'
    }
    whiteList.add('pklottery')
    // 节奏风暴
    defaultOptions.newUserData['beatStorm'] = false
    defaultOptions.info['beatStorm'] = {
      description: '节奏风暴',
      tip: '自动参与节奏风暴',
      type: 'boolean'
    }
    whiteList.add('beatStorm')
    this.loaded = true
  }
  public async start({ options }: { options: options }) {
    const csttime = Date.now() + 8 * 60 * 60 * 1000
    const cst = new Date(csttime)
    const cstHour = cst.getUTCHours()
    // 抽奖暂停
    const rafflePause = <number[]>options.config['rafflePause']
    this._raffle = this._isRafflePause(cstHour, rafflePause)
  }
  public async loop({ cstMin, cstHour, options }: { cstMin: number, cstHour: number, options: options }) {
    // 每天00:00, 10:00, 20:00刷新
    if (cstMin === 0 && cstHour % 10 === 0) this._raffleBanList.clear()
    // 抽奖暂停
    const rafflePause = <number[]>options.config['rafflePause']
    this._raffle = this._isRafflePause(cstHour, rafflePause)
  }
  public async msg({ message, options, users }: { message: raffleMessage | lotteryMessage | beatStormMessage, options: options, users: Map<string, User> }) {
    if (!this._raffle) return
    users.forEach(async (user, uid) => {
      if (user.captchaJPEG !== '' || !user.userData[message.cmd] || (options.config['raffleBan'] && this._raffleBanList.get(uid))) return
      const droprate = <number>options.config['droprate']
      if (droprate !== 0 && Math.random() < droprate / 100) tools.Log(user.nickname, '丢弃抽奖', message.id)
      else {
        const raffleDelay = <number>options.config['raffleDelay']
        if (raffleDelay !== 0) await tools.Sleep(raffleDelay)
        // @ts-ignore
        if (message.time_wait !== undefined) await tools.Sleep(message.time_wait * 1000)
        if (options.config['raffleBan'] && this._raffleBanList.get(uid)) return
        const raffleBan = await new Lottery(message, user, options).Start()
        if (raffleBan === 'raffleBan') this._raffleBanList.set(uid, true)
      }
    })
  }
  /**
   * 是否暂停抽奖
   *
   * @private
   * @param {number} cstHour
   * @param {number[]} rafflePause
   * @returns {boolean}
   * @memberof Raffle
   */
  private _isRafflePause(cstHour: number, rafflePause: number[]): boolean {
    if (rafflePause.length > 1) {
      const start = rafflePause[0]
      const end = rafflePause[1]
      if (start > end && (cstHour >= start || cstHour < end) || (cstHour >= start && cstHour < end))
        return false
      return true
    }
    return true
  }
}

export default new Raffle()