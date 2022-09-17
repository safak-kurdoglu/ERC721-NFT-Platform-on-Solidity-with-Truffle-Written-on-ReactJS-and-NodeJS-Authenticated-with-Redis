const route = require('express').Router();
const front_controller = require('../controllers/front.controller');
const auth_middleware = require('../middlewares/auth.middleware');


route.post('/mint', front_controller.mint);
route.post('/show-NFT', auth_middleware.verifyToken, front_controller.showNFT);
route.post('/change-NFT-ownership', front_controller.changeNFTOwnership);
route.post('/NFT-fight', front_controller.NFTFight);
route.post('/NFT-sale', front_controller.NFTSale); 
route.post('/cancel-NFT-sale', front_controller.cancelNFTSale);
route.post('/buy-NFT', front_controller.buyNFT);
route.get('/get-datas', front_controller.getDatas);
route.post('/get-authorized-button', front_controller.getAuthorizedButton);
route.post('/get-send-rewards-button', auth_middleware.verifyToken, front_controller.getSendRewardButton);
route.get('/send-rewards', front_controller.sendReward);
route.get('/is-minting-finished', front_controller.isMintingFinished);

module.exports = route;     