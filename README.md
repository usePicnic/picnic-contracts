## Compile

```bash
$ yarn compile
```

## Testing

```
yarn test
```

## Coverage

```
yarn coverage
```

## Running Locally

You will first need to run a local node in your machine. You can do that with Hardhat using:

```
npx hardhat node
```

After that, you can run our script responsible for deploying all our contracts with a default configuration. It will be created some initial options and pools with liquidity there.

```
npx hardhat setupLocal --network local
```

## Contributing

We highly encourage participation from the community to help shape the development of IndexPool. If you are interested in
contributing or have any questions, ping us on [Twitter](https://twitter.com/indexpool) or [Discord](https://discord.gg/MyfRfmGn);

We use [Yarn](https://yarnpkg.com/) as a dependency manager and [Hardhat](https://hardhat.org/)
as a development environment for compiling, testing, and deploying our contracts. The contracts were written in [Solidity v0.8.4](https://github.com/ethereum/solidity).

## Maintainers

 - **Pedro Guerra Brandão**
 [@pgbrandao](https://github.com/pgbrandao)
 [`pgbrandao@gmail.com`](mailto:pgbrandao@gmail.com)

 - **João Alexandre Vaz Ferreira**
 [@joaoavf](https://github.com/joaoavf)
 [`joao.avf@gmail.com`](mailto:joao.avf@gmail.com)
