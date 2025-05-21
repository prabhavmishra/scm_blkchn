pragma solidity ^0.8.0;

contract LogisticsContract {
    address owner;

    struct ShipmentLog {
        uint256 logID;
        string cargoDescription;
        string origin;
        string destination;
        uint256 timestamp;
    }

    mapping(uint256 => ShipmentLog[]) private shipmentLogs;

    mapping(address => bool) private authorizedCarriers;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this function");
        _;
    }

    modifier onlyAuthorizedCarrier() {
        require(authorizedCarriers[msg.sender], "Not an authorized carrier");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedCarriers[msg.sender] = true;
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function authorizeCarrier(address carrier) public onlyOwner {
        authorizedCarriers[carrier] = true;
    }


    function addShipmentLog(uint256 shipmentID, string memory _cargoDescription, string memory _origin, string memory _destination) public onlyAuthorizedCarrier {
        uint256 logID = shipmentLogs[shipmentID].length + 1;
        shipmentLogs[shipmentID].push(ShipmentLog(logID, _cargoDescription, _origin, _destination, block.timestamp));
    }

    function getShipmentLogs(uint256 shipmentID) public view onlyAuthorizedCarrier returns (ShipmentLog[] memory) {
        return shipmentLogs[shipmentID];
    }

}