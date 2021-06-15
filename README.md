<p align="center">IndexPool is a portfolio sharing platform with a simple design. Check our prototype at <a href="https://indexpool.org">indexpool.org</a>.</p>

<p align="center">
  <a href="https://hardhat.org">
    <img src="https://img.shields.io/badge/built with-Hardhat-f9c937" alt="Build with Hardhat">
  </a>

  <a href="https://github.com/indexpool/contracts/actions/workflows/main.yml">
    <img src="https://github.com/indexpool/contracts/workflows/lint+compile+test/badge.svg" alt="test"/>
  </a>
  
  <a href='https://coveralls.io/github/indexpool/contracts?branch=main'>
    <img src='https://coveralls.io/repos/github/indexpool/contracts/badge.svg?branch=main' alt='Coverage Status' />
  </a>

  <a href="https://github.com/indexpool/contracts/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-GPL--3-blue" alt="License GPL-3">
  </a>
</p>


---

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
