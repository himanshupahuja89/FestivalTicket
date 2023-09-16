// deploy.js

const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const initialTicketPrice = ethers.parseEther("1"); // Set the initial ticket price in FestivalCurrency, 1 ether 
  const initialOwnerSupply = ethers.parseEther("1000"); // Initial supply of 1000 ether for the owner

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the FestivalCurrency contract
  const festivalCurrency = await ethers.deployContract("FestivalCurrency");
  console.log("FestivalCurrency deployed to:", await festivalCurrency.getAddress());

  const festivalCurrencyAddress = await festivalCurrency.getAddress()
  await festivalCurrency.mint(deployer.address, initialOwnerSupply);

  // Deploy the FestivalTicket contract
  const festivalTicket = await hre.ethers.deployContract("FestivalTicket", [festivalCurrencyAddress, initialTicketPrice]);

  console.log("FestivalTicket deployed to:", await festivalTicket.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Fuji Testnet 
// FestivalCurrency deployed to: 0xB644b360Cfc8C37605DE47FE5Bb7e9DEf8438D8B
// FestivalTicket deployed to: 0x698cBA901AfF5217a818F25D10864BFE54b841fe