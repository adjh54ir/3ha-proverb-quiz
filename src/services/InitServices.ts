import axios from "axios";
class LottoService {
  private axios = axios.create({
    baseURL: "https://www.dhlottery.co.kr",
  });

  /**
   * 시작!
   */
  initService = () => {
    //
  };
}
export default new LottoService();
