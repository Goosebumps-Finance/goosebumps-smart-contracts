// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../DEX/interfaces/IGooseBumpsSwapRouter02.sol";
import "../DEX/interfaces/IGooseBumpsSwapFactory.sol";

// found issue with transfer fee tokens
contract DEXManagement is Ownable, Pausable, ReentrancyGuard {
    //--------------------------------------
    // State variables
    //--------------------------------------

    address public TREASURY; // Must be multi-sig wallet or Treasury contract
    uint256 public SWAP_FEE; // Fee = SWAP_FEE / FEE_DENOMINATOR
    uint256 public SWAP_FEE_0X; // Fee = SWAP_FEE_0X / FEE_DENOMINATOR
    uint256 public FEE_DENOMINATOR = 10000;

    IGooseBumpsSwapRouter02 public dexRouter_;

    //-------------------------------------------------------------------------
    // EVENTS
    //-------------------------------------------------------------------------

    event LogReceived(address indexed, uint256);
    event LogFallback(address indexed, uint256);
    event LogSetTreasury(address indexed, address indexed);
    event LogSetSwapFee(address indexed, uint256);
    event LogSetSwapFee0x(address indexed, uint256);
    event LogSetDexRouter(address indexed, address indexed);
    event LogSwapExactTokensForTokens(
        address indexed,
        address indexed,
        uint256,
        uint256
    );
    event LogSwapExactETHForTokens(address indexed, uint256, uint256);
    event LogSwapExactTokenForETH(address indexed, uint256, uint256);
    event LogSwapExactTokensForTokensOn0x(
        address indexed,
        address indexed,
        uint256,
        uint256
    );
    event LogSwapExactETHForTokensOn0x(address indexed, uint256, uint256);
    event LogSwapExactTokenForETHOn0x(address indexed, uint256, uint256);

    //-------------------------------------------------------------------------
    // CONSTRUCTOR
    //-------------------------------------------------------------------------

    /**
     * @param   _router: router address
     * @param   _treasury: treasury address
     * @param   _swapFee: swap fee value
     * @param   _swapFee0x: swap fee for 0x value
     */
    constructor(
        address _router,
        address _treasury,
        uint256 _swapFee,
        uint256 _swapFee0x
    ) {
        require(_treasury != address(0), "Zero address");
        dexRouter_ = IGooseBumpsSwapRouter02(_router);
        TREASURY = _treasury;
        SWAP_FEE = _swapFee;
        SWAP_FEE_0X = _swapFee0x;
    }

    /**
     * @param   _tokenA: tokenA contract address
     * @param   _tokenB: tokenB contract address
     * @return  bool: if pair is in DEX, return true, else, return false.
     */
    function isPairExists(address _tokenA, address _tokenB)
        public
        view
        returns (bool)
    {
        return
            IGooseBumpsSwapFactory(dexRouter_.factory()).getPair(
                _tokenA,
                _tokenB
            ) != address(0);
    }

    /**
     * @param   _tokenA: tokenA contract address
     * @param   _tokenB: tokenB contract address
     * @return  bool: if path is in DEX, return true, else, return false.
     */
    function isPathExists(address _tokenA, address _tokenB)
        public
        view
        returns (bool)
    {
        return
            IGooseBumpsSwapFactory(dexRouter_.factory()).getPair(
                _tokenA,
                _tokenB
            ) !=
            address(0) ||
            (IGooseBumpsSwapFactory(dexRouter_.factory()).getPair(
                _tokenA,
                dexRouter_.WETH()
            ) !=
                address(0) &&
                IGooseBumpsSwapFactory(dexRouter_.factory()).getPair(
                    dexRouter_.WETH(),
                    _tokenB
                ) !=
                address(0));
    }

    /**
     * @param   tokenIn: tokenIn contract address
     * @param   tokenOut: tokenOut contract address
     * @param   _amountIn: amount of input token
     * @return  uint256: Given an input asset amount, returns the maximum output amount of the other asset.
     */
    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 _amountIn
    ) external view returns (uint256) {
        require(_amountIn > 0, "Invalid amount");
        require(isPathExists(tokenIn, tokenOut), "Invalid path");

        address[] memory path;
        if (isPairExists(tokenIn, tokenOut)) {
            path = new address[](2);
            path[0] = tokenIn;
            path[1] = tokenOut;
        } else {
            path = new address[](3);
            path[0] = tokenIn;
            path[1] = dexRouter_.WETH();
            path[2] = tokenOut;
        }
        uint256[] memory amountOutMaxs = dexRouter_.getAmountsOut(
            (_amountIn * (FEE_DENOMINATOR - SWAP_FEE)) / FEE_DENOMINATOR,
            path
        );
        return amountOutMaxs[path.length - 1];
    }

    /**
     * @param   tokenIn: tokenIn contract address
     * @param   tokenOut: tokenOut contract address
     * @param   _amountOut: amount of output token
     * @return  uint256: Returns the minimum input asset amount required to buy the given output asset amount.
     */
    function getAmountIn(
        address tokenIn,
        address tokenOut,
        uint256 _amountOut
    ) external view returns (uint256) {
        require(_amountOut > 0, "Invalid amount");
        require(isPathExists(tokenIn, tokenOut), "Invalid path");

        address[] memory path;
        if (isPairExists(tokenIn, tokenOut)) {
            path = new address[](2);
            path[0] = tokenIn;
            path[1] = tokenOut;
        } else {
            path = new address[](3);
            path[0] = tokenIn;
            path[1] = dexRouter_.WETH();
            path[2] = tokenOut;
        }
        uint256[] memory amountInMins = dexRouter_.getAmountsIn(
            _amountOut,
            path
        );
        return
            (amountInMins[0] * FEE_DENOMINATOR) / (FEE_DENOMINATOR - SWAP_FEE);
    }

    /**
     * @param   _amountIn: Amount of InputToken to swap on GooseBumps
     * @param   _amountOutMin: The minimum amount of output tokens that must be received for the transaction not to revert.
     * @param   path: Swappath on Goosebumps
     * @param   to: Recipient of the output tokens.
     * @param   deadline: Deadline, Timestamp after which the transaction will revert.
     * @notice  Swap ERC20 token to ERC20 token on GooseBumps
     */
    function swapExactTokensForTokens(
        uint256 _amountIn,
        uint256 _amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external whenNotPaused nonReentrant {
        require(
            IERC20(path[0]).transferFrom(
                _msgSender(),
                address(this),
                _amountIn
            ),
            "Faild TransferFrom"
        );

        uint256 _swapAmountIn = (_amountIn * (FEE_DENOMINATOR - SWAP_FEE)) /
            FEE_DENOMINATOR;

        require(IERC20(path[0]).approve(address(dexRouter_), _swapAmountIn));

        uint256 boughtAmount = IERC20(path[path.length - 1]).balanceOf(to);
        dexRouter_.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            _swapAmountIn,
            _amountOutMin,
            path,
            to,
            deadline
        );
        boughtAmount =
            IERC20(path[path.length - 1]).balanceOf(to) -
            boughtAmount;

        require(
            IERC20(path[0]).transfer(TREASURY, _amountIn - _swapAmountIn),
            "Faild Transfer"
        );

        emit LogSwapExactTokensForTokens(
            path[0],
            path[path.length - 1],
            _amountIn,
            boughtAmount
        );
    }

    /**
     * @param   tokenA: InputToken Address to swap on 0x, The `sellTokenAddress` field from the API response
     * @param   tokenB: OutputToken Address to swap on 0x, The `buyTokenAddress` field from the API response
     * @param   _amountIn: Amount of InputToken to swap on 0x, The `sellAmount` field from the API response
     * @param   spender: Spender to approve the amount of InputToken, The `allowanceTarget` field from the API response
     * @param   swapTarget: SwapTarget contract address, The `to` field from the API response
     * @param   swapCallData: CallData, The `data` field from the API response
     * @param   to: Recipient of the output tokens.
     * @param   deadline: Deadline, Timestamp after which the transaction will revert.
     * @notice  Swap ERC20 token to ERC20 token by using 0x protocol
     */
    function swapExactTokensForTokensOn0x(
        address tokenA,
        address tokenB,
        uint256 _amountIn,
        address spender,
        address payable swapTarget,
        bytes calldata swapCallData,
        address to,
        uint256 deadline
    ) external whenNotPaused nonReentrant {
        require(deadline >= block.timestamp, "DEXManagement: EXPIRED");
        require(_amountIn > 0, "Invalid amount");
        require(address(swapTarget) != address(0), "Zero address");

        require(
            IERC20(tokenA).transferFrom(_msgSender(), address(this), _amountIn),
            "Faild TransferFrom"
        );
        uint256 _swapAmountIn = (_amountIn * (FEE_DENOMINATOR - SWAP_FEE_0X)) /
            FEE_DENOMINATOR;

        require(IERC20(tokenA).approve(spender, _swapAmountIn));

        uint256 boughtAmount = IERC20(tokenB).balanceOf(address(this));

        (bool success, ) = swapTarget.call(swapCallData);
        require(success, "SWAP_CALL_FAILED");

        boughtAmount = IERC20(tokenB).balanceOf(address(this)) - boughtAmount;

        require(IERC20(tokenB).transfer(to, boughtAmount), "Faild Transfer");

        require(
            IERC20(tokenA).transfer(TREASURY, _amountIn - _swapAmountIn),
            "Faild Transfer"
        );

        emit LogSwapExactTokensForTokensOn0x(
            tokenA,
            tokenB,
            _amountIn,
            boughtAmount
        );
    }

    /**
     * @param   token: OutputToken Address to swap on GooseBumps
     * @param   _amountOutMin: The minimum amount of output tokens that must be received for the transaction not to revert.
     * @param   to: Recipient of the output tokens.
     * @param   deadline: Deadline, Timestamp after which the transaction will revert.
     * @notice  Swap ETH to ERC20 token on GooseBumps
     */
    function swapExactETHForTokens(
        address token,
        uint256 _amountOutMin,
        address to,
        uint256 deadline
    ) external payable whenNotPaused nonReentrant {
        require(isPathExists(token, dexRouter_.WETH()), "Invalid path");
        require(msg.value > 0, "Invalid amount");

        address[] memory path = new address[](2);
        path[0] = dexRouter_.WETH();
        path[1] = token;

        uint256 _swapAmountIn = (msg.value * (FEE_DENOMINATOR - SWAP_FEE)) /
            FEE_DENOMINATOR;

        uint256 boughtAmount = IERC20(token).balanceOf(to);
        dexRouter_.swapExactETHForTokensSupportingFeeOnTransferTokens{
            value: _swapAmountIn
        }(_amountOutMin, path, to, deadline);
        boughtAmount = IERC20(token).balanceOf(to) - boughtAmount;

        payable(TREASURY).transfer(msg.value - _swapAmountIn);

        emit LogSwapExactETHForTokens(token, msg.value, boughtAmount);
    }

    /**
     * @param   token: OutputToken Address to swap on 0x, The `buyTokenAddress` field from the API response
     * @param   swapTarget: SwapTarget contract address, The `to` field from the API response
     * @param   swapCallData: CallData, The `data` field from the API response
     * @param   to: Recipient of the output tokens.
     * @param   deadline: Deadline, Timestamp after which the transaction will revert.
     * @notice  Swap ETH to ERC20 token by using 0x protocol
     */
    function swapExactETHForTokensOn0x(
        address token,
        address payable swapTarget,
        bytes calldata swapCallData,
        address to,
        uint256 deadline
    ) external payable whenNotPaused nonReentrant {
        require(deadline >= block.timestamp, "DEXManagement: EXPIRED");
        require(msg.value > 0, "Invalid amount");
        require(address(swapTarget) != address(0), "Zero address");

        uint256 _swapAmountIn = (msg.value * (FEE_DENOMINATOR - SWAP_FEE_0X)) /
            FEE_DENOMINATOR;

        uint256 boughtAmount = IERC20(token).balanceOf(address(this));

        (bool success, ) = swapTarget.call{value: _swapAmountIn}(swapCallData);
        require(success, "SWAP_CALL_FAILED");

        boughtAmount = IERC20(token).balanceOf(address(this)) - boughtAmount;

        require(IERC20(token).transfer(to, boughtAmount), "Faild Transfer");

        payable(TREASURY).transfer(msg.value - _swapAmountIn);

        emit LogSwapExactETHForTokensOn0x(token, msg.value, boughtAmount);
    }

    /**
     * @param   token: InputToken Address to swap on GooseBumps
     * @param   _amountIn: Amount of InputToken to swap on GooseBumps
     * @param   _amountOutMin: The minimum amount of output tokens that must be received for the transaction not to revert.
     * @param   to: Recipient of the output tokens.
     * @param   deadline: Deadline, Timestamp after which the transaction will revert.
     * @notice  Swap ERC20 token to ETH on GooseBumps
     */
    function swapExactTokenForETH(
        address token,
        uint256 _amountIn,
        uint256 _amountOutMin,
        address to,
        uint256 deadline
    ) external whenNotPaused nonReentrant {
        require(isPathExists(token, dexRouter_.WETH()), "Invalid path");
        require(_amountIn > 0, "Invalid amount");

        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = dexRouter_.WETH();

        require(
            IERC20(token).transferFrom(_msgSender(), address(this), _amountIn),
            "Faild TransferFrom"
        );
        uint256 _swapAmountIn = (_amountIn * (FEE_DENOMINATOR - SWAP_FEE)) /
            FEE_DENOMINATOR;

        require(IERC20(token).approve(address(dexRouter_), _swapAmountIn));

        uint256 boughtAmount = address(to).balance;
        dexRouter_.swapExactTokensForETHSupportingFeeOnTransferTokens(
            _swapAmountIn,
            _amountOutMin,
            path,
            to,
            deadline
        );
        boughtAmount = address(to).balance - boughtAmount;

        require(
            IERC20(token).transfer(TREASURY, _amountIn - _swapAmountIn),
            "Faild Transfer"
        );

        emit LogSwapExactTokenForETH(token, _amountIn, boughtAmount);
    }

    /**
     * @param   token: InputToken Address to swap on 0x, The `sellTokenAddress` field from the API response
     * @param   _amountIn: Amount of InputToken to swap on 0x, The `sellAmount` field from the API response
     * @param   spender: Spender to approve the amount of InputToken, The `allowanceTarget` field from the API response
     * @param   swapTarget: SwapTarget contract address, The `to` field from the API response
     * @param   swapCallData: CallData, The `data` field from the API response
     * @param   to: Recipient of the output tokens.
     * @param   deadline: Deadline, Timestamp after which the transaction will revert.
     * @notice  Swap ERC20 token to ETH by using 0x protocol
     */
    function swapExactTokenForETHOn0x(
        address token,
        uint256 _amountIn,
        address spender,
        address payable swapTarget,
        bytes calldata swapCallData,
        address to,
        uint256 deadline
    ) external whenNotPaused nonReentrant {
        require(deadline >= block.timestamp, "DEXManagement: EXPIRED");
        require(_amountIn > 0, "Invalid amount");
        require(address(swapTarget) != address(0), "Zero address");
        require(to != address(0), "'to' is Zero address");

        require(
            IERC20(token).transferFrom(_msgSender(), address(this), _amountIn),
            "Faild TransferFrom"
        );
        uint256 _swapAmountIn = (_amountIn * (FEE_DENOMINATOR - SWAP_FEE_0X)) /
            FEE_DENOMINATOR;

        require(IERC20(token).approve(spender, _swapAmountIn));

        uint256 boughtAmount = address(this).balance;

        (bool success, ) = swapTarget.call(swapCallData);
        require(success, "SWAP_CALL_FAILED");

        boughtAmount = address(this).balance - boughtAmount;

        payable(to).transfer(boughtAmount);

        require(
            IERC20(token).transfer(TREASURY, _amountIn - _swapAmountIn),
            "Faild Transfer"
        );

        emit LogSwapExactTokenForETHOn0x(token, _amountIn, boughtAmount);
    }

    receive() external payable {
        emit LogReceived(_msgSender(), msg.value);
    }

    fallback() external payable {
        emit LogFallback(_msgSender(), msg.value);
    }

    //-------------------------------------------------------------------------
    // set functions
    //-------------------------------------------------------------------------

    function setPause() external onlyOwner {
        _pause();
    }

    function setUnpause() external onlyOwner {
        _unpause();
    }

    function setTreasury(address _newTreasury) external onlyOwner {
        require(
            TREASURY != _newTreasury,
            "Same address! Notice: Must be Multi-sig Wallet!"
        );
        TREASURY = _newTreasury;

        emit LogSetTreasury(_msgSender(), TREASURY);
    }

    function setSwapFee(uint256 _newSwapFee) external onlyOwner {
        require(SWAP_FEE != _newSwapFee, "Same value!");
        SWAP_FEE = _newSwapFee;

        emit LogSetSwapFee(_msgSender(), SWAP_FEE);
    }

    function setSwapFee0x(uint256 _newSwapFee0x) external onlyOwner {
        require(SWAP_FEE_0X != _newSwapFee0x, "Same value!");
        SWAP_FEE_0X = _newSwapFee0x;

        emit LogSetSwapFee0x(_msgSender(), SWAP_FEE_0X);
    }

    function setDexRouter(address _newRouter) external onlyOwner {
        require(address(dexRouter_) != _newRouter, "Same router!");
        dexRouter_ = IGooseBumpsSwapRouter02(_newRouter);

        emit LogSetDexRouter(_msgSender(), address(dexRouter_));
    }
}
