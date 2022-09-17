const NFTmodel = require('../models/NFT.model');


async function mint(req, res){
    try {

        const NFTs = await NFTmodel.find();
        const idNext = NFTs.length === 0 ? 0 : Math.max(...NFTs.map( NFT => NFT.NFTid )) + 1;

        const newNFT = new NFTmodel({
            NFTid: idNext,
            name : "char " + (idNext+1),
            imageURL : "images/"+idNext+".jpg",
            power: 50 + ((idNext*7) % 50),
            owner: req.body.walletAddress 
        });

        await newNFT.save();

        res.json({status: true, message: "NFT minted successfully."});
    } catch(error){ 

       res.json({status: false, message: "Something went wrong.", error});
    }
}


async function showNFT(req, res){ 
    try{
        const NFTshow = await NFTmodel.findOne({owner: req.body.walletAddress, NFTid: req.body.NFTId}).exec();

        if(NFTshow)
          res.json({status: true, NFTshow});
        else
          res.json({status: false, message: "It is not your's NFT."});
    }    
    catch {
       res.json({status: false, message: "Something went wrong."});
    }
}


async function changeNFTOwnership(req, res){
    try {

        const NFTChange = await NFTmodel.findOne({NFTid: req.body.NFTId}).exec();
        NFTChange.owner = req.body.owner;
        NFTChange.save();  
        res.json({status: true, message: "NFT ownership changed successfully."});
    } catch  {
        // do logging in DB or file.
        res.json({status: false, message: "Something went wrong."});
    }   
    
}


async function NFTFight(req, res){
    try{

        const NFTsInFightModel = require('../models/NFTsInFight.model');
        const NFTInFightF = await NFTmodel.findOne({owner: "inFight"}).exec(); //NFT waiting opponent

        if(NFTInFightF){
            const NFTInFightS = await NFTmodel.findOne({NFTid: req.body.NFTId}).exec(); //NFT waiting opponent

            NFTInFightF.owner = "waitingToBeRewared";
            NFTInFightF.save();
            NFTInFightS.owner = "waitingToBeRewared";
            NFTInFightS.save();
       
            const powerFirst = NFTInFightF.power;
            const powerSecond = NFTInFightS.power;
            const randomNumber = Math.random();
 
            const marginF = Math.log(powerFirst);
            const marginS = Math.log(powerSecond);
            const probabilityF = marginF / (marginF + marginS);

            if(randomNumber < probabilityF){
                NFTF = await NFTsInFightModel.findOne({NFTid: NFTInFightF.NFTid}).exec();
                NFTF.ownerToSend = NFTF.exOwner;
                NFTF.save();
            
                NFTS = new NFTsInFightModel({
                    NFTid: req.body.NFTId,
                    exOwner: req.body.ownerAddress,
                    ownerToSend: NFTF.ownerToSend
                });
                NFTS.save();

                winnerNFT = await NFTmodel.findOne({NFTid: NFTF.NFTid}).exec();

                res.json({status: true, message: "Change game ended successfully.", winnerNFT});

            } else{
                NFTF = await NFTsInFightModel.findOne({NFTid: NFTInFightF.NFTid}).exec();
                NFTF.ownerToSend = req.body.ownerAddress;
                NFTF.save();
            
                NFTS = new NFTsInFightModel({
                    NFTid: req.body.NFTId,
                    exOwner: req.body.ownerAddress,
                    ownerToSend: req.body.ownerAddress
                });
                NFTS.save();
  
                winnerNFT = await NFTmodel.findOne({NFTid: NFTS.NFTid}).exec();
            
                res.json({status: true, message: "Change game ended successfully.", winnerNFT});
            }
        
        }
        else{ 
            NFTwaitingOpponent = new NFTsInFightModel({
                NFTid: req.body.NFTId,
                exOwner: req.body.ownerAddress
            });
            NFTwaitingOpponent.save();
            res.json({status: true, message: "Your NFT is waiting opponent."});
        }
    }catch{
        res.json({status: false, message: "Something went wrong."});
    }
}


async function NFTSale(req, res){ 

    try{
        const NFTsOnSaleModel = require('../models/NFTsOnSale.model');
        const NFTonSale = await NFTmodel.findOne({NFTid: req.body.NFTId}).exec();

        const newNFTSale = new NFTsOnSaleModel({
            NFTid: NFTonSale.NFTid,
            name : NFTonSale.name,
            imageURL : NFTonSale.imageURL,
            power: NFTonSale.power,
            owner: NFTonSale.owner,
            price: req.body.price
        })
        newNFTSale.save();
     
        res.json({status: true, message: "Your NFT is now on sale."});
    }  
    catch{

        res.json({status: false, message: "Something went wrong."});
    }
}

async function cancelNFTSale(req, res){ 

    try{
        const NFTsOnSaledModel = require('../models/NFTsOnSale.model');
        await NFTsOnSaledModel.findOne({NFTid: req.body.NFTId}).remove();

        res.json({status: true, message: "NFT sale is cancelled successfully."}); 
    }  
    catch{

        res.json({status: false, message: "Something went wrong."});
    }
}

async function buyNFT(req, res){ 

    try{
        const NFTsOnSale = require('../models/NFTsOnSale.model');
        await NFTsOnSale.findOne({NFTid: req.body.NFTId}).remove();

        res.json({status: true, message: "You bought NFT successfully."});
    }  
    catch{

        res.json({status: false, message: "Something went wrong."});
    }
}

async function getDatas(req, res){ 
    try{
        const NFTsOnSaleModel= require('../models/NFTsOnSale.model');
        const NFTsOnSale = await NFTsOnSaleModel.find();

        res.json({NFTsOnSale});
    }  
    catch(error){

        res.send();
    }
}

async function getAuthorizedButton(req, res){ 
    try{
        const NFTsOnSaleModel = require('../models/NFTsOnSale.model');
        const NFTsOnSale = await NFTsOnSaleModel.find();
        address = req.body.owner;
        cancelButtons = [];

        for(i=0; i< NFTsOnSale.length; i++){
          if(NFTsOnSale[i].owner === address)
            cancelButtons.push(true);
          else
            cancelButtons.push(false);
        }

        res.json({cancelButtons});
    }  
    catch(error){

        res.send();
    }
}

async function getSendRewardButton(req, res){ 

    try{
        const userModel = require('../models/user.model');
        const user = await userModel.findOne({address: req.body.address}).exec();
 
        if(user.role === "admin")
            res.json({status: true});
        else
            res.send({status: false});
    }  
    catch(error){

        res.send({status: false});
    } 
}

async function sendReward(req, res){ 

    try{
        const modelOfFight = require('../models/NFTsInFight.model');
        const NFTsInFight = await modelOfFight.find();

        if(NFTsInFight.length < 2)
            res.json({status: true, message: "There are no rewards waiting."});

        else{
            NFTidF = NFTsInFight[0].NFTid;  
            NFTidS = NFTsInFight[1].NFTid;
            ownerToSend = NFTsInFight[0].ownerToSend;

            await modelOfFight.findOne({NFTid: NFTidF}).remove();
            await modelOfFight.findOne({NFTid: NFTidS}).remove();

            res.json({status: true, message: "Rewards are sent successfully.", NFTidF, NFTidS, ownerToSend});
        }
    }    
    catch(error){
 
        res.json({status: false, message: "Something went wrong.", error});
    } 
}

async function isMintingFinished(req, res){ 

    const NFTs = await NFTmodel.find();

    if(NFTs.length === 50)
        res.json({status: true});
    else
        res.json({status: false});
    
}

module.exports = {
    mint,
    showNFT,
    changeNFTOwnership,
    NFTFight,
    NFTSale,
    cancelNFTSale,
    buyNFT,
    getDatas,
    getAuthorizedButton,
    getSendRewardButton,
    sendReward,
    isMintingFinished
}