// 🔥 Firebase Configuration
const firebaseConfig = {
   apiKey: "AIzaSyBBZxCwywnv_ZVXYezOV8IKG6iKWK5sL10",

    authDomain: "studio-ywlo1.firebaseapp.com",

    projectId: "studio-ywlo1",

    storageBucket: "studio-ywlo1.firebasestorage.app",

    messagingSenderId: "791958850921",

    appId: "1:791958850921:web:149be668e7f132e59f41f8"
};

// 🔧 Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let notifications = [];

document.addEventListener("DOMContentLoaded", () => {
  // 🔁 UI Switching
  function showRegister() {
    document.getElementById('registerSection').style.display = 'block';
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
  }

  function showLogin() {
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
  }

  function showDashboard() {
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    renderDashboard();
  }

  function clearErrors() {
    document.getElementById('registerError').textContent = '';
    document.getElementById('loginError').textContent = '';
    document.getElementById('sendMoneyError').textContent = '';
    document.getElementById('sendMoneySuccess').textContent = '';
  }

  // 🔘 UI Buttons
  document.getElementById('showLoginBtn').addEventListener('click', showLogin);
  document.getElementById('showRegisterBtn').addEventListener('click', showRegister);

  // 📝 Register Handler
  document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearErrors();

    const firstName = this.firstName.value.trim();
    const lastName = this.lastName.value.trim();
    const email = this.emailRegister.value.trim();
    const phone = this.phoneRegister.value.trim();
    const password = this.passwordRegister.value;

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const uid = userCredential.user.uid;

      await db.collection("users").doc(uid).set({
        firstName,
        lastName,
        email,
        phone,
        balance: 500,
        notifications: []
      });

      alert("✅ Registration successful! Please login.");
      showLogin();
      this.reset();
    } catch (error) {
      document.getElementById('registerError').textContent = error.message;
    }
  });

  // 🔓 Login Handler (email or phone)
  document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearErrors();

    const identifier = this.identifierLogin.value.trim();
    const password = this.passwordLogin.value;

    try {
      let email = identifier;
      if (!identifier.includes("@")) {
        email = `${identifier}@wanderslapp.com`; // phone-based login
      }

      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      currentUser = userCredential.user.uid;
      showDashboard();
      this.reset();
    } catch (error) {
      document.getElementById('loginError').textContent = error.message;
    }
  });

  // 📊 Render Dashboard
  async function renderDashboard() {
    const doc = await db.collection("users").doc(currentUser).get();
    const data = doc.data();

    document.getElementById('balance').textContent = `Balance: MK ${data.balance.toFixed(2)}`;
    notifications = data.notifications || [];
    updateNotificationCount();
    renderMessages();
  }

  function updateNotificationCount() {
    const icon = document.getElementById('notificationIcon');
    icon.setAttribute('data-count', notifications.length);
  }

  function renderMessages() {
    const messagesDiv = document.getElementById('messages');
    if (notifications.length === 0) {
      messagesDiv.style.display = 'none';
      messagesDiv.innerHTML = '';
    } else {
      messagesDiv.style.display = 'block';
      messagesDiv.innerHTML = notifications.map(n =>
        `<div><strong>${n.from}:</strong> ${n.message}</div>`
      ).join('');
    }
  }

  // 🔔 Clear Notifications
  document.getElementById('notificationIcon').addEventListener('click', async () => {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.style.display = messagesDiv.style.display === 'block' ? 'none' : 'block';

    await db.collection("users").doc(currentUser).update({ notifications: [] });
    notifications = [];
    updateNotificationCount();
  });

  // 💸 Send Money Handler
  document.getElementById('sendMoneyForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearErrors();

    const recipientPhone = this.recipientPhone.value.trim();
    const amount = parseFloat(this.amount.value);
    const accountType = this.accountType.value;

    if (isNaN(amount) || amount <= 0) {
      document.getElementById('sendMoneyError').textContent = 'Please enter a valid amount.';
      return;
    }

    try {
      const senderRef = db.collection("users").doc(currentUser);
      const senderDoc = await senderRef.get();
      const senderData = senderDoc.data();

      if (senderData.balance < amount) {
        document.getElementById('sendMoneyError').textContent = 'Insufficient balance.';
        return;
      }

      await senderRef.update({ balance: senderData.balance - amount });

      if (accountType === 'user') {
        const recipientQuery = await db.collection("users").where("phone", "==", recipientPhone).get();
        if (recipientQuery.empty) {
          document.getElementById('sendMoneyError').textContent = 'Recipient user not found.';
          return;
        }        
        const recipientRef = recipientQuery.docs[0].ref;
        const recipientData = recipientQuery.docs[0].data();

        await recipientRef.update({
          balance: recipientData.balance + amount,
          notifications: firebase.firestore.FieldValue.arrayUnion({
            from: senderData.firstName,
            message: `Wakutumizirani MK ${amount.toFixed(2)}.`
          })
        });
      }

      document.getElementById('sendMoneySuccess').textContent = `Money sent to ${accountType.toUpperCase()} account successfully!`;
      renderDashboard();
      this.reset();
    } catch (error) {
      document.getElementById('sendMoneyError').textContent = error.message;
    }
  });

  // 🚪 Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await auth.signOut();
    currentUser = null;
    notifications = [];
    showLogin();
  });

  // 🟢 Default View
  showlogin();
});
