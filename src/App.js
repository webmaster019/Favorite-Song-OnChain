import * as React from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/songPortal.json";
import {BounceLoader,ClipLoader} from "react-spinners";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { errorToast,warningToast,successToast } from "./utils/toast";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
require('dotenv').config()
export default function App() {

  const[currAccount,setCurrentAccount] = React.useState("")
  const[loading, setLoading] = React.useState(false);
  const[totalsongs,setsongs] = React.useState(0)
  const [title, setTitle] = React.useState("");
  const[songs,setAllsongs] = React.useState([]);
  const contractAddress = "0x7Fb01B9833266CE2253459a7A9Cca0cf2192D4E3"
  const contractAbi = abi.abi;
  const rinkebyChain = '0x4'; 
  const infuraId = process.env.REACT_APP_INFURA_ID;


 const onChangeHandler = event => {
        setTitle(event.target.value);
      };

  const checkIfWalletIsConnected = async()=>{
    const web3Modal = await getWeb3Modal();
  if ( web3Modal.cachedProvider) {
    web3Modal.connect().then((provider) => {

      chainListener(provider);
      setCorrectNetwork(provider)
    }).catch((error)=>{
      console.log(error);
    });
   
  }
  }

  const getWeb3Modal = async()=>{

    let providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: infuraId 
        }
      }
    };
   return  new Web3Modal({
      network: "mainnet", // optional
      cacheProvider: true, // optional
      providerOptions // required
    });
  }

  async function isNetWorkCorrect(provider){
    const chainId = await provider.request({ method: 'eth_chainId' });
    if(chainId === rinkebyChain){
      return true
  }
  return false
}
  const connectWallet = async()=>{
    
    
const web3Modal = await getWeb3Modal();
 web3Modal.connect().then(async(provider)=>{
  chainListener(provider);
 await setCorrectNetwork(provider);
}).catch((msg)=>{
  console.log(msg.toString())
   errorToast('Error when connecting ');
});

  }
  const setCorrectNetwork = async(provider)=>{
    if(!await isNetWorkCorrect(provider)){
 try {
 await provider.request({
   method: 'wallet_switchEthereumChain',
   params: [{ chainId: rinkebyChain }],
 });
       const accounts = await provider.request({ method: 'eth_requestAccounts' });
       const account = accounts[0];
       setCurrentAccount(account);
       getAllsongs(provider);
       successToast("Connected to Rinkeby network")
     

} catch (switchError) {
 // This error code indicates that the chain has not been added to MetaMask.
 if (switchError.code === 4902) {

  errorToast("You don't have rinkeby in your metamask, add it and try again ");

 }
 errorToast("Failed to switch to Rinkeby network, Switch to rinkeby network Manualy and try again");
 // handle other "switch" errors
}
    }else{
       const accounts = await provider.request({ method: 'eth_requestAccounts' });
       const account = accounts[0];
       setCurrentAccount(account);
       getAllsongs(provider);
    }
 

 }
  const addSong = async() => {
  
  try{
     setLoading(true);
    const web3Modal = await getWeb3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner()
    const songPortalContract =new ethers.Contract(contractAddress,contractAbi,signer);
    console.log(" song title:",title)
    const songTxn = await songPortalContract.addSong(title,{gasLimit:300000});
    console.log("mining...",songTxn.hash);
    await songTxn.wait()
    console.log("mined---", songTxn.hash)
    setLoading(false);
    setTitle('');
    }catch(error){
    setLoading(false)
    if(error.code === 4001){
      errorToast(" Transaction rejected by user");
    }else{
      errorToast("Oh not so fast, relax and try again later! Maybe after 15 minutes");
    }
   
  }
    
  }


  function chainListener(provider){
    provider.on("chainChanged", (chainId) => {
      console.log("chain changed");
      if(chainId !== rinkebyChain){
        warningToast('Wrong Network, please connect to Rinkeby network');
     }else{
          setCorrectNetwork(provider);
        }
    });
    
    
    // Subscribe to provider connection
    provider.on('connect', ({ chainId }) => {
     
      if(chainId !== rinkebyChain){
        warningToast('Wrong Network, please connect to Rinkeby network');
      }else{
          successToast('Connected!');
          setCorrectNetwork(provider);
      }
      
    });

    provider.on("accountsChanged", async(accounts) => {
      if(accounts.length===0){
           (await getWeb3Modal()).clearCachedProvider()
           setCurrentAccount(null);
           setAllsongs([])
           errorToast('disconnected!');
      }else{
        setCorrectNetwork(provider);
      }
    });
    
    // Subscribe to provider disconnection
    provider.on("disconnect", async(error) => {
      console.log("on disconnected");
      errorToast('disconnected!');
      (await getWeb3Modal()).clearCachedProvider()
           setCurrentAccount(null);
           setAllsongs([])
    });
    
  }

 
  async function getAllsongs(connection){

    try{


    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner()
    const songPortalContract =new ethers.Contract(contractAddress,contractAbi,signer);

    let songs = await songPortalContract.getAllSongs();
    let songsCleaned = []
    songs.forEach(song => {
      songsCleaned.push({
        from:song.from,
        timestamp: new Date(song.timestamp*1000),
        title:song.title
      })
    })
    setAllsongs(songsCleaned.reverse());

    //listen to contract emit event when a new song is added
    songPortalContract.on("NewSong",(from,timestamp,title)=>{
      console.log("new song",from,timestamp,title);
      successToast('Youpi!,new song added')
      setAllsongs(prevState =>[...prevState,{
        from:from,
        title:title,
        timestamp:new Date(timestamp*1000)
      }]);

      toast.success('New song recorded', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        });

    });

    }catch(error){
      errorToast(error);
    }
  }
  React.useEffect(()=>{
    checkIfWalletIsConnected()
  },[])
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        🎧 What song do you have on repeat?
        </div>

        <div className="bio">
        Hey there 🤝, Kathoh here. Tell me what song you are currently playing on repeat and stand a chance to win some ether! Let's go
        </div>

         <form className="bio">        
          <input type="text"  onChange={ onChangeHandler} placeholder="Enter a song title" />    
      </form>
      {
        currAccount?(
          <button className="addButton" disabled={loading} onClick={addSong}>
          Add song
        </button>
        ):null
      }
        
        <div className="progress">
         <ClipLoader  loading={loading}  size={50} />
        
        </div>
       
        {currAccount? null:(
          <button className="addButton"  onClick={connectWallet}>
          Connect Wallet 🦊 
          </button>
        )}
        {
          songs.map((song,index)=>{
            return(
              <div style={{backgroundColor:"OldLance" ,marginTop:"16px", padding:"8px"}}>
              <div>Title🎙 {song.title}</div>
              <div>Address🛡 {song.from}</div>
              <div>Time🕖 {song.timestamp.toString()}</div>
              </div>
            )
          })
        }
      </div>
      <ToastContainer />
    </div>
    
  );
}
