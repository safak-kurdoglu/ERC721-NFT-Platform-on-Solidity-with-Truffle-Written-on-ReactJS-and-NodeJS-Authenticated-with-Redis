App = {
  web3Provider: null,
  contracts: {},


  init: async function() {

    await axios.get('http://localhost:3000/front/get-datas').then(resp => {
      NFTsOnSale = resp.data.NFTsOnSale
    
      var itemsRow = $('#NFT-row');
      var itemTemplate = $('#NFT-template');

      for (i = 0; i < NFTsOnSale.length; i ++) {
        itemTemplate.find('.panel-title').text(NFTsOnSale[i].name);
        itemTemplate.find('img').attr('src', NFTsOnSale[i].imageURL);
        itemTemplate.find('.btn-buy-NFT').attr('data-id', i);
        itemTemplate.find('.NFT-price').text(NFTsOnSale[i].price);
        itemTemplate.find('.NFT-power').text(NFTsOnSale[i].power);
        itemTemplate.find('.on-sale-NFT-id').text(NFTsOnSale[i].NFTid);

        itemsRow.append(itemTemplate.html());
      }
    });
    return await App.mintingStatus();
  },


  mintingStatus: async function() {

    await axios.get('http://localhost:3000/front/is-minting-finished').then(resp => {
      if(resp.data.status)
        $(".btn-mint-NFT")[0].disabled = true;
        
    });
    return await App.isLoggedIn();
  },


  isLoggedIn: async function() {

    axios.post('http://localhost:3000/v1/auth/token',{
      token: localStorage.getItem("refresh_token"),
    }).then(function(resp) {
      console.log(resp);
      if(resp.data.status){
        $('.btn-register-show')[0].style.display = "none";
        $('.btn-login-show')[0].style.display = "none";
        $('.btn-logout')[0].style.display = "block";
      }
    })

    return await App.initWeb3();
  },


  initWeb3: async function() {
    //Modern dApp browsers like firefox, chrome, brave have window.ethereum object for provider.
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } 
      catch (error) {
        console.error("User denied account access");
      }
    }

    // This is for legacy dapp browsers, if modern dapp browser is not being used.
    else if(window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },


  initContract: async function() {

    $.getJSON('build/contracts/MyToken.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var MyTokenArtifact = data;
      App.contracts.MyToken = TruffleContract(MyTokenArtifact);
    
      // Set the provider for our contract
      App.contracts.MyToken.setProvider(App.web3Provider);
    });

    return App.getAuthorizedCancelButton();
  },


  getAuthorizedCancelButton: async function() {

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      axios.post('http://localhost:3000/front/get-authorized-button',{
        owner: account
      }).then(function(resp) {
        authorizedButton = resp.data.cancelButtons

        for (i = 0; i < authorizedButton.length; i ++) {

          if(authorizedButton[i])
            $('.btn-cancel-NFT-sale')[i].style.display = "block";
        }
      });
    })

    return await App.getSendRewardsButton();
  },


  getSendRewardsButton: async function() {

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      const headers = {
        'Content-Type': 'application/json',
        'authorization': "bearer " + localStorage.getItem("access_token")
      };

      axios.post('http://localhost:3000/front/get-send-rewards-button',{
        address: account
      } ,{headers}).then(function(resp) {

        if(resp.data.message === "Your session is not valid."){
          axios.post('http://localhost:3000/v1/auth/token',{
            token: localStorage.getItem("refresh_token")
          }).then(function(resp) {

            localStorage.setItem("access_token", resp.data.access_token);
            localStorage.setItem("refresh_token", resp.data.refresh_token);
            const headers = {
              'Content-Type': 'application/json',
              'authorization': "bearer " + localStorage.getItem("access_token")
            };  

            axios.post('http://localhost:3000/front/get-send-rewards-button',{
              address: account
            } ,{headers}).then(function(resp) {

              if(resp.data.status)
                $('.panel-authorized')[0].style.display = "block";
            });
          });

        }else {
          if(resp.data.status)
            $('.panel-authorized')[0].style.display = "block";
        }
      });
    });
    return await App.bindEvents();
  },  


  bindEvents: function() {
    $(document).on('click', '.btn-mint-NFT', App.handleMint);
    $(document).on('click', '.btn-show-NFT', App.handleShow);
    $(document).on('click', '.btn-fight-NFT', App.handleFight);
    $(document).on('click', '.btn-sell-NFT', App.handleSell);
    $(document).on('click', '.btn-buy-NFT', App.handleBuy);
    $(document).on('click', '.btn-transfer-NFT', App.handleTransfer);
    $(document).on('click', '.btn-cancel-NFT-sale', App.handleCancelSale);
    $(document).on('click', '.btn-register', App.handleRegister); 
    $(document).on('click', '.btn-login', App.handleLogin);
    $(document).on('click', '.btn-logout', App.handleLogout);
    $(document).on('click', '.btn-send-NFT', App.handleSendReward);
    $(document).on('click', '.btn-login-show', App.handleShowLogin);
    $(document).on('click', '.btn-register-show', App.handleShowRegister);
    $(document).on('click', '.x', App.handleX);
  },


  handleX: function(event) {
    event.preventDefault();

    $('.panel-login-register')[0].style.display = "none";
    return;

  },


  handleShowLogin: function(event) {
    event.preventDefault();
    
    $('.btn-register')[0].style.display = "none";
    $('.panel-login-register')[0].style.display = "block";
    $('.btn-login')[0].style.display = "block";
    return;
  },


  handleShowRegister: function(event) {
    event.preventDefault();
    
    $('.btn-login')[0].style.display = "none";
    $('.panel-login-register')[0].style.display = "block";
    $('.btn-register')[0].style.display = "block";
    return;
  },


  handleSendReward: function(event) {
    event.preventDefault();

    axios.get('http://localhost:3000/front/send-rewards').then(resp => {

      if(resp.data.status && resp.data.message === "Rewards are sent successfully."){
        NFTidF = resp.data.NFTidF;
        NFTidS = resp.data.NFTidS;
        ownerToSend = resp.data.ownerToSend;

        web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
        var account = accounts[0]; 

          App.contracts.MyToken.deployed().then(function(MyTokenInstance) {
            return MyTokenInstance.sendNFTsToWinner(NFTidF, NFTidS, ownerToSend, {from: account});
          }).then(function(){

            alert(resp.data.message);

            if(resp.data.status){

              if(resp.data.message === "Rewards are sent successfully."){

                axios.post('http://localhost:3000/front/change-NFT-ownership',{
                  owner: ownerToSend,
                  NFTId: NFTidF
                });
  
                axios.post('http://localhost:3000/front/change-NFT-ownership',{
                  owner: ownerToSend,
                  NFTId: NFTidS
                });
              }
            }else
              console.log(resp.data.error);

          return;
          }).catch(function(){
            alert("Sending rewards failed.");
            return;
          });
        });

      }else{
        alert(resp.data.message);
        return;
      }
    });
  },


  handleLogout: function(event) {
    event.preventDefault();

    const headers = {
      'Content-Type': 'application/json',
      'authorization': "bearer " + localStorage.getItem("access_token")
    };

    axios.get('http://localhost:3000/v1/auth/logout', {headers},{
    }).then(function(resp) {

      if(!resp.data.status){

        axios.post('http://localhost:3000/v1/auth/token',{
          token: localStorage.getItem("refresh_token"),
        }).then(function(resp) {

          localStorage.setItem("access_token", resp.data.access_token);
          localStorage.setItem("refresh_token", resp.data.refresh_token);
          const headers = {
            'Content-Type': 'application/json',
            'authorization': "bearer " + localStorage.getItem("access_token")
          }; 

          axios.get('http://localhost:3000/v1/auth/logout', {headers},{
          }).then(function(resp) {

            alert(resp.data.message);

            if(resp.data.status){
              $('.btn-register-show')[0].style.display = "block";
              $('.btn-login-show')[0].style.display = "block";
            }
            else
              console.log(resp.data.error);
            
          });
        });
      }
      else{
        $('.btn-register-show')[0].style.display = "block";
        $('.btn-login-show')[0].style.display = "block";
        $('.btn-logout')[0].style.display = "none";
        alert(resp.data.message);
      }
        
    });
  },  
 

  handleRegister: function(event) {
    event.preventDefault();
  
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      
      const address = account;
      const password = $(".password")[0].value;

      axios.post('http://localhost:3000/v1/auth/register',{
        address: address,
        password: password
      }).then(function(resp) {
        alert(resp.data.message);
        
        if(resp.data.status){
          $('.btn-register-show')[0].style.display = "block";
          $('.btn-login-show')[0].style.display = "block";
          $('.panel-login-register')[0].style.display = "none";
        }
        return;
      });
    });
  },  


  handleLogin: function(event) {
    event.preventDefault();

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
    
      const address = account;
      const password = $(".password")[0].value;

      axios.post('http://localhost:3000/v1/auth/login',{
        address: address,
        password: password
      }).then(function(resp) {

        alert(resp.data.message);

        if(resp.data.status){
          localStorage.setItem("access_token", resp.data.access_token);
          localStorage.setItem("refresh_token", resp.data.refresh_token);

          $('.btn-register-show')[0].style.display = "none";
          $('.btn-login-show')[0].style.display = "none";
          $('.panel-login-register')[0].style.display = "none";
          $('.btn-logout')[0].style.display = "block";

        }else
          console.log(resp.data.error);
        
        return;
      });
    });
  },  

   
  handleCancelSale : function(event) {
    event.preventDefault();

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0]; 

      App.contracts.MyToken.deployed().then(function(MyTokenInstance) {

        saleId = parseInt($(event.target).data('id'));
        NFTId = parseInt($(".on-sale-NFT-id")[saleId].innerHTML);

        return MyTokenInstance.cancelSale(NFTId, {from: account});
      }).then(function(){

        axios.post('http://localhost:3000/front/cancel-NFT-sale',{
          NFTId: NFTId
        }).then(function(resp) {

          alert(resp.data.message);
        
          if(resp.data.status){

            axios.post('http://localhost:3000/front/change-NFT-ownership',{
              owner: account,
              NFTId: NFTId
            });
          }

        return;
        });

      }).catch(function(){
        alert("Cancelling sale failed.");
        return;
      });
    });
  },
 

  handleTransfer: function(event) {
    event.preventDefault();

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0]; 

      App.contracts.MyToken.deployed().then(function(MyTokenInstance) {

        toAddress = $(".address")[0].value.toLowerCase();
        NFTId = parseInt($(".NFT-id")[1].value);

        return MyTokenInstance.transfer(toAddress, NFTId, {from: account});
      }).then(function(){

        axios.post('http://localhost:3000/front/change-NFT-ownership',{
          owner: toAddress,
          NFTId: NFTId
        }).then(function(resp){
          alert(resp.data.message);
        })

        return;

      }).catch(function(){
        alert("Transfer failed.");
        return;
      });
    });
  },


  handleBuy: function(event) {
    event.preventDefault();
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0]; 
   
      App.contracts.MyToken.deployed().then(function(MyTokenInstance) {

        saleId = parseInt($(event.target).data('id'));
        price = parseInt($(".NFT-price")[saleId].innerHTML);
        NFTId = parseInt($(".on-sale-NFT-id")[saleId].innerHTML);


        return MyTokenInstance.finishSale(NFTId, {from: account, value: price});
      }).then(function() {

        axios.post('http://localhost:3000/front/buy-NFT',{
          NFTId: NFTId
        }).then(function(resp) {
        
          if(resp.data.status){
            axios.post('http://localhost:3000/front/change-NFT-ownership',{
              owner: account,
              NFTId: NFTId
            });
          }
          alert(resp.data.message);

          return;
        })

      }).catch(function(){
        alert("Buying failed.");
        return;
      });
    });
  },


  handleSell: function(event) {
    event.preventDefault();

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0]; 
      const NFTId = parseInt($(".NFT-id")[3].value);
      const price = parseInt($(".price")[0].value);

      App.contracts.MyToken.deployed().then(function(instance) {
        MyTokenInstance = instance;
        
        return MyTokenInstance.startSale(NFTId, price, {from: account})
        .then(function(){

           axios.post('http://localhost:3000/front/NFT-sale',{
            NFTId: NFTId,
            price: price
          }).then(function(resp) {

            alert(resp.data.message);
        
            if(resp.data.status){
              
              axios.post('http://localhost:3000/front/change-NFT-ownership',{
               owner: "onSale",
                NFTId: NFTId
              });
            } 

            return;
          });  

        }).catch(function(){
          alert("Selling failed.");
          return;
        });
      });
    });
  },  


  handleFight: function(event) {
    event.preventDefault();

    const NFTId = parseInt($(".NFT-id")[2].value);
    if(NFTId < 0 || NFTId > 49){
      alert("NFT Ids are between 0 and 49");
      return;

    }else{

      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }

        var account = accounts[0]; 
        App.contracts.MyToken.deployed().then(function(MyTokenInstance) {
              
          return MyTokenInstance.takeNFT(NFTId,{from: account, value: 100000000000000000})
          .then(function(){

            axios.post('http://localhost:3000/front/NFT-fight',{
              NFTId: NFTId,
              ownerAddress: account
            }).then(function(resp) {

              alert(resp.data.message);

              if(resp.data.status){
                

                if(resp.data.message === "Your NFT is waiting opponent."){
                  axios.post('http://localhost:3000/front/change-NFT-ownership',{
                    owner: "inFight",
                    NFTId: NFTId
                  });      

                }else{
                  $('#winnerH').attr('style', "display:block;");
                  $('#panel-fight-NFT').attr('style', "display:block;");
                  $('#fight-NFT-image').attr("src",resp.data.winnerNFT.imageURL);
                  $('.NFT-name')[1].innerHTML = "Name : " + resp.data.winnerNFT.name;
                  $('.NFT-power')[1].innerHTML = "Power : " + resp.data.winnerNFT.power;    
                  
                } 
              }
              return;
            });
            
          }).catch(function(){
            alert("Adding NFT to change game failed.");
            return;
          });

        });
      }); 
    }
  },  


  handleShow: function(event) {
    event.preventDefault();
    
    NFTId = parseInt($(".NFT-id")[0].value);

    if(NFTId < 0 || NFTId > 49){
      alert("NFT Ids are between 0 and 49");
      $('#panel-show-NFT').attr('style', "display:none;");
      return;

    }else{
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }

        var account = accounts[0]; 
        const headers = {
          'Content-Type': 'application/json',
          'authorization': "bearer " + localStorage.getItem("access_token")
        };

        
        axios.post('http://localhost:3000/front/show-NFT',{
          NFTId: NFTId,
          walletAddress : account
        },{headers : headers}).then(function (resp) {

          if(resp.data.message === "Your session is not valid."){
 
            axios.post('http://localhost:3000/v1/auth/token',{
              token: localStorage.getItem("refresh_token"),
            }).then(function(resp) {

              const headers = {
                'Content-Type': 'application/json',
                'authorization': "bearer " + resp.data.access_token
              }; 
              localStorage.setItem("refresh_token", resp.data.refresh_token);
              localStorage.setItem("access_token", resp.data.access_token);

              axios.post('http://localhost:3000/front/show-NFT',{
                NFTId: NFTId,
                walletAddress : account
              },{headers : headers}).then(function (resp) {

                if(resp.data.message === "Your session is not valid."){
                  alert("you must login");
                }else {
                  if(!resp.data.status){
                    alert(resp.data.message);
                    return;
                  }
                  else{

                  $('#panel-show-NFT').attr('style', "display:block;");
                  $('#show-NFT-image').attr("src", resp.data.NFTshow.imageURL);
                  $('.NFT-name')[0].innerHTML = "Name : " + resp.data.NFTshow.name;
                  $('.NFT-power')[0].innerHTML = "Power : " + resp.data.NFTshow.power;
                  return;
                }
                }
              });
            });

          }else {
            console.log(resp);
            if(!resp.data.status)
              alert(resp.data.message);

            else{
              $('#panel-show-NFT').attr('style', "display:block;");
              $('#show-NFT-image').attr("src",resp.data.NFTshow.imageURL);
              $('.NFT-name')[0].innerHTML = "Name : " + resp.data.NFTshow.name;
              $('.NFT-power')[0].innerHTML = "Power : " + resp.data.NFTshow.power;
            }

          return;
          }
        });
      });
    }
  },


  handleMint: function(event) {
    event.preventDefault();

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
    
      var account = accounts[0]; 
      App.contracts.MyToken.deployed().then(function(MyTokenInstance) {
        
        MyTokenInstance.mint({from: account}).then(function() {

          axios.post('http://localhost:3000/front/mint',{
            walletAddress : account
          }).then(function(resp) {

            alert(resp.data.message);

            if(!resp.data.status)
              console.log(resp.data.error);

            return;
          })
        }).catch(function(){
          alert("Minting failed.");
          return;
        })
        return;
      });
    });
  }
}


$(function() {
  $(window).load(function() {
    App.init();
  });
});