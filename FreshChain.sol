// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract FreshChain {

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not admin");
        _;
    }

    modifier onlyProducer() {
        require(producers[msg.sender], "Not producer");
        _;
    }

    modifier onlyTransporter() {
        require(transporters[msg.sender], "Not transporter");
        _;
    }

    modifier onlyDistributor() {
        require(distributors[msg.sender], "Not distributor");
        _;
    }

    modifier onlyRetailer() {
        require(retailers[msg.sender], "Not retailer");
        _;
    }

    /* ROLE MANAGEMENT */

    mapping(address => bool) public producers;
    mapping(address => bool) public transporters;
    mapping(address => bool) public distributors;
    mapping(address => bool) public retailers;

    function registerProducer(address p) external onlyOwner {
        producers[p] = true;
    }

    function registerTransporter(address t) external onlyOwner {
        transporters[t] = true;
    }

    function registerDistributor(address d) external onlyOwner {
        distributors[d] = true;
    }

    function registerRetailer(address r) external onlyOwner {
        retailers[r] = true;
    }

    /* DATA STRUCTURES */

    struct SensorData {
        int temperature;
        int humidity;
        string location;
        uint timestamp;
    }

    struct Ownership {
        address owner;
        uint timestamp;
    }

    struct Batch {
        uint batchId;
        string productName;
        uint quantity;
        address currentOwner;
        bool arrived;
        bool passedInspection;
    }

    mapping(uint => Batch) public batches;
    mapping(uint => SensorData[]) public sensorLogs;
    mapping(uint => Ownership[]) public ownershipHistory;

    /* EVENTS */

    event BatchCreated(uint batchId, string product, uint quantity);
    event SensorLogged(uint batchId, int temp, int humidity, string location);
    event OwnershipTransferred(uint batchId, address from, address to);
    event BatchArrived(uint batchId, bool passed);

    /* CORE FUNCTIONS */

    function createBatch(
        uint batchId,
        string memory productName,
        uint quantity
    ) external onlyProducer {
        require(batches[batchId].batchId == 0, "Batch exists");

        batches[batchId] = Batch(
            batchId,
            productName,
            quantity,
            msg.sender,
            false,
            false
        );

        ownershipHistory[batchId].push(
            Ownership(msg.sender, block.timestamp)
        );

        emit BatchCreated(batchId, productName, quantity);
    }

    function addSensorData(
        uint batchId,
        int temperature,
        int humidity,
        string memory location
    ) external onlyTransporter {
        require(temperature >= -10 && temperature <= 40, "Temp out of range");
        require(humidity >= 0 && humidity <= 40, "Humidity out of range");

        sensorLogs[batchId].push(
            SensorData(temperature, humidity, location, block.timestamp)
        );

        emit SensorLogged(batchId, temperature, humidity, location);
    }

    function transferOwnership(uint batchId, address newOwner) external {
        require(batches[batchId].currentOwner == msg.sender, "Not owner");

        batches[batchId].currentOwner = newOwner;

        ownershipHistory[batchId].push(
            Ownership(newOwner, block.timestamp)
        );

        emit OwnershipTransferred(batchId, msg.sender, newOwner);
    }

    function markAsArrived(uint batchId, bool passedInspection)
        external
        onlyRetailer
    {
        batches[batchId].arrived = true;
        batches[batchId].passedInspection = passedInspection;

        emit BatchArrived(batchId, passedInspection);
    }

    /* CUSTOMER VIEW FUNCTION */

    function getBatchHistory(uint batchId)
        public
        view
        returns (
            Batch memory,
            SensorData[] memory,
            Ownership[] memory
        )
    {
        return (
            batches[batchId],
            sensorLogs[batchId],
            ownershipHistory[batchId]
        );
    }
}
