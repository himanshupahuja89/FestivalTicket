// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

// Imports from OpenZeppelin library
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
// Importing the custom ERC20 token
import "./FestivalCurrency.sol";

// Defining the FestivalTicket contract, inheriting from ERC721URIStorage and Ownable contracts
contract FestivalTicket is ERC721URIStorage, Ownable {
    // Using SafeMath for uint256 to perform safe arithmetic operations
    using SafeMath for uint256;

    // Constant variable to set the maximum number of tickets
    uint256 public constant MAX_TICKETS = 1000;
    // Variable to keep track of current ticket IDs
    uint256 public currentTicketId = 0;
    // Ticket price in FestivalCurrency
    uint256 public ticketPrice; // In FestivalCurrency

    // Instance of the FestivalCurrency contract
    FestivalCurrency public currency;

    // Mapping to store the last sale price of each ticket
    mapping(uint256 => uint256) public lastSalePrice;

    // Event to log ticket buying transactions
    event TicketBought(address indexed buyer, uint256 indexed ticketId, uint256 price);

    // Constructor to initialize contract
    constructor(address _currency, uint256 _ticketPrice) ERC721("FestivalTicket", "FTK") {
        currency = FestivalCurrency(_currency);
        ticketPrice = _ticketPrice;
    }

    // Function to buy ticket from the organizer
    function buyTicketFromOrganizer() external {
        // Checking if maximum tickets are reached
        require(currentTicketId < MAX_TICKETS, "Maximum tickets reached");
        // Checking if payment is successful
        require(currency.transferFrom(msg.sender, owner(), ticketPrice), "Payment failed");

        // Incrementing the currentTicketId
        currentTicketId++;
        // Minting the new ticket
        _mint(msg.sender, currentTicketId);
        // Storing the last sale price
        lastSalePrice[currentTicketId] = ticketPrice;

        // Emitting the TicketBought event
        emit TicketBought(msg.sender, currentTicketId, ticketPrice);
    }

    // Function to buy ticket from a previous owner
    function buyFromPreviousOwner(uint256 ticketId, uint256 offeredPrice) external {
        // Getting the previous owner of the ticket
        address previousOwner = ownerOf(ticketId);

        // Validating if the ticket exists
        require(previousOwner != address(0), "Ticket does not exist");
        // Calculating maximum allowed price for the ticket
        uint256 maxAllowedPrice = lastSalePrice[ticketId].mul(110).div(100);
        // Checking if offered price is valid
        require(offeredPrice <= maxAllowedPrice, "Price too high");

        // Calculate total cost and the organizer's cut
        uint256 organizerCut = offeredPrice.mul(10).div(100);
        uint256 totalCost = offeredPrice.add(organizerCut);

        // Ensure enough approved tokens are available to cover total cost
        require(currency.allowance(msg.sender, address(this)) >= totalCost, "Not enough tokens approved for transaction");

        // Process payments
        require(currency.transferFrom(msg.sender, previousOwner, offeredPrice), "Payment to previous owner failed");
        require(currency.transferFrom(msg.sender, owner(), organizerCut), "Transfer to organizer failed");

        // Transfer ownership of the ticket
        safeTransferFrom(previousOwner, msg.sender, ticketId);
        lastSalePrice[ticketId] = offeredPrice;

        // Emitting the TicketBought event
        emit TicketBought(msg.sender, ticketId, offeredPrice);
    }
}
