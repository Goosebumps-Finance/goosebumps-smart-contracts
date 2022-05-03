// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./DEX/interfaces/IGooseBumpsSwapRouter02.sol";
import "./DEX/interfaces/IGooseBumpsSwapFactory.sol";

contract SwapOnPolygon is Ownable, Pausable {
    
    //--------------------------------------
    // State variables
    //--------------------------------------

    address public TREASURY;           // Must be multi-sig wallet
    uint256 public SWAP_FEE;           // Fee = SWAP_FEE / 10000

    address public dexRouter_;
    address public dexFactory_;
    address public WETH;

    //-------------------------------------------------------------------------
    // EVENTS
    //-------------------------------------------------------------------------

    event Received(address, uint);
    event Fallback(address, uint);
    // event SetContractStatus(address addr, uint256 pauseValue);
    // event WithdrawAll(address addr, uint256 token, uint256 native);

    //-------------------------------------------------------------------------
    // CONSTRUCTOR
    //-------------------------------------------------------------------------

    /**
     */
    constructor(address _router, address _treasury, uint256 _swapFee ) 
    {
        dexRouter_ = _router;
        dexFactory_ = IGooseBumpsSwapRouter02(dexRouter_).factory();
        WETH = IGooseBumpsSwapRouter02(dexRouter_).WETH();
        TREASURY = _treasury;
        SWAP_FEE = _swapFee;
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    fallback() external payable { 
        emit Fallback(msg.sender, msg.value);
    }

    // function isPairExists(address _Atoken, address _Btoken) public view returns(bool){        
    //     return _dexFactory.getPair(_Atoken, _Btoken) != address(0);
    // }

    // function isSwapPathExists(address _Atoken, address _Btoken) public view returns(bool){        
    //     return _dexFactory.getPair(_Atoken, _Btoken) != address(0) || 
    //         (_dexFactory.getPair(_Atoken, WETH) != address(0) && _dexFactory.getPair(WETH, _Btoken) != address(0));
    // }

    // function getContractStatus() external view returns (uint8) {
    //     return pauseContract;
    // }

    // function setContractStatus(uint8 _newPauseContract) external onlyOwner {
    //     pauseContract = _newPauseContract;
    //     emit SetContractStatus(msg.sender, _newPauseContract);
    // }

    // function setDexFactoryAddress(address _addr) public onlyOwner{
    //     require(pauseContract == 0, "Contract Paused");
    //     dexFactoryAddress = _addr;
    // }

    // function getDexFactoryAddress() public view returns(address){
    //     return dexFactoryAddress;
    // }

    // function setNativeWrappedCurrencyAddress(address _addr) public onlyOwner{
    //     require(pauseContract == 0, "Contract Paused");
    //     WETH = _addr;
    // }

    // function getnativeWrappedCurrencyAddress() public view returns(address){
    //     return WETH;
    // }

    // function setTreasury(address _addr) public onlyOwner{
    //     require(pauseContract == 0, "Contract Paused");
    //     TREASURY = _addr;
    // }

    // function getTreasury() public view returns(address){
    //     return TREASURY;
    // }

    // function setDexRouter(address _newRouter) public onlyOwner{
    //     require(pauseContract == 0, "Contract Paused");
    //     _dexRouter = IGooseBumpsSwapRouter02(_newRouter);
    //     _dexFactory = _dexRouter.factory();
    // }

    // function getDexRouter() public view returns(address){
    //     return address(_dexRouter);
    // }

    // function swap(address _Aaddress, address _Baddress, uint256 _amountIn, uint256 _slippage) public 
    // {
    //     require(pauseContract == 0, "Contract Paused");
    //     require(_amountIn > 0 , "Invalid amount");
    //     require(_slippage >= 0 && _slippage <= 100, "Invalid slippage.");
    //     require(IERC20(_Aaddress).balanceOf(msg.sender) > _amountIn, "Insufficient balance of A token.");

    //     IERC20 _tokenAContract = IERC20(_Aaddress);        
    //     _tokenAContract.transferFrom(msg.sender, address(this), _amountIn);    
    //     _tokenAContract.approve(address(_dexRouter), _amountIn);    
        
    //     uint256 _realAmountIn = _amountIn.mul(999).div(1000);   
    //     uint256 _realRequestedAmountOutMin  = getAmountOut(_Aaddress, _Baddress, _realAmountIn).mul(100 - _slippage).div(100);     

    //     address[] memory path;
    //     if (_Aaddress == WETH || _Baddress == WETH ) 
    //     {
    //         path = new address[](2);
    //         path[0] = _Aaddress;
    //         path[1] = _Baddress;
    //     }         
    //     else {
    //         path = new address[](3);
    //         path[0] = _Aaddress;
    //         path[1] = WETH;
    //         path[2] = _Baddress;

    //         _dexRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(
    //             _realAmountIn,
    //             _realRequestedAmountOutMin,               
    //             path,
    //             address(msg.sender),
    //             block.timestamp
    //         );
    //     }   
    //     _tokenAContract.transfer(TREASURY, _amountIn.sub(_realAmountIn));     
    // }

    // function swapExactBNBForTokens(address _TokenAddress, uint256 _slippage) public payable{
    //     require(pauseContract == 0, "Contract Paused");
    //     require(_slippage >= 0 && _slippage <= 100, "Invalid slippage.");

    //     address[] memory path = new address[](2);
    //     path[0] = WETH;
    //     path[1] = _TokenAddress;

    //     uint256 _realAmountIn = msg.value.mul(999).div(1000);   
    //     uint256 _realRequestedAmountOutMin  = getAmountOut(WETH, _TokenAddress, _realAmountIn).mul(100 - _slippage).div(100);    

    //     _dexRouter.swapExactETHForTokensSupportingFeeOnTransferTokens{value: _realAmountIn}(                
    //         _realRequestedAmountOutMin,               
    //         path,
    //         address(msg.sender),
    //         block.timestamp
    //     );

    //     payable(TREASURY).transfer(msg.value.sub(_realAmountIn));   
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

    //     uint256 _realAmountIn = _amountIn.mul(999).div(1000);   
    //     uint256 _realRequestedAmountOutMin  = getAmountOut(_TokenAddress, WETH, _realAmountIn).mul(100 - _slippage).div(100);    

    //     _dexRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(   
    //         _realAmountIn,             
    //         _realRequestedAmountOutMin,               
    //         path,
    //         address(msg.sender),
    //         block.timestamp
    //     );
    //     _tokenAContract.transfer(TREASURY, _amountIn.sub(_realAmountIn));     
    // }

    // function getBalanceOfToken(address _tokenAddr) public view returns(uint256){
    //     return IERC20(_tokenAddr).balanceOf(address(this));
    // }

    // function getAmountOut(address _Aaddress, address _Baddress, uint256 _amountIn) public view returns(uint256) { 
    //     require(_amountIn > 0 , "Invalid amount");

    //     address[] memory path;
    //     if (_Aaddress == WETH || _Baddress == WETH ) 
    //     {
    //         path = new address[](2);
    //         path[0] = _Aaddress;
    //         path[1] = _Baddress;
    //     } 
    //     else {
    //         path = new address[](3);
    //         path[0] = _Aaddress;
    //         path[1] = WETH;
    //         path[2] = _Baddress;
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
}

