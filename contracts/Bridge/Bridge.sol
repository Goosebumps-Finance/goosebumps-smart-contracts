// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../utils/Ownable.sol";
import "../utils/Pausable.sol";
import "../utils/ReentrancyGuard.sol";

interface IBridgeToken {
    function transferByBridge(
        address from,
        address to,
        uint256 tAmount
    ) external;

    function decimals() external pure returns (uint8);
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);

    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * @dev The `owner` account will be multi-sig wallet.
 */
contract Bridge is Ownable, Pausable, ReentrancyGuard {
    // state variables

    address public validator;
    address payable public TREASURY;
    address public POOL;

    uint256 public minAmount = 1;
    uint256 public maxAmount = 10000;

    uint256 private currentNonce = 0;

    mapping(address => mapping(uint256 => address)) public bridgeTokenPair; // tokenAddressOfFromChain => (toChainId => tokenAddressOfToChain)
    mapping(uint256 => uint256) public fees; // Swap fee along `toChainId`
    mapping(bytes32 => bool) public processedRedeem;

    // events list

    event LogSetFee(uint256 indexed toChainId, uint256 fee);
    event LogSetValidator(address validator);
    event LogSetTreasury(address indexed treasury);
    event LogSetPool(address indexed pool);
    event LogSetMinAmount(uint256 minAmount);
    event LogSetMaxAmount(uint256 maxAmount);
    event LogUpdateBridgeTokenPairList(
        address fromToken,
        uint256 toChainId,
        address toToken
    );
    event LogFallback(address from, uint256 amount);
    event LogReceive(address from, uint256 amount);
    event LogWithdrawalETH(address indexed recipient, uint256 amount);
    event LogWithdrawalERC20(
        address indexed token,
        address indexed recipient,
        uint256 amount
    );
    event LogSwap(
        uint256 indexed nonce,
        address indexed from,
        uint256 fromChainId,
        address fromToken,
        address to,
        uint256 toChainId,
        address toToken,
        uint256 amount
    );
    event LogRedeem(
        bytes32 txs,
        address token,
        uint256 amount,
        address to,
        uint256 fromChainId
    );

    /**
     * @dev It is not need to do `Zero-address check` of input params because deployer will check this before deploy.
     */
    constructor(
        address _validator,
        address payable _treasury,
        address _pool
    ) {
        validator = _validator;
        TREASURY = _treasury;
        POOL = _pool;
    }

    function swap(
        address token,
        uint256 amount,
        address to,
        uint256 toChainId
    ) external payable whenNotPaused nonReentrant {
        require(toChainId != cID(), "Invalid Bridge");
        require(
            bridgeTokenPair[token][toChainId] != address(0),
            "Invalid Bridge Token"
        );
        require(
            amount >= minAmount * (10**IBridgeToken(token).decimals()) &&
                amount <= maxAmount * (10**IBridgeToken(token).decimals()),
            "Wrong amount"
        );
        require(to != address(0), "Zero Address");
        require(msg.value >= fees[toChainId], "Fee is not fulfilled");

        uint256 nonce = currentNonce;
        currentNonce++;

        // send fee to TREASURY address
        TREASURY.transfer(msg.value);
        IBridgeToken(token).transferByBridge(msg.sender, POOL, amount);

        emit LogSwap(
            nonce,
            msg.sender,
            cID(),
            token,
            to,
            toChainId,
            bridgeTokenPair[token][toChainId],
            amount
        );
    }

    function redeem(
        bytes32 txs,
        address token,
        uint256 amount,
        address to,
        uint256 fromChainId
    ) external onlyValidator whenNotPaused nonReentrant {
        require(
            amount >= minAmount * (10**IBridgeToken(token).decimals()) &&
                amount <= maxAmount * (10**IBridgeToken(token).decimals()),
            "Wrong amount"
        );
        require(fromChainId != cID(), "Invalid Bridge");

        bytes32 hash_ = keccak256(abi.encodePacked(txs, fromChainId));
        require(processedRedeem[hash_] != true, "Redeem already processed");
        processedRedeem[hash_] = true;

        IBridgeToken(token).transferByBridge(POOL, to, amount);

        emit LogRedeem(txs, token, amount, to, fromChainId);
    }

    function isValidator() internal view returns (bool) {
        return (validator == msg.sender);
    }

    modifier onlyValidator() {
        require(isValidator(), "DENIED : Not Validator");
        _;
    }

    function cID() public view returns (uint256) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }

    // Set functions

    function setMinAmount(uint256 _minAmount) external onlyMultiSig {
        require(_minAmount != minAmount, "Already set MinAmount");
        require(_minAmount <= maxAmount, "MinAmount <= MaxAmount");
        minAmount = _minAmount;

        emit LogSetMinAmount(minAmount);
    }

    function setMaxAmount(uint256 _maxAmount) external onlyMultiSig {
        require(_maxAmount != maxAmount, "Already set MaxAmount");
        require(_maxAmount >= minAmount, "MaxAmount >= MinAmount");
        maxAmount = _maxAmount;

        emit LogSetMaxAmount(maxAmount);
    }

    function setPool(address _pool) external onlyMultiSig {
        require(_pool != address(0), "Zero address");
        require(POOL != _pool, "Already set POOL");
        POOL = _pool;
        emit LogSetPool(POOL);
    }

    function updateBridgeTokenPairList(
        address fromToken,
        uint256 toChainId,
        address toToken
    ) external onlyMultiSig {
        require(
            bridgeTokenPair[fromToken][toChainId] != toToken,
            "Already set bridge token pair"
        );
        bridgeTokenPair[fromToken][toChainId] = toToken;
        emit LogUpdateBridgeTokenPairList(fromToken, toChainId, toToken);
    }

    function setPause() external onlyMultiSig {
        _pause();
    }

    function setUnpause() external onlyMultiSig {
        _unpause();
    }

    function setValidator(address _validator) external onlyMultiSig {
        require(_validator != address(0), "Zero address");
        require(_validator != validator, "Already set Validator");
        validator = _validator;
        emit LogSetValidator(validator);
    }

    function setTreasury(address payable _treasury) external onlyMultiSig {
        require(_treasury != address(0), "Zero address");
        require(_treasury != TREASURY, "Already set Validator");
        TREASURY = _treasury;
        emit LogSetTreasury(TREASURY);
    }

    function setFee(uint256 toChainId, uint256 _fee) external onlyMultiSig {
        require(_fee != fees[toChainId], "Already set the same value");
        fees[toChainId] = _fee;
        emit LogSetFee(toChainId, _fee);
    }

    // Receive and Fallback functions
    receive() external payable {
        emit LogReceive(msg.sender, msg.value);
    }

    fallback() external payable {
        emit LogFallback(msg.sender, msg.value);
    }
}
