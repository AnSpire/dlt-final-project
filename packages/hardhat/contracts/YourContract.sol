//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/**
 * Simple decentralized voting contract.
 * The owner can create a poll, end it, and users can vote once per poll.
 */
contract YourContract {
    address public immutable owner;

    string public question;
    string[] public options;
    bool public votingActive;

    uint256 public currentPollId;
    mapping(address => uint256) public lastVotedPoll;
    mapping(uint256 => uint256) private voteCounts;

    event VotingCreated(string question, string[] options);
    event Voted(address indexed voter, uint256 indexed option);
    event VotingEnded();

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier whenActive() {
        require(votingActive, "Voting not active");
        _;
    }

    constructor(address _owner) {
        owner = _owner;
    }

    function createVoting(string memory _question, string[] memory _options) external onlyOwner {
        require(!votingActive, "Voting already active");
        require(bytes(_question).length > 0, "Question required");
        require(_options.length >= 2, "At least two options required");

        question = _question;
        uint256 previousOptionsLength = options.length;
        delete options;
        for (uint256 i = 0; i < previousOptionsLength; i++) {
            voteCounts[i] = 0;
        }
        for (uint256 i = 0; i < _options.length; i++) {
            require(bytes(_options[i]).length > 0, "Empty option");
            options.push(_options[i]);
            voteCounts[i] = 0;
        }

        currentPollId += 1;
        votingActive = true;

        emit VotingCreated(_question, _options);
    }

    function vote(uint256 optionIndex) external whenActive {
        require(lastVotedPoll[msg.sender] < currentPollId, "Already voted");
        require(optionIndex < options.length, "Invalid option");

        lastVotedPoll[msg.sender] = currentPollId;
        voteCounts[optionIndex] += 1;

        emit Voted(msg.sender, optionIndex);
    }

    function endVoting() external onlyOwner whenActive {
        votingActive = false;
        emit VotingEnded();
    }

    function getResults() external view returns (string memory, string[] memory, uint256[] memory, bool) {
        uint256[] memory counts = new uint256[](options.length);
        for (uint256 i = 0; i < options.length; i++) {
            counts[i] = voteCounts[i];
        }
        return (question, options, counts, votingActive);
    }
}
