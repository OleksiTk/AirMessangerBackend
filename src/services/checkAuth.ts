export const checkAuth = {
  async ChekingAuths() {
    try {
      //middleware check auth if correct this funtcion retrun ok
      return {
        checkAuth: "ok",
      };
    } catch (error) {
      throw new Error("something went wrong");
    }
  },
};
