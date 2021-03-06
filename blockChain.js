/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
const level = require('level');
const Block = require('./block');
const chainDB = './chaindata';
const db = level(chainDB);

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		 |
|  ================================================*/

class Blockchain {
    constructor() {
      this.chain = [];
      this.addBlock(new Block("Genesis block"));
    }
  
    // Add new block
    async addBlock(newBlock) {
      // Check if exist genesis block
      let blockAdded = '';
      const exist = await this.existGenesisBlock();
      if(!exist) {
        console.log('------ Adding Genesis Block --------');
        const genesisBlock = new Block("Genesis block");
        genesisBlock.height = 0;
        genesisBlock.time = new Date().getTime().toString().slice(0,-3);
        genesisBlock.hash = SHA256(JSON.stringify(genesisBlock)).toString();
        await this.addLevelDBData(genesisBlock.height, JSON.stringify(genesisBlock).toString());
        console.log('------ Genesis Block already added ------');
      }
      // Check the call is not comming from constructor
      if(newBlock.body != "Genesis block") {
        await this.getBlockHeight()
        .then((height) => {
          newBlock.height = height + 1;
        })
        .catch((height, err) => {
          console.log('Error getting block height. Error: ' + err);
          newBlock.height = height;
        });
        if(newBlock.height > 0) {
          // Get previous hash
          let prevBlock = '';
          await this.getBlock(newBlock.height - 1)
          .then((value) => {
            prevBlock = value;
          }).catch((err) => {
            console.log("Previous Block not found. Error: " + err);
          });
          if(prevBlock) {
            newBlock.previousBlockHash = JSON.parse(prevBlock).hash;
            newBlock.time = new Date().getTime().toString().slice(0,-3);
            newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
            await this.addLevelDBData(newBlock.height, JSON.stringify(newBlock).toString());
            blockAdded = newBlock;
            console.log('New Block with height ' + newBlock.height + ' was already added to the chain');
          } else {
            console.log('New Block could not be added to the chain because no previous block found');
          }
        } else {
          console.log('New Block could not be added to the chain because no block height not found');
        }
      }
      return blockAdded;
    }
    // Add new key, value data to levelDB
    addLevelDBData(key, value) {
      return new Promise(function(resolve, reject){
        db.put(key, value, function(err) {
          if (err) {
            console.log('Block ' + key + ' submission failed', err);
            reject(err);
          } else {
            resolve();
          }
        })
      });
    }
    // Check if Genesis Block Exist
    async existGenesisBlock() {
      let exist = false;
      await this.getBlock(0)
      .then(() => {
        exist = true;
      })
      .catch((err) => {
        console.log('Genesis Block not found. Err: ' + err);
      });
      return exist;
    }
  
    // Introduce error in a block
    async induceErrorInBlock(blockHeight) {
      // get block object
      let block = '';
      await this.getBlock(blockHeight)
      .then((value) => {
        block = JSON.parse(value);
      }).catch((err) => {
        console.log("Block not found to induce error. Error: " + err);
      });
      if(block) {
        block.data = 'induced chain error';
        await this.addLevelDBData(block.height, JSON.stringify(block).toString());
        console.log('Error induced in block# ' + blockHeight);
      } else {
        console.log('Error cloud not be introduced because not block# ' + blockHeight + ' found');
      }
    }
  
    // Get block height
    getBlockHeight(){
      let i = 0;
      return new Promise(function(resolve, reject){
        db.createReadStream().on('data', function(data) {
          i++;
        }).on('error', function(err) {
          console.log('Unable to read data stream!', err)
          reject(-1, err);
        }).on('close', function() {
          resolve(i - 1);
        });
      });
    }
  
    // get block
    getBlock(blockHeight){
      // return object as a single string
      return new Promise((resolve, reject) => {
        db.get(blockHeight, function(err, value) {
          if (err) {
            console.log('Block# ' + blockHeight + ' not found');
            reject(err);
          } else {
            resolve(value);
          }
        });
      });
    }
  
    // validate block
    async validateBlock(blockHeight){
      // get block object
      let block = '';
      await this.getBlock(blockHeight)
      .then((value) => {
        block = JSON.parse(value);
      }).catch((err) => {
        console.log("Block not found. Error: " + err);
      });
      return new Promise(function(resolve, reject){
        if(block) {
          // get block hash
          let blockHash = block.hash;
          // remove block hash to test block integrity
          block.hash = '';
          // generate block hash
          let validBlockHash = SHA256(JSON.stringify(block)).toString();
          // Compare
          if (blockHash===validBlockHash) {
            resolve(true);
          } else {
            console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
            resolve(false);
          }
        }
        else {
          reject('Block not found');
        }
      });
    }
  
    // Validate blockchain
    async validateChain(){
      let errorLog = [];
      let promiseStack = [];
      let chainLength = 0;
      // Get the lenght of the current chain
      await this.getBlockHeight()
      .then((height) => {
        chainLength = height+1;
      })
      .catch((height, err) => {
        console.log('Error getting block height. Error: ' + err);
        chainLength = height;
      });
      for (var i = 0; i < chainLength; i++) {
        // Check validity of current block
        let validityBlock = false;
        await this.validateBlock(i)
        .then((value) => {
          validityBlock = value;
        })
        .catch((err) => {
          console.log('Error by validating block# ' + i + '. Error: ' + err);
          validityBlock = false;
        });
        // Compare blocks hash link
        let isCurrentBlockHashEqualNextBlockPrevHash = true;
        if(i < chainLength - 1) {
          // Get Current Block
          let currentBlock = '';
          await this.getBlock(i)
          .then((value) => {
            currentBlock = JSON.parse(value);
          })
          .catch((err) => {
            console.log("Current Block not found. Error: " + err);
          });
          // Get Next Block
          let nextBlock = '';
          await this.getBlock(i + 1)
          .then((value) => {
            nextBlock = JSON.parse(value);
          })
          .catch((err) => {
            console.log("Next Block not found. Error: " + err);
          });
          if(currentBlock && nextBlock) {
            const blockHash = currentBlock.hash;
            const previousHash = nextBlock.previousBlockHash;
            if(blockHash !== previousHash) {
              isCurrentBlockHashEqualNextBlockPrevHash = false;
            }
          }
        }
        const newPromise = new Promise(function(resolve) {
          if(!validityBlock || !isCurrentBlockHashEqualNextBlockPrevHash) {
            errorLog.push(i);
          }
          resolve();
        });
        promiseStack.push(newPromise);
      }
      // Execute the promises array
      Promise.all(promiseStack)
      .then(function() {
        if (errorLog.length>0) {
          console.log('Block errors = ' + errorLog.length);
          console.log('Blocks: ' + errorLog);
        } else {
          console.log('No errors detected');
        }
      });
    }
  }

  module.exports = Blockchain;
  