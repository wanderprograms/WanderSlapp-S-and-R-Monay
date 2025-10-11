async function sendMoney(senderUID, senderPhone, receiverPhone, amount) {
  const senderRef = db.collection("users").doc(senderUID);
  const senderDoc = await senderRef.get();
  const senderBalance = senderDoc.data().balance;

  if (senderBalance < amount) {
    alert("Simungatumize: ndalama zochepa.");
    return;
  }

  // Update sender balance
  await senderRef.update({
    balance: senderBalance - amount
  });

  // Pezani receiver UID
  const receiverSnapshot = await db.collection("users")
    .where("phone", "==", receiverPhone)
    .get();

  if (!receiverSnapshot.empty) {
    const receiverDoc = receiverSnapshot.docs[0];
    const receiverUID = receiverDoc.id;
    const receiverBalance = receiverDoc.data().balance;

    // Update receiver balance
    await db.collection("users").doc(receiverUID).update({
      balance: receiverBalance + amount,
      notifications: firebase.firestore.FieldValue.arrayUnion({
        type: "received",
        amount,
        from: senderPhone,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      })
    });
  }
   
  const receiverSnapshot = await db.collection("users")
   .where("phone", "==", receiverPhone)
   .get();

 if (receiverSnapshot.empty) {
    alert("Nambala yomwe mwalowetsa ilibe account. Chonde onetsetsani.");
    return; // Sititumiza ndalama
}
  // Refresh sender balance on UI
  refreshBalance(senderUID);
  alert("Ndalama zatumizidwa bwino!");
}

