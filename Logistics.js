import React, {useState, useEffect} from 'react';
import {ethers} from 'ethers';

const Logistics = () => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState(null);
    const [isOwner, setIsOwner] = useState(null);
    const [shipmentID, setShipmentID] = useState('');
    const [cargoDescription, setCargoDescription] = useState('');
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [shipmentLogs, setShipmentLogs] = useState([]);
    const [carrierAddress, setCarrierAddress] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const contractAddress = "0xd7d8710799cec0907062d7ba35ffc622fd9ef777";

    const contractABI = [
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "shipmentID",
                    "type": "uint256"
                },
                {
                    "internalType": "string",
                    "name": "_cargoDescription",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "_origin",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "_destination",
                    "type": "string"
                }
            ],
            "name": "addShipmentLog",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "carrier",
                    "type": "address"
                }
            ],
            "name": "authorizeCarrier",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [],
            "name": "getOwner",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "shipmentID",
                    "type": "uint256"
                }
            ],
            "name": "getShipmentLogs",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "uint256",
                            "name": "logID",
                            "type": "uint256"
                        },
                        {
                            "internalType": "string",
                            "name": "cargoDescription",
                            "type": "string"
                        },
                        {
                            "internalType": "string",
                            "name": "origin",
                            "type": "string"
                        },
                        {
                            "internalType": "string",
                            "name": "destination",
                            "type": "string"
                        },
                        {
                            "internalType": "uint256",
                            "name": "timestamp",
                            "type": "uint256"
                        }
                    ],
                    "internalType": "struct LogisticsContract.ShipmentLog[]",
                    "name": "",
                    "type": "tuple[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ];


    useEffect(() => {
        const connectWallet = async () => {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
                    await web3Provider.send('eth_requestAccounts', []);
                    const web3Signer = web3Provider.getSigner();
                    setProvider(web3Provider);
                    setSigner(web3Signer);

                    const userAccount = await web3Signer.getAddress();
                    setAccount(userAccount);

                    const logisticsContract = new ethers.Contract(contractAddress, contractABI, web3Signer);
                    setContract(logisticsContract);

                    const ownerAddress = await logisticsContract.getOwner();
                    setIsOwner(userAccount.toLowerCase() === ownerAddress.toLowerCase());

                } catch (error) {
                    console.error("Error connecting wallet:", error);
                    setErrorMessage("Failed to connect wallet. Please ensure Metamask is installed and unlocked.");
                }
            } else {
                 setErrorMessage("Metamask not detected. Please install Metamask.");
            }
        };
        connectWallet();

        const handleAccountsChanged = (accounts) => {
             if (accounts.length === 0) {
                setAccount(null);
                setSigner(null);
                setProvider(null);
                setContract(null);
                setIsOwner(null);
                setErrorMessage("Wallet disconnected. Please connect again.");
            } else {
                connectWallet();
            }
        };

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
        }

        return () => {
            if (window.ethereum) {
                 window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
        }

    }, []);

    const clearMessages = () => {
        setFeedbackMessage('');
        setErrorMessage('');
    }

    const fetchShipmentLogs = async () => {
        clearMessages();
        if (!contract || !shipmentID) {
             setErrorMessage("Please connect wallet and enter a Shipment ID.");
             return;
        }
        setIsLoading(true);
        try {
            const logs = await contract.getShipmentLogs(shipmentID);
            setShipmentLogs(logs);
             if(logs.length === 0) {
                 setFeedbackMessage("No logs found for this Shipment ID.");
             }
        } catch(error) {
            console.error("Error fetching shipment logs:", error);
             setErrorMessage(`Error fetching logs: ${error.message || error?.data?.message || 'Check console for details.'}`);
             setShipmentLogs([]);
        } finally {
            setIsLoading(false);
        }
    }

    const addShipmentLog = async () => {
        clearMessages();
        if (!contract || !shipmentID || !cargoDescription || !origin || !destination) {
            setErrorMessage("Please fill in all fields: Shipment ID, Cargo Description, Origin, and Destination.");
            return;
        }
        setIsLoading(true);
        try {
            const tx = await contract.addShipmentLog(shipmentID, cargoDescription, origin, destination);
            setFeedbackMessage("Transaction submitted... waiting for confirmation.");
            await tx.wait();
            setFeedbackMessage(`Log added successfully for Shipment ID: ${shipmentID}! Transaction hash: ${tx.hash}`);
            fetchShipmentLogs();
            setCargoDescription('');
            setOrigin('');
            setDestination('');

        } catch(error) {
            console.error("Error adding shipment log:", error);
             setErrorMessage(`Error adding log: ${error.message || error?.data?.message || 'Check permissions or console.'}`);
        } finally {
            setIsLoading(false);
        }
    }


    const authorizeCarrier = async () => {
         clearMessages();
         if (!contract || !carrierAddress) {
             setErrorMessage("Please connect wallet and enter a Carrier Address.");
             return;
         }
        if (isOwner){
            setIsLoading(true);
            try {
                const tx = await contract.authorizeCarrier(carrierAddress);
                 setFeedbackMessage("Transaction submitted... waiting for confirmation.");
                await tx.wait();
                setFeedbackMessage(`Carrier ${carrierAddress} authorized successfully! Transaction hash: ${tx.hash}`);
                setCarrierAddress('');

            } catch(error) {
                console.error("Error authorizing carrier:", error);
                setErrorMessage(`Authorization failed: ${error.message || error?.data?.message || 'Check console.'}`);
            } finally {
                setIsLoading(false);
            }
        } else {
             setErrorMessage("Action denied: Only the contract owner can authorize carriers.");
        }
    }

    return(
        <div className='logistics-container'>
            <header className='logistics-header'>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="logo-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 0 0-.621-1.996l-.44-1.196a.75.75 0 0 1 .318-1.014l1.86-1.034a.75.75 0 0 0 .16-.046l1.86-1.034a.75.75 0 0 1 .978.158l.626 1.043a.75.75 0 0 0 .674.421l1.898.001c.235 0 .45.096.609.26l.554.693a.75.75 0 0 0 .674.421l1.898.001c.235 0 .45.096.609.26l.554.693m-8.25 4.5h-1.875a.375.375 0 0 1-.375-.375V14.25m-4.125 4.5h1.875a.375.375 0 0 0 .375-.375V14.25" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5M3.75 6h16.5" />
                </svg>
                 <h1 className = "title">Supply Chain Tracker</h1>
            </header>

            {account ? (
                <p className='account-info'>
                    Connected: <span className='account-address'>{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
                     {isOwner && <span className='owner-badge'>Contract Owner</span>}
                </p>
            ) : (
                 <p className='account-info connect-prompt'>Please connect your wallet.</p>
            )}


            {errorMessage && <div className="message error-message">{errorMessage}</div>}
            {feedbackMessage && <div className="message feedback-message">{feedbackMessage}</div>}
            {isLoading && <div className="loading-indicator">Processing Transaction...</div>}


            <div className='main-content'>
                <div className='form-section card'>
                    <h2>Fetch Shipment Logs</h2>
                    <input
                        className='input-field'
                        type='text'
                        placeholder='Enter Shipment ID (e.g., 123)'
                        value={shipmentID}
                        onChange={(e) => setShipmentID(e.target.value)}
                        disabled={isLoading || !account}
                    />
                    <button className='action-button' onClick={fetchShipmentLogs} disabled={isLoading || !account || !shipmentID}>
                         Fetch Logs
                    </button>
                </div>

                <div className="form-section card">
                    <h2>Add Shipment Log Entry</h2>
                     <p className="form-hint">(Requires authorized carrier account)</p>
                     <input
                         className='input-field'
                         type='text'
                         placeholder='Cargo Description (e.g., Electronics)'
                         value={cargoDescription}
                         onChange={(e) => setCargoDescription(e.target.value)}
                         disabled={isLoading || !account}
                     />
                    <input
                        className='input-field'
                        type='text'
                        placeholder='Origin (e.g., Warehouse A, Shanghai)'
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        disabled={isLoading || !account}
                    />
                    <input
                        className='input-field'
                        type='text'
                        placeholder='Destination / Status (e.g., Port B, Rotterdam)'
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        disabled={isLoading || !account}
                    />
                    <button className='action-button' onClick={addShipmentLog} disabled={isLoading || !account || !shipmentID || !cargoDescription || !origin || !destination}>
                        Add Log
                    </button>
                </div>

                 {isOwner && (
                     <div className="form-section card owner-action">
                         <h2>Authorize Carrier</h2>
                         <p className="form-hint">(Owner action)</p>
                         <input
                             className='input-field'
                             type= "text"
                             placeholder='Enter Carrier Wallet Address'
                             value = {carrierAddress}
                             onChange={(e) => setCarrierAddress(e.target.value)}
                             disabled={isLoading || !account}
                          />
                         <button className='action-button secondary-button' onClick={authorizeCarrier} disabled={isLoading || !account || !carrierAddress}>
                            Authorize Carrier
                         </button>
                     </div>
                 )}
            </div>


             <div className='records-section'>
                <h2>Shipment Log History {shipmentID && `for ID: ${shipmentID}`}</h2>
                {shipmentLogs.length > 0 ? (
                    shipmentLogs.map((log, index) => (
                        <div key={index} className="record-card card">
                            <div className="record-header">
                                 <span className="record-id">Log #{log.logID.toNumber()}</span>
                                 <span className="record-timestamp">{new Date(log.timestamp.toNumber() * 1000).toLocaleString()}</span>
                            </div>
                            <p><strong>Cargo:</strong> {log.cargoDescription}</p>
                            <p><strong>Origin/Status:</strong> {log.origin}</p>
                            <p><strong>Destination/Update:</strong> {log.destination}</p>
                        </div>
                    ))
                ) : (
                     <p className="no-records">No logs to display. Fetch logs using a Shipment ID or add a new log.</p>
                )}
            </div>

        </div>
    )
}
export default Logistics;