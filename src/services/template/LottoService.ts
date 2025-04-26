import axios from "axios";
class LottoService {
  private axios = axios.create({
    baseURL: "https://www.dhlottery.co.kr",
  });

  /**
   * 로또 당첨이력
   * @param drawNo
   * @returns
   */
  fetchLottoHistory = async (drawNo: number) => {
    try {
      const { data } = await this.axios.get("/common.do", {
        params: {
          method: "getLottoNumber",
          drwNo: drawNo,
        },
      });

      return {
        numbers: [
          data.drwtNo1,
          data.drwtNo2,
          data.drwtNo3,
          data.drwtNo4,
          data.drwtNo5,
          data.drwtNo6,
        ],
        bonusNumber: data.bnusNo,
        drawDate: data.drwNoDate,
        firstPrizeAmount: data.firstWinamnt,
        firstPrizeWinners: data.firstPrzwnerCo,
      };
    } catch (error) {
      console.error("Failed to fetch lotto history:", error);
      throw error;
    }
  };

  /**
   * 로또 당첨 정보를 5개씩 보여줍니다.
   * @param page
   * @returns
   */
  fetchLottoHistoryPer5 = async (page: number) => {
    const startDate = new Date("2002-12-07");
    const today = new Date();
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    const currentDraw =
      Math.floor((today.getTime() - startDate.getTime()) / weekInMs) + 1;

    const start = page * 5;
    const histories: any[] = [];

    for (let i = start; i < start + 5; i++) {
      const history = await this.fetchLottoHistory(currentDraw - i);
      histories.push({
        ...history,
        drawNumber: currentDraw - i,
      });
    }

    return histories;
  };
}

export default new LottoService();
