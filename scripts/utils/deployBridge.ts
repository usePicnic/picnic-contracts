import deployLogic from "./deployLogic";

async function deployBridge(bridgeName) {
    await deployLogic(bridgeName, true)
}
export default deployBridge;


