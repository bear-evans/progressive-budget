let db;

// Opens database
let iDB = window.indexedDB.open("budget-track", 1);

// On successfully opening, store the resulting database connection for use
iDB.onsuccess = function (event) {
  console.log("Database initialized.");
  db = event.result;
};

// If there was a problem, not much we can do.
iDB.onerror = function (event) {
  console.log(
    "An error occurred initializing the database. Offline functionality unavailable."
  );
};

// Initializes the database if it has not been created or if it's been modified
iDB.onupgradeneeded = function (event) {
  db = event.target.result;

  let objectStore = db.createObjectStore("offline transactions", {
    autoIncrement: true,
  });
};

// Save a copy of the offline transaction for later reupload
function saveTransaction(trans) {
  const transaction = db.transaction(["offline transactions"], "readwrite");
  const store = transaction.objectStore("offline transactions");

  store.add(trans);
}

// Synchronizes the local database with the fetch API when online, then clears the database
function sync() {
  const transaction = db.transaction(["offline transactions"], "readwrite");
  const store = transaction.objectStore("offline transactions");
  const syncData = store.getAll();

  syncData.onsuccess = function () {
    if (syncData.result.length > 0) {
      fetch("/api/transactions/bulk", {
        method: "POST",
        body: JSON.stringify(syncData.result),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          return response.json();
        })
        .then(() => {
          const transaction = db.transaction(
            ["offline transactions"],
            "readwrite"
          );
          const store = transaction.objectStore("offline transactions");
          store.clear();
        });
    }
  };
}

// When online, synchronize the offline and online databases
window.addEventListener("online", sync);
