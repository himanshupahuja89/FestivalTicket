const { expect } = require("chai");

describe("Festival", function () {
    var festivalCurrency, festivalTicket;
    const initialTicketPrice = 100;
    const initialSupply = 1000000;
    var festivalTicketAddress;

    beforeEach(async function () {
        // Deploy the festival currency contract
        festivalCurrency = await ethers.deployContract("FestivalCurrency");
        let festivalCurrencyAddress = await festivalCurrency.getAddress()
        // Deploy the festival ticket contract with currency address and initial ticket price
        festivalTicket = await ethers.deployContract("FestivalTicket", [festivalCurrencyAddress, initialTicketPrice]);
        festivalTicketAddress = await festivalTicket.getAddress()
        // Fetch default signers (accounts) for transactions
        let [owner, account1] = await ethers.getSigners();
        // Mint initial currency for the owner and account1
        await festivalCurrency.mint(owner.address, initialSupply);
        await festivalCurrency.mint(account1.address, initialSupply);
    });

    // Test suite for buying tickets from the organizer
    describe("Buy tickets from organizer", function () {
        // Test case for successful ticket purchase
        it("Should buy a ticket successfully", async function () {
            // Check that contracts are deployed
            expect(festivalCurrency).to.not.be.undefined;
            expect(festivalTicket).to.not.be.undefined;

            // Fetch the owner's address
            let [owner] = await ethers.getSigners();

            // Buying the ticket from organizer
            await festivalCurrency.connect(owner).approve(festivalTicketAddress, initialTicketPrice);
            // Execute the purchase
            await festivalTicket.connect(owner).buyTicketFromOrganizer();
            expect(await festivalTicket.ownerOf(1)).to.equal(owner.address);
        });

        // Test case for buying a ticket when the maximum limit is reached
        it("Should fail when maximum tickets reached", async function () {
            // Fetch available accounts
            let [owner] = await ethers.getSigners();
            // Approve insufficient amount for buying ticket
            await festivalCurrency.approve(festivalTicketAddress, initialTicketPrice * 1001);
            for (let i = 0; i < 1000; i++) {
                await festivalTicket.connect(owner).buyTicketFromOrganizer();
            }

            // Expect transaction to be reverted
            await expect(festivalTicket.connect(owner).buyTicketFromOrganizer()).to.be.revertedWith("Maximum tickets reached");
        });

        it("Should fail if not enough currency approved", async function () {
            let [owner, account1, account2] = await ethers.getSigners();
            await festivalCurrency.approve(festivalTicketAddress, initialTicketPrice);
            await expect(festivalTicket.connect(account2).buyTicketFromOrganizer()).to.be.reverted;
        });
    });

    // Test suite for secondary market operations
    describe("Secondary market", function () {
        it("Should buy a ticket from previous owner successfully", async function () {
            const ticketId = 1;
            const offeredPrice = 105;
            // Fetch available accounts
            let [owner, account1] = await ethers.getSigners();
            // Approve and buy an initial ticket from the organizer
            await festivalCurrency.approve(festivalTicketAddress, initialTicketPrice);
            await festivalTicket.connect(owner).buyTicketFromOrganizer();

            // Calculate max approved amount for secondary purchase
            const maxApprovedAmount = offeredPrice + Math.floor((offeredPrice * 10) / 100);

            // Approve the max amount for the secondary purchase
            await festivalCurrency.connect(account1).approve(festivalTicketAddress, maxApprovedAmount);

            // Approve the ticket for transfer to account1
            await festivalTicket.connect(owner).approve(account1.address, ticketId);

            // Execute the secondary purchase
            await festivalTicket.connect(account1).buyFromPreviousOwner(ticketId, offeredPrice);
            // Verify the new ticket owner
            expect(await festivalTicket.ownerOf(ticketId)).to.equal(account1.address);
        });

        // Test case to ensure that purchasing a ticket fails if the offered price is too high
        it("Should fail if price is too high", async function () {
            const ticketId = 1;
            const offeredPrice = 111;

            // Fetch available accounts
            let [owner, account1] = await ethers.getSigners();

            // Approve and purchase an initial ticket from the organizer
            await festivalCurrency.approve(festivalTicketAddress, initialTicketPrice);
            await festivalTicket.connect(owner).buyTicketFromOrganizer();

            // Calculate the maximum approved amount for secondary purchase
            const maxApprovedAmount = offeredPrice + Math.floor((offeredPrice * 10) / 100);

            // Approve the currency
            await festivalCurrency.connect(account1).approve(festivalTicketAddress, maxApprovedAmount);

            // Approve the ticket for the secondary market transaction
            await festivalCurrency.connect(owner).approve(account1.address, ticketId);

            // Attempt to buy the ticket from the previous owner at a price that is too high
            await expect(festivalTicket.connect(account1).buyFromPreviousOwner(ticketId, offeredPrice))
                .to.be.revertedWith("Price too high");
        });


        it("Should fail if ticket does not exist", async function () {
            const ticketId = 1001;
            const offeredPrice = 105;
            let [owner, account1] = await ethers.getSigners();
            await festivalCurrency.connect(account1).approve(festivalTicketAddress, offeredPrice);
            await expect(festivalTicket.connect(account1).buyFromPreviousOwner(ticketId, offeredPrice)).to.be.reverted;
        });

        it("Should fail if not enough currency approved", async function () {
            const ticketId = 1;
            const offeredPrice = 105;
            // Fetch available accounts: 'owner' and 'account1' and 'account2'
            let [owner, account1, account2] = await ethers.getSigners();
            // Approving the amount for buying
            await festivalCurrency.approve(festivalTicketAddress, initialTicketPrice);
            // Attempting the buy operation from organizer
            await festivalTicket.connect(owner).buyTicketFromOrganizer();
            // Attempting the buy operation from an account with zero balance
            await expect(festivalTicket.connect(account2).buyFromPreviousOwner(ticketId, offeredPrice)).to.be.revertedWith("Not enough tokens approved for transaction");
        });

        it("Should give a 10% cut to the organizer", async function () {
            const ticketId = 1;
            const offeredPrice = 110; // Assuming 10% increase is allowed

            // Fetch available accounts: 'owner' and 'account1' and 'account2'
            let [owner, account1, account2] = await ethers.getSigners();
            // Minting the amount on account2
            await festivalCurrency.mint(account2.address, initialSupply);
            // Approving the amount for buying from organizer
            await festivalCurrency.approve(festivalTicketAddress, initialTicketPrice);
            await festivalTicket.connect(owner).buyTicketFromOrganizer();
            // Transfering the token from owner to account1
            await festivalTicket.connect(owner).transferFrom(owner.address, account1.address, ticketId);
            // Checking whether the owner is account1 or not.
            expect(await festivalTicket.ownerOf(ticketId)).to.equal(account1.address);

            // Get the organizer's initial balance
            const initialOrganizerBalance = await festivalCurrency.balanceOf(owner.address);
            // Approving the amount for buying token from another person not from organizer
            const maxApprovedAmount = offeredPrice + Math.floor((offeredPrice * 10) / 100)
            await festivalCurrency.connect(account2).approve(festivalTicketAddress, offeredPrice * 2);
            // Approving the token to account2
            await festivalTicket.connect(account1).approve(account2.address, ticketId)
            // Attempting the buy operation and paying 110 % amount
            await festivalTicket.connect(account2).buyFromPreviousOwner(ticketId, offeredPrice);

            // Check the organizer's new balance
            const finalOrganizerBalance = await festivalCurrency.balanceOf(owner.address);
            // Calculate the expected increase in the organizer's balance (10% of offeredPrice)
            const expectedIncrease = offeredPrice * 0.10;
            const finalBalance = BigInt(finalOrganizerBalance) - BigInt(initialOrganizerBalance)
            expect(finalBalance.toString()).to.equal(expectedIncrease.toString());
        });

    });
});
