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

    address public TREASURY;                // Must be multi-sig wallet
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

    // event SetContractStatus(address addr, uint256 pauseValue);
    // event WithdrawAll(address addr, uint256 token, uint256 native);

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

    function swap(address tokenA, address tokenB, uint256 _amountIn, uint256 _slippage) public whenNotPaused
    {
        require(_amountIn > 0 , "Invalid amount");
        require(_slippage >= 0 && _slippage <= 100, "Invalid slippage.");
        require(IERC20(tokenA).balanceOf(msg.sender) > _amountIn, "Insufficient balance of A token.");

        IERC20 _tokenAContract = IERC20(tokenA);        
        _tokenAContract.transferFrom(msg.sender, address(this), _amountIn);    
        _tokenAContract.approve(address(_dexRouter), _amountIn);    
        
        uint256 _swapAmountIn = _amountIn * (10000 - SWAP_FEE) / 10000;   
        uint256 _swapRequestedAmountOutMin  = getAmountOut(tokenA, tokenB, _swapAmountIn) * (100 - _slippage) / 100;     

        address[] memory path;
        if (tokenA == dexRouter_.WETH() || tokenB == dexRouter_.WETH() ) 
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

            _dexRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                _swapAmountIn,
                _swapRequestedAmountOutMin,               
                path,
                address(msg.sender),
                block.timestamp
            );
        }   
        _tokenAContract.transfer(TREASURY, _amountIn - _swapAmountIn);     
    }

    // function swapExactBNBForTokens(address _TokenAddress, uint256 _slippage) public payable{
    //     require(pauseContract == 0, "Contract Paused");
    //     require(_slippage >= 0 && _slippage <= 100, "Invalid slippage.");

    //     address[] memory path = new address[](2);
    //     path[0] = WETH;
    //     path[1] = _TokenAddress;

    //     uint256 _swapAmountIn = msg.value.mul(999).div(1000);   
    //     uint256 _swapRequestedAmountOutMin  = getAmountOut(WETH, _TokenAddress, _swapAmountIn).mul(100 - _slippage).div(100);    

    //     _dexRouter.swapExactETHForTokensSupportingFeeOnTransferTokens{value: _swapAmountIn}(                
    //         _swapRequestedAmountOutMin,               
    //         path,
    //         address(msg.sender),
    //         block.timestamp
    //     );

    //     payable(TREASURY).transfer(msg.value.sub(_swapAmountIn));   
    // }

    // function swapExactTokenForBNB(address _TokenAddress, uint256 _amountIn, uint256 _slippage) public {
    //     require(pauseContract == 0, "Contract Paused");
    //     require(_amountIn > 0 , "Invalid amount");
    //     require(_slippage >= 0 && _slippage <= 100, "Invalid slippage.");

    //     address[] memory path = new address[](2);
    //     path[0] = _TokenAddress;
    //     path[1] = WETH;
        
    //     IERC20 _tokenAContract = IERC20(_TokenAddress);        
    //     _tokenAContract.transferFrom(msg.sender, address(this), _amountIn);    
    //     _tokenAContract.approve(address(_dexRouter), _amountIn);    

    //     uint256 _swapAmountIn = _amountIn.mul(999).div(1000);   
    //     uint256 _swapRequestedAmountOutMin  = getAmountOut(_TokenAddress, WETH, _swapAmountIn).mul(100 - _slippage).div(100);    

    //     _dexRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(   
    //         _swapAmountIn,             
    //         _swapRequestedAmountOutMin,               
    //         path,
    //         address(msg.sender),
    //         block.timestamp
    //     );
    //     _tokenAContract.transfer(TREASURY, _amountIn.sub(_swapAmountIn));     
    // }

    // function getBalanceOfToken(address _tokenAddr) public view returns(uint256){
    //     return IERC20(_tokenAddr).balanceOf(address(this));
    // }

    // function getAmountOut(address tokenA, address tokenB, uint256 _amountIn) public view returns(uint256) { 
    //     require(_amountIn > 0 , "Invalid amount");

    //     address[] memory path;
    //     if (tokenA == WETH || tokenB == WETH ) 
    //     {
    //         path = new address[](2);
    //         path[0] = tokenA;
    //         path[1] = tokenB;
    //     } 
    //     else {
    //         path = new address[](3);
    //         path[0] = tokenA;
    //         path[1] = WETH;
    //         path[2] = tokenB;
    //     }
    //     uint256[] memory amountOutMins = _dexRouter.getAmountsOut(_amountIn, path);
    //     return amountOutMins[path.length -1];  
    // }
    
    // function withdrawAll(address _addr) external onlyOwner{
    //     uint256 balance = IERC20(_addr).balanceOf(address(this));
    //     if(balance > 0) {
    //         IERC20(_addr).transfer(msg.sender, balance);
    //     }
    //     address payable mine = payable(msg.sender);
    //     if(address(this).balance > 0) {
    //         mine.transfer(address(this).balance);
    //     }
    //     emit WithdrawAll(msg.sender, balance, address(this).balance);
    // }
    
    // function getSelector(string calldata _func) external pure returns (bytes4) {
    //     return bytes4(keccak256(bytes(_func)));
    // }

    receive() external payable {
        emit LogReceived(msg.sender, msg.value);
    }

    fallback() external payable { 
        emit LogFallback(msg.sender, msg.value);
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
