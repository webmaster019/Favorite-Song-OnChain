import * as React from "react";
import { ethers } from "ethers";
import './App.css';

import abi from "./utils/songPortal.json";
import {BounceLoader,ClipLoader} from "react-spinners";

export default function App() {

  const[currAccount,setCurrentAccount] = React.useState("")
  const[loading, setLoading] = React.useState(false);
  const[totalsongs,setsongs] = React.useState(0)
  const [title, setTitle] = React.useState("");
  const[songs,setAllsongs] = React.useState([]);
  const contractAddress = "0x7Fb01B9833266CE2253459a7A9Cca0cf2192D4E3"
  const contractAbi = abi.abi;


 const onChangeHandler = event => {
        setTitle(event.target.value);
      };

  const checkIfWalletIsConnected = ()=>{
    const {ethereum} = window;
    if(!ethereum){
      console.log("Make sure you have metamask installed")
      return
    }else{
      console.log("We have Ethereum object",ethereum)
    }
    ethereum.request({method:'eth_accounts'})
    .then(accounts =>{

      if(accounts.length !==0){
        const account =accounts[0];
        console.log("Found an authorized account",account)
        setCurrentAccount(account);
        getAllsongs();
      }else{
        console.log("No authorized account found")
      }
    })
  }

  const connectWallet = ()=>{
    const {ethereum} = window;
    if(!ethereum){
      alert("Get metamask");
    }
    ethereum.request({method:'eth_requestAccounts'})
    .then(accounts=>{
      console.log("Connected",accounts[0])
      setCurrentAccount(accounts[0])
      getAllsongs();
    })
    .catch(err=>console.log(err));
  }
  const addSong = async() => {
  
  try{
    setLoading(true);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner()
    const songPortalContract =new ethers.Contract(contractAddress,contractAbi,signer);
    let count = await songPortalContract.getTotalSongs() 
    console.log("Retrieved toatal number of songs....",count.toNumber())
    console.log(" song title:",title)
    const songTxn = await songPortalContract.addSong(title,{gasLimit:300000});
    console.log("mining...",songTxn.hash);
    await songTxn.wait()
    console.log("mined---", songTxn.hash)
    
    // count = await songPortalContract.getTotalsongs()
    // console.log("Retrieved toatal song count....",count.toNumber())
    setLoading(false);
    setTitle('');
    }catch(error){
    setLoading(false)
    alert("Oh not so fast, relax and try again later! Maybe after 15 minutes");
  }
    
  }
  async function getAllsongs(){

    try{

      if(window.ethereum){

    const provider = new ethers.providers.Web3Provider(window.ethereum);
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
    setAllsongs(songsCleaned);

    //listen to contract emit event when a new song is added
    songPortalContract.on("NewSong",(from,timestamp,title)=>{
      console.log("new song",from,timestamp,title);
      setAllsongs(prevState =>[...prevState,{
        from:from,
        title:title,
        timestamp:new Date(timestamp*1000)
      }]);
    });
     }else{
        
      }
    }catch(error){
      console.log(error);
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
    </div>
    
  );
}
