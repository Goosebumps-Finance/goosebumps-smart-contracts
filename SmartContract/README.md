# Advanced Sample Hardhat Project

This project demonstrates an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the ecosystem.

The project comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts. It also comes with a variety of other tools, preconfigured to work with the project code.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.ts
TS_NODE_FILES=true npx ts-node scripts/deploy.ts
npx eslint '**/*.{js,ts}'
npx eslint '**/*.{js,ts}' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

# Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).

## BSC Testnet

| Multi-Sig Wallet | Contract Address |
|-------------------|------------------|
| Treasury | 0x821965C1fD8B60D4B33E23C5832E2A7662faAADC |

| Contract Name | Contract Address |
|-------------------|------------------|
| GooseBumpsSwapRouter02 | 0x31cB34991756FD1564b0DEBF2BFF3E522085EC02 |
| GooseBumpsSwapFactory | 0x75C821CCD003CC9E9Ea06008fAf9Ab8189B1EC56 |
| WBNB | 0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd |

| Token Name | Token Symbol | Contract Address | Pair Address |
|-------------------|-------------------|------------------|------------------|
| GooseBumps First Token | GBFT | 0xA6454bbA55F46Ef488c599c44867DF5eE3D6F543 | 0x3755298811C230597a075EFA05725930Aa38A0B8 |
| GooseBumps Second Token | GBST | 0xA490CfCE72c5d7344A177c6fCAdfBf0991816e93 |0xE76eE04D2A58Aeaff36763DD82E778d860501751 |
| GooseBumps Third Token | GBTT | 0x2FC145e7A2e6E1E83C55B7e73422072B70C73A77 | 0x4365E31B76196D23b143178A5f845D47c196766b |
| GooseBumps Firth Token | GBFT | 0x238CD26cccc1C714201Fc8bf49d453a39f494209 | 0xdeEeB6041bD4E3922E18f1F25771C71d7F64579e |
