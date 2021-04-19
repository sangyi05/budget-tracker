//create variable to hold db connection
let db;

//establish a connection to IndexedDB database called '_'
const request = indexedDB.open('budget', 1);

//this event will emit if the database version changes 
request.onupgradeneeded = function(event) {
    //save a reference to the database
    const db = event.target.result;
    //create an object store called `new_transaction`. set it to have an auto incrementing primary key
    db.createObjectStore('new_transaction', {autoIncrement: true})
};

//upon a successful

request.onsuccess = function(event) {
    //when db is successfully created with its object store
    db = event.target.result;

    //check if app is online, if yes run uploadTransaction() function 
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function(event) {
    //log error here
    console.log(event.target.errorCode);
}

//This function will be executed if we attempt to submit a transaction and there is no internet connection
function saveRecord(record) {
    //open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access the object store for 'new_transaction'
    const transactionObjectStore = transaction.objectStore('new_transaction');

    //add record to your store with add method
    transactionObjectStore.add(record);
};

function uploadTransaction() {
    //open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access your object store
    const transactionObjectStore = transaction.objectStore('new_transaction');

    //get all record from store and set to a variable
    const getAll = transactionObjectStore.getAll();

    //upon a successful .getAll() exectuion, run this function
    getAll.onsuccess = function() {
        //if there was data in indexedDB's store, send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*', 
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                console.log(serverResponse);
                if(serverResponse.message) {
                    throw new Error(serverResponse);
                }
                //open one more transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite')

                //access the new_transaction object store
                const transactionObjectStore = transaction.objectStore('new_transaction');

                //clear all items in your store
                transactionObjectStore.clear();

                alert('All saved transactions have been submitted!');
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
}

//listen for app coming back online
window.addEventListener('online', uploadTransaction);