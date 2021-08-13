import deployIndexPool from "./utils/deployIndexPool";
import deployBridge from "./utils/deployBridge";

const {readdirSync} = require('fs')

async function main() {
    await deployIndexPool();

    const files = readdirSync('./contracts/bridges/');
    for (var i =0; i < files.length; i++){
        await deployBridge(files[i].replace('.sol', ''))
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
