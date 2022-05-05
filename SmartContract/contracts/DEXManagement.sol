// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./DEX/interfaces/IGooseBumpsSwapRouter02.sol";
import "./DEX/interfaces/IGooseBumpsSwapFactory.sol";

contract DEXManagement is Ownable, Pausable {
    
    //--------------------------------------
    // State variables
    //--------------------------------------

    address public TREASURY;                // Must be multi-sig wallet or Treasury contract
    uint256 public SWAP_FEE;                // Fee = SWAP_FEE / 10000
    uint256 public SWAP_FEE_0X;             // Fee = SWAP_FEE_0X / 10000

    IGooseBumpsSwapRouter02 public dexRouter_;

    //-------------------------------------------------------------------------
    // EVENTS
    //-------------------------------------------------------------------------

    event LogReceived(address indexed, uint);
    event LogFallback(address indexed, uint);
    event LogSetTreasury(address indexed, address indexed);
    event LogSetSwapFee(address indexed, uint256);
    event LogSetSwapFee0x(address indexed, uint256);
    event LogSetDexRouter(address indexed, address indexed);
    event LogWithdraw(address indexed, uint256, uint256);

    //-------------------------------------------------------------------------
    // CONSTRUCTOR
    //-------------------------------------------------------------------------

    /**
     * @param   _router: router address
     * @param   _treasury: treasury address
     * @param   _swapFee: swap fee value
     * @param   _swapFee0x: swap fee for 0x value
     */
    constructor(address _router, address _treasury, uint256 _swapFee, uint256 _swapFee0x ) 
    {
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
    function isPairExists(address _tokenA, address _tokenB) public view returns(bool){        
        return IGooseBumpsSwapFactory(dexRouter_.factory()).getPair(_tokenA, _tokenB) != address(0);
    }

    /**
     * @param   _tokenA: tokenA contract address
     * @param   _tokenB: tokenB contract address
     * @return  bool: if path is in DEX, return true, else, return false.
     */
     function isPathExists(address _tokenA, address _tokenB) public view returns(bool){        
        return IGooseBumpsSwapFactory(dexRouter_.factory()).getPair(_tokenA, _tokenB) != address(0) || 
            (IGooseBumpsSwapFactory(dexRouter_.factory()).getPair(_tokenA, dexRouter_.WETH()) != address(0) && 
            IGooseBumpsSwapFactory(dexRouter_.factory()).getPair(dexRouter_.WETH(), _tokenB) != address(0));
    }

    /**
     * @param   tokenIn: tokenIn contract address
     * @param   tokenOut: tokenOut contract address
     * @param   _amountIn: amount of input token
     * @return  uint256: Given an input asset amount, returns the maximum output amount of the other asset.
     */
    function getAmountOut(address tokenIn, address tokenOut, uint256 _amountIn) public view returns(uint256) { 
        require(_amountIn > 0 , "Invalid amount");
        require(isPathExists(tokenIn, tokenOut), "Path does not exist");

        address[] memory path;
        if (isPairExists(tokenIn, tokenOut))
        {
            path = new address[](2);
            path[0] = tokenIn;
            path[1] = tokenOut;
        }
        else {
            path = new address[](3);
            path[0] = tokenIn;
            path[1] = dexRouter_.WETH();
            path[2] = tokenOut;
        }
        uint256[] memory amountOutMaxs = dexRouter_.getAmountsOut(_amountIn, path);
        return amountOutMaxs[path.length -1];  
    }

    /**
     * @param   tokenIn: tokenIn contract address
     * @param   tokenOut: tokenOut contract address
     * @param   _amountOut: amount of output token
     * @return  uint256: Returns the minimum input asset amount required to buy the given output asset amount.
     */
     function getAmountIn(address tokenIn, address tokenOut, uint256 _amountOut) public view returns(uint256) { 
        require(_amountOut > 0 , "Invalid amount");
        require(isPathExists(tokenIn, tokenOut), "Path does not exist");

        address[] memory path;
        if (isPairExists(tokenIn, tokenOut))
        {
            path = new address[](2);
            path[0] = tokenIn;
            path[1] = tokenOut;
        } 
        else {
            path = new address[](3);
            path[0] = tokenIn;
            path[1] = dexRouter_.WETH();
            path[2] = tokenOut;
        }
        uint256[] memory amountInMins = dexRouter_.getAmountsIn(_amountOut, path);
        return amountInMins[0];
    }

    function swapExactTokensForTokens(address tokenA, address tokenB, uint256 _amountIn, uint256 _slippage, uint deadline) public whenNotPaused
    {
        require(_amountIn > 0 , "Invalid amount");
        require(_slippage >= 0 && _slippage <= 10000, "Invalid slippage.");
        require(IERC20(tokenA).balanceOf(_msgSender()) > _amountIn, "Insufficient balance of A token.");

        IERC20 _tokenAContract = IERC20(tokenA);        
        _tokenAContract.transferFrom(_msgSender(), address(this), _amountIn);    
        _tokenAContract.approve(address(dexRouter_), _amountIn);    
        
        uint256 _swapAmountIn = _amountIn * (10000 - SWAP_FEE) / 10000;
        uint256 _swapRequestedAmountOutMin  = getAmountOut(tokenA, tokenB, _swapAmountIn) * (10000 - _slippage) / 10000;     

        address[] memory path;
        if (isPairExists(tokenA, tokenB)) 
        {
            path = new address[](2);
            path[0] = tokenA;
            path[1] = tokenB;
        }         
        else {
            path = new address[](3);
            path[0] = tokenA;
            path[1] = dexRouter_.WETH();
            path[2] = tokenB;

            dexRouter_.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                _swapAmountIn,
                _swapRequestedAmountOutMin,               
                path,
                _msgSender(),
                deadline
            );
        }   
        _tokenAContract.transfer(TREASURY, _amountIn - _swapAmountIn);     
    }

    function swapExactETHForTokens(address token, uint256 _slippage, uint deadline) public payable whenNotPaused{
        require(_slippage >= 0 && _slippage <= 10000, "Invalid slippage.");

        address[] memory path = new address[](2);
        path[0] = dexRouter_.WETH();
        path[1] = token;

        uint256 _swapAmountIn = msg.value * (10000 - SWAP_FEE) / 10000;
        uint256 _swapRequestedAmountOutMin  = getAmountOut(dexRouter_.WETH(), token, _swapAmountIn) * (10000 - _slippage) / 10000;    

        dexRouter_.swapExactETHForTokensSupportingFeeOnTransferTokens{value: _swapAmountIn}(                
            _swapRequestedAmountOutMin,               
            path,
            _msgSender(),
            deadline
        );

        payable(TREASURY).transfer(msg.value - _swapAmountIn);
    }

    function swapExactTokenForETH(address token, uint256 _amountIn, uint256 _slippage, uint deadline) public whenNotPaused{
        require(_amountIn > 0 , "Invalid amount");
        require(_slippage >= 0 && _slippage <= 10000, "Invalid slippage.");

        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = dexRouter_.WETH();
        
        IERC20 _tokenAContract = IERC20(token);
        _tokenAContract.transferFrom(_msgSender(), address(this), _amountIn);    
        _tokenAContract.approve(address(dexRouter_), _amountIn);    

        uint256 _swapAmountIn = _amountIn * (10000 -  SWAP_FEE) / 10000;   
        uint256 _swapRequestedAmountOutMin  = getAmountOut(token, dexRouter_.WETH(), _swapAmountIn) * (10000 - _slippage) / 10000;    

        dexRouter_.swapExactTokensForETHSupportingFeeOnTransferTokens(   
            _swapAmountIn,             
            _swapRequestedAmountOutMin,               
            path,
            _msgSender(),
            deadline
        );
        _tokenAContract.transfer(TREASURY, _amountIn - _swapAmountIn);     
    }
    
    function withdraw(address token) external onlyOwner{
        require(IERC20(token).balanceOf(address(this)) > 0 || address(this).balance > 0, "Zero Balance!");
        uint256 balance = IERC20(token).balanceOf(address(this));
        if(balance > 0) {
            IERC20(token).transfer(_msgSender(), balance);
        }
        if(address(this).balance > 0) {
            payable(_msgSender()).transfer(address(this).balance);
        }
        emit LogWithdraw(_msgSender(), balance, address(this).balance);
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

    function setTreasury(address _newTreasury) external onlyOwner whenNotPaused {
        require(TREASURY != _newTreasury, "Same address! Notice: Must be Multi-sig Wallet!");
        TREASURY = _newTreasury;

        emit LogSetTreasury(_msgSender(), TREASURY);
    }

    function setSwapFee(uint256 _newSwapFee) external onlyOwner whenNotPaused {
        require(SWAP_FEE != _newSwapFee, "Same value!");
        SWAP_FEE = _newSwapFee;

        emit LogSetSwapFee(_msgSender(), SWAP_FEE);
    }

    function setSwapFee0x(uint256 _newSwapFee0x) external onlyOwner whenNotPaused {
        require(SWAP_FEE_0X != _newSwapFee0x, "Same value!");
        SWAP_FEE_0X = _newSwapFee0x;

        emit LogSetSwapFee0x(_msgSender(), SWAP_FEE_0X);
    }

    function setDexRouter(address _newRouter) external onlyOwner whenNotPaused {
        require(address(dexRouter_) != _newRouter, "Same router!");
        dexRouter_ = IGooseBumpsSwapRouter02(_newRouter);
        
        emit LogSetDexRouter(_msgSender(), address(dexRouter_));
    }
}
