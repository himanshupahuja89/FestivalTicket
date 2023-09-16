# Festival Ticket

This is designed to handle the sale and transfer of festival tickets. It leverages Ethereum smart contracts and is built using Hardhat.

## Prerequisites
- Node.js v18.16.0 or later
- NPM v9.5.1 or later
- Hardhat (`npm install -g hardhat`)

## Getting Started
1. Clone the repository:
```
git clone https://github.com/himanshupahuja89/FestivalTicket.git
```
2. Install Dependencies:
```
npm install
```
3. Copy example.env and add your private keys
```
cp example.env .env
```
4. Start Hardhat Node
```
npx hardhat node
```
5. Execute Test script
```
npx hardhat test
```
6. Deploying 
```
npx hardhat run scripts/deploy.js --network localhost
```
7. Deploying on other network ( pass network name as specified in hardhat config)
```
npx hardhat run scripts/deploy.js --network "network name"
```