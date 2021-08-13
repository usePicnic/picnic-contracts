import deployLogic from "./deployLogic";

async function deployIndexPool() {
    await deployLogic("IndexPool", false)
}
export default deployIndexPool;


