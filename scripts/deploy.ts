import deployIndexPool from "./utils/deployIndexPool";


async function main() {
    await deployIndexPool();
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
